/**
 * Main alignment detection logic
 * Analyzes if a user's coding request aligns with their daily commitment
 */

import type {
  HookRequest,
  HookResponse,
  Intervention,
  InterventionOption,
} from '../../types/hook.js'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'
import type { UserProfile } from '../../types/state.js'
import { CommitmentStore } from '../../state/CommitmentStore.js'
import { AnalyzerFactory, type AnalyzerProvider } from '../analyzers/AnalyzerFactory.js'
import {
  buildInterventionMessage,
  buildWarningMessage,
  buildCaptureSuggestion,
  buildFindFunMessage,
  buildOverrideWarning,
} from './prompt-templates.js'

export interface AlignmentAnalyzerConfig {
  commitmentStore: CommitmentStore
  profile?: UserProfile
  preferredAnalyzer?: AnalyzerProvider
}

export class AlignmentAnalyzer {
  private commitmentStore: CommitmentStore
  private profile?: UserProfile
  private preferredAnalyzer?: AnalyzerProvider

  constructor(config: AlignmentAnalyzerConfig) {
    this.commitmentStore = config.commitmentStore
    this.profile = config.profile
    this.preferredAnalyzer = config.preferredAnalyzer
  }

  /**
   * Analyze a hook request and generate response with intervention if needed
   */
  async analyze(request: HookRequest): Promise<HookResponse> {
    try {
      // Get today's commitment
      const commitment = this.commitmentStore.getToday()

      if (!commitment) {
        // No commitment set - allow but suggest setting one
        return {
          action: 'allow',
          severity: 'LOW',
          type: 'aligned',
          message: '=� Tip: Set a daily commitment with `footnote focus` to stay on track',
        }
      }

      // Build analysis context
      const analysisContext: AnalysisContext = {
        commitment: commitment.mainThought,
        request: request.request,
        context: {
          current_file: request.context.current_file,
          git_branch: request.context.git_branch,
          recent_commits: request.context.recent_commits,
        },
      }

      // Get analyzer and run analysis
      const analyzer = AnalyzerFactory.createAuto(this.preferredAnalyzer)
      const result = await analyzer.analyze(analysisContext)

      // Map analysis result to hook response
      return this.mapToHookResponse(commitment.mainThought, request.request, result)
    } catch (error) {
      // On error, fail open (allow) but log the error
      console.error('Alignment analysis error:', error)

      return {
        action: 'allow',
        severity: 'LOW',
        type: 'aligned',
        message: '� Analysis failed - proceeding anyway',
      }
    }
  }

  /**
   * Map AnalysisResult to HookResponse with intervention
   */
  private mapToHookResponse(
    commitment: string,
    request: string,
    result: AnalysisResult
  ): HookResponse {
    // LOW severity - always allow
    if (result.severity === 'LOW') {
      return {
        action: 'allow',
        severity: 'LOW',
        type: result.type,
      }
    }

    // MEDIUM severity - warn but allow
    if (result.severity === 'MEDIUM') {
      const tone = this.profile?.communication.tone || 'gentle'
      const message = buildWarningMessage(commitment, request, result.reasoning)

      return {
        action: 'warn',
        severity: 'MEDIUM',
        type: result.type,
        message,
      }
    }

    // HIGH severity - block with intervention
    if (result.severity === 'HIGH') {
      const tone = this.profile?.communication.tone || 'gentle'
      const intervention = this.buildIntervention(commitment, request, result, tone)

      return {
        action: 'block',
        severity: 'HIGH',
        type: result.type,
        intervention,
      }
    }

    // Fallback
    return {
      action: 'allow',
      severity: 'LOW',
      type: result.type,
    }
  }

  /**
   * Build intervention with personalized options
   */
  private buildIntervention(
    commitment: string,
    request: string,
    result: AnalysisResult,
    tone: 'direct' | 'gentle' | 'teaching' | 'curious'
  ): Intervention {
    const title = this.getInterventionTitle(result.type)
    const message = buildInterventionMessage(commitment, request, result.reasoning, tone)
    const options = this.buildInterventionOptions(result.type)

    return {
      title,
      commitment,
      request,
      reasoning: result.reasoning,
      options,
    }
  }

  /**
   * Get intervention title based on analysis type
   */
  private getInterventionTitle(type: string): string {
    switch (type) {
      case 'shiny_object':
        return '( Shiny Object Detected'
      case 'context_switch':
        return '= Context Switch Alert'
      case 'productive_procrastination':
        return '=� Productive Procrastination'
      case 'enhancement':
        return '<� Enhancement Detour'
      default:
        return '� Focus Check'
    }
  }

  /**
   * Build intervention options with descriptions
   */
  private buildInterventionOptions(type: string): InterventionOption[] {
    const baseOptions: InterventionOption[] = [
      {
        id: 'refocus',
        label: '<� Return to main task',
        description: 'Stay focused on your commitment',
        action: 'refocus',
      },
      {
        id: 'capture',
        label: '=� Capture as footnote',
        description: 'Save this idea for later',
        action: 'capture',
      },
    ]

    // Add "find the fun" option for procrastination patterns
    if (type === 'productive_procrastination' || type === 'shiny_object') {
      baseOptions.push({
        id: 'find_fun',
        label: '<� Find the fun in main task',
        description: 'Explore what makes your commitment interesting',
        action: 'find_fun',
      })
    }

    // Always include override option
    baseOptions.push({
      id: 'override',
      label: '� Override (will log)',
      description: 'Proceed anyway - this will be tracked',
      action: 'override',
    })

    return baseOptions
  }

  /**
   * Handle user's intervention response
   */
  async handleInterventionResponse(
    action: 'refocus' | 'capture' | 'find_fun' | 'override',
    context: { commitment: string; request: string }
  ): Promise<{ message: string; captured?: boolean }> {
    switch (action) {
      case 'refocus':
        return {
          message: ` Great choice! Your focus: *${context.commitment}*`,
        }

      case 'capture':
        // Capture as footnote
        const captured = this.commitmentStore.addFootnote(context.request)
        return {
          message: buildCaptureSuggestion(context.request),
          captured: !!captured,
        }

      case 'find_fun':
        return {
          message: buildFindFunMessage(context.commitment),
        }

      case 'override':
        // Log the override (TODO: Add to intervention history)
        return {
          message: buildOverrideWarning(),
        }

      default:
        return {
          message: 'Invalid action',
        }
    }
  }
}
