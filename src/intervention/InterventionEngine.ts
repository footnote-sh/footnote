/**
 * Main intervention decision engine
 * Selects and applies personalized interventions based on user profile
 */

import type { UserProfile } from '../types/state.js'
import type {
  InterventionContext,
  InterventionResult,
  StrategyInterface,
} from '../types/intervention.js'
import { HardBlockStrategy } from './strategies/HardBlockStrategy.js'
import { AccountabilityStrategy } from './strategies/AccountabilityStrategy.js'
import { MicroTaskStrategy } from './strategies/MicroTaskStrategy.js'
import { TimeBoxedStrategy } from './strategies/TimeBoxedStrategy.js'

export class InterventionEngine {
  private strategies: Map<string, StrategyInterface>

  constructor() {
    this.strategies = new Map<string, StrategyInterface>([
      ['hard_block', new HardBlockStrategy()],
      ['accountability', new AccountabilityStrategy()],
      ['micro_task', new MicroTaskStrategy()],
      ['time_boxed', new TimeBoxedStrategy()],
    ])
  }

  /**
   * Select and execute appropriate intervention based on profile and context
   */
  selectIntervention(
    profile: UserProfile,
    trigger: InterventionContext['trigger'],
    currentActivity: string,
    commitment: string
  ): InterventionResult {
    const context = this.buildContext(profile, trigger, currentActivity, commitment)

    // Get primary and fallback strategies from profile
    const primaryStrategy = this.strategies.get(profile.behavior_tracking.current_strategy)
    const fallbackStrategy = this.strategies.get(profile.intervention_style.fallback)

    // Try primary strategy first
    if (primaryStrategy?.canHandle(context)) {
      return primaryStrategy.execute(context)
    }

    // Fall back to fallback strategy
    if (fallbackStrategy?.canHandle(context)) {
      return fallbackStrategy.execute(context)
    }

    // Last resort: accountability (always works)
    const accountability = this.strategies.get('accountability')!
    return accountability.execute(context)
  }

  /**
   * Get all strategies that can handle a given context
   */
  getApplicableStrategies(
    profile: UserProfile,
    trigger: InterventionContext['trigger'],
    currentActivity: string,
    commitment: string
  ): string[] {
    const context = this.buildContext(profile, trigger, currentActivity, commitment)

    return Array.from(this.strategies.entries())
      .filter(([_, strategy]) => strategy.canHandle(context))
      .map(([name, _]) => name)
  }

  /**
   * Test a specific strategy against context
   */
  testStrategy(
    strategyName: string,
    profile: UserProfile,
    trigger: InterventionContext['trigger'],
    currentActivity: string,
    commitment: string
  ): InterventionResult | null {
    const strategy = this.strategies.get(strategyName)
    if (!strategy) {
      return null
    }

    const context = this.buildContext(profile, trigger, currentActivity, commitment)

    if (!strategy.canHandle(context)) {
      return null
    }

    return strategy.execute(context)
  }

  /**
   * Build intervention context from profile and situation
   */
  private buildContext(
    profile: UserProfile,
    trigger: InterventionContext['trigger'],
    currentActivity: string,
    commitment: string
  ): InterventionContext {
    const now = new Date()
    const timeOfDay = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM

    return {
      trigger,
      currentActivity,
      commitment,
      timeOfDay,
      userProfile: {
        strategy: profile.behavior_tracking.current_strategy,
        tone: profile.communication.tone,
        formality: profile.communication.formality,
        patterns: {
          planning_instead_of_doing: profile.procrastination_patterns.planning_instead_of_doing,
          research_rabbit_holes: profile.procrastination_patterns.research_rabbit_holes,
          tool_setup_dopamine: profile.procrastination_patterns.tool_setup_dopamine,
          meeting_avoidance: profile.procrastination_patterns.meeting_avoidance,
        },
      },
    }
  }

  /**
   * Get strategy instance (for testing/debugging)
   */
  getStrategy(name: string): StrategyInterface | undefined {
    return this.strategies.get(name)
  }

  /**
   * Register custom strategy
   */
  registerStrategy(name: string, strategy: StrategyInterface): void {
    this.strategies.set(name, strategy)
  }
}
