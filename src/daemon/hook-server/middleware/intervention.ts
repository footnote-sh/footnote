/**
 * Intervention middleware for hook server
 * Applies personalized intervention engine to analysis results
 */

import type { AnalysisResult } from '../../../types/analysis.js'
import type { HookResponse, Intervention, InterventionOption } from '../../../types/hook.js'
import type { UserProfile } from '../../../types/state.js'
import { InterventionEngine } from '../../../intervention/InterventionEngine.js'
import { InterventionFormatter } from '../../../intervention/InterventionFormatter.js'
import { FindTheFun } from '../../../intervention/FindTheFun.js'
import { BehaviorTracker } from '../../../learning/BehaviorTracker.js'
import { ProfileStore } from '../../../state/ProfileStore.js'
import { StateManager } from '../../../state/StateManager.js'

/**
 * Map analysis type to intervention trigger
 */
function mapAnalysisTypeToTrigger(
  analysisType: AnalysisResult['type']
): 'shiny_object' | 'planning_procrastination' | 'context_switch' | 'research_rabbit_hole' {
  const mapping = {
    shiny_object: 'shiny_object' as const,
    context_switch: 'context_switch' as const,
    productive_procrastination: 'planning_procrastination' as const,
    enhancement: 'context_switch' as const,
    aligned: 'context_switch' as const, // Fallback, shouldn't be used
  }

  return mapping[analysisType] || 'context_switch'
}

/**
 * Intervention middleware class
 */
export class InterventionMiddleware {
  private engine: InterventionEngine
  private profileStore: ProfileStore
  private behaviorTracker: BehaviorTracker

  constructor(stateManager: StateManager) {
    this.engine = new InterventionEngine()
    this.profileStore = new ProfileStore(stateManager)
    this.behaviorTracker = new BehaviorTracker(this.profileStore)
  }

  /**
   * Apply personalized intervention to analysis result
   */
  applyIntervention(analysis: AnalysisResult, commitment: string, request: string): HookResponse {
    // If aligned, allow without intervention
    if (analysis.aligned) {
      return {
        action: 'allow',
        severity: 'LOW',
        type: 'aligned',
        message: 'This aligns with your commitment. Go ahead!',
      }
    }

    // Get user profile
    const profile = this.profileStore.get()
    if (!profile) {
      // No profile - use default intervention
      return this.buildDefaultIntervention(analysis, commitment, request)
    }

    // Map analysis type to intervention trigger
    const trigger = mapAnalysisTypeToTrigger(analysis.type)

    // Select personalized intervention
    const interventionResult = this.engine.selectIntervention(profile, trigger, request, commitment)

    // Format intervention message
    const formattedMessage = InterventionFormatter.format(interventionResult, profile)

    // Build intervention options
    const options = this.buildInterventionOptions(profile, interventionResult.action, commitment)

    // Determine hook action based on intervention type
    const hookAction = this.mapInterventionToHookAction(
      interventionResult.type,
      profile.intervention_style.primary
    )

    const intervention: Intervention = {
      title: interventionResult.message,
      commitment,
      request,
      reasoning: analysis.reasoning,
      options,
      formattedMessage, // Include formatted message for display
    }

    return {
      action: hookAction,
      severity: analysis.severity,
      type: analysis.type,
      message: formattedMessage,
      intervention,
    }
  }

  /**
   * Build intervention options based on profile and intervention type
   */
  private buildInterventionOptions(
    profile: UserProfile,
    interventionAction: 'block' | 'prompt' | 'suggest' | 'timebox',
    commitment: string
  ): InterventionOption[] {
    const options: InterventionOption[] = []

    // Refocus option (always available)
    options.push({
      id: 'refocus',
      label: 'Refocus',
      description: `Get back to: ${commitment}`,
      action: 'refocus',
    })

    // Capture option (for time-boxed and prompts)
    if (interventionAction === 'timebox' || interventionAction === 'prompt') {
      options.push({
        id: 'capture',
        label: 'Capture & Continue',
        description: 'Save this thought and stay focused',
        action: 'capture',
      })
    }

    // Find the fun option (if micro-task or struggling)
    if (interventionAction === 'suggest') {
      options.push({
        id: 'find_fun',
        label: 'Find the Fun',
        description: 'Make your commitment more engaging',
        action: 'find_fun',
      })
    }

    // Time-boxed option (if time-boxed intervention)
    if (interventionAction === 'timebox') {
      options.push({
        id: 'timebox',
        label: 'Set Timer',
        description: 'Explore for limited time, then refocus',
        action: 'timebox',
      })
    }

    // Override option (always available, but discouraged for hard_block)
    const overrideLabel =
      profile.behavior_tracking.current_strategy === 'hard_block'
        ? 'Override (breaks commitment)'
        : 'Override'

    options.push({
      id: 'override',
      label: overrideLabel,
      description: "I know what I'm doing",
      action: 'override',
    })

    return options
  }

  /**
   * Map intervention type to hook action
   */
  private mapInterventionToHookAction(
    interventionType: string,
    userStrategy: string
  ): 'allow' | 'warn' | 'block' {
    // Hard block strategy should block
    if (userStrategy === 'hard_block' || interventionType === 'hard_block') {
      return 'block'
    }

    // All others warn
    return 'warn'
  }

  /**
   * Build default intervention when no profile exists
   */
  private buildDefaultIntervention(
    analysis: AnalysisResult,
    commitment: string,
    request: string
  ): HookResponse {
    const messages: Record<string, string> = {
      shiny_object:
        'This looks like a shiny new object. Is this really what you committed to today?',
      context_switch: "You're switching context from your main commitment. Is this intentional?",
      productive_procrastination:
        'This might be productive procrastination. Are you avoiding the main task?',
      enhancement: "This is an enhancement to your main task. Consider if it's necessary now.",
      aligned: 'This aligns with your commitment.',
    }

    const options: InterventionOption[] = [
      {
        id: 'refocus',
        label: 'Refocus',
        description: 'Get back to your commitment',
        action: 'refocus',
      },
      {
        id: 'capture',
        label: 'Capture & Continue',
        description: 'Save this thought',
        action: 'capture',
      },
      {
        id: 'override',
        label: 'Override',
        description: "I know what I'm doing",
        action: 'override',
      },
    ]

    const intervention: Intervention = {
      title: messages[analysis.type],
      commitment,
      request,
      reasoning: analysis.reasoning,
      options,
    }

    return {
      action: 'warn',
      severity: analysis.severity,
      type: analysis.type,
      message: messages[analysis.type],
      intervention,
    }
  }

  /**
   * Record user response to intervention (for learning)
   */
  recordResponse(
    trigger:
      | 'shiny_object'
      | 'planning_procrastination'
      | 'context_switch'
      | 'research_rabbit_hole',
    strategyUsed: string,
    userAction: string,
    timeToRefocus: number
  ): void {
    const profile = this.profileStore.get()
    if (!profile) {
      return // No profile, can't record
    }

    // Map user action to response type
    let userResponse: 'complied' | 'overrode' | 'ignored' = 'overrode'
    if (userAction === 'refocus') {
      userResponse = 'complied'
    } else if (userAction === 'override') {
      userResponse = 'overrode'
    } else {
      userResponse = 'ignored'
    }

    // Record in behavior tracker
    this.behaviorTracker.recordIntervention({
      trigger,
      strategyUsed: strategyUsed as any,
      userResponse,
      timeToRefocus,
    })
  }

  /**
   * Get "Find the Fun" reframe for commitment
   */
  getFindTheFunReframe(commitment: string): string {
    const profile = this.profileStore.get()
    if (!profile) {
      return `Try this: Make "${commitment}" feel more fun or interesting!`
    }

    const reframe = FindTheFun.getBestReframe(commitment, profile)
    return FindTheFun.formatReframe(reframe, profile)
  }

  /**
   * Get current strategy effectiveness (for debugging/monitoring)
   */
  getCurrentEffectiveness(): Record<string, number> {
    const profile = this.profileStore.get()
    if (!profile) {
      return {}
    }

    return profile.behavior_tracking.effectiveness_scores
  }
}
