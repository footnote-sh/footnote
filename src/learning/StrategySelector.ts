/**
 * Select best strategy based on effectiveness history
 */

import type { InterventionStrategy, InterventionRecord } from '../types/state.js'
import { EffectivenessCalculator } from './EffectivenessCalculator.js'

export interface StrategyRecommendation {
  strategy: InterventionStrategy
  score: number
  reason: string
  confidence: number
}

export class StrategySelector {
  /**
   * Select best strategy for a given trigger type
   */
  static selectForTrigger(
    trigger: InterventionRecord['trigger'],
    histories: Record<InterventionStrategy, InterventionRecord[]>
  ): StrategyRecommendation {
    // Filter histories by trigger type
    const triggerHistories: Record<InterventionStrategy, InterventionRecord[]> = {
      hard_block: histories.hard_block.filter((r) => r.trigger === trigger),
      accountability: histories.accountability.filter((r) => r.trigger === trigger),
      micro_task: histories.micro_task.filter((r) => r.trigger === trigger),
      time_boxed: histories.time_boxed.filter((r) => r.trigger === trigger),
    }

    // Calculate scores for each strategy with this trigger
    const comparisons = EffectivenessCalculator.compareStrategies(triggerHistories)

    if (comparisons.length === 0 || comparisons[0].score === 0) {
      // No data yet, use defaults based on trigger type
      return this.getDefaultForTrigger(trigger)
    }

    const best = comparisons[0]
    const dataCount = triggerHistories[best.strategy].length
    const confidence = Math.min(dataCount / 10, 1) // Max confidence at 10+ records

    return {
      strategy: best.strategy,
      score: best.score,
      reason: `Best performing strategy for ${trigger} trigger`,
      confidence,
    }
  }

  /**
   * Get default strategy for trigger when no data exists
   */
  private static getDefaultForTrigger(
    trigger: InterventionRecord['trigger']
  ): StrategyRecommendation {
    const defaults: Record<typeof trigger, InterventionStrategy> = {
      shiny_object: 'time_boxed',
      planning_procrastination: 'micro_task',
      context_switch: 'accountability',
      research_rabbit_hole: 'time_boxed',
    }

    return {
      strategy: defaults[trigger],
      score: 0.5, // Neutral score for default
      reason: `Default strategy for ${trigger} (no history yet)`,
      confidence: 0.3, // Low confidence for default
    }
  }

  /**
   * Select strategy based on time of day and recent patterns
   */
  static selectForContext(
    timeOfDay: string,
    recentTriggers: InterventionRecord['trigger'][],
    histories: Record<InterventionStrategy, InterventionRecord[]>
  ): StrategyRecommendation {
    const hour = parseInt(timeOfDay.split(':')[0])

    // Early morning: Be gentle (accountability or micro-task)
    if (hour < 10) {
      return this.selectBetween(['accountability', 'micro_task'], histories, 'Early morning')
    }

    // Late afternoon/evening: Be firm (hard_block or time_boxed)
    if (hour >= 16) {
      return this.selectBetween(
        ['hard_block', 'time_boxed'],
        histories,
        'Late afternoon/evening (fatigue)'
      )
    }

    // Mid-day: Most effective overall
    const all = EffectivenessCalculator.compareStrategies(histories)
    const best = all[0] || { strategy: 'accountability' as InterventionStrategy, score: 0.5 }

    return {
      strategy: best.strategy,
      score: best.score,
      reason: 'Peak productivity hours - using most effective strategy',
      confidence: 0.8,
    }
  }

  /**
   * Select best strategy from a subset
   */
  private static selectBetween(
    strategies: InterventionStrategy[],
    histories: Record<InterventionStrategy, InterventionRecord[]>,
    reason: string
  ): StrategyRecommendation {
    const subset: Record<InterventionStrategy, InterventionRecord[]> = {} as any

    for (const strategy of strategies) {
      subset[strategy] = histories[strategy]
    }

    const comparisons = EffectivenessCalculator.compareStrategies(subset)
    const best = comparisons[0] || { strategy: strategies[0], score: 0.5 }

    return {
      strategy: best.strategy,
      score: best.score,
      reason,
      confidence: 0.7,
    }
  }

  /**
   * Detect if user has strong preference (via compliance patterns)
   */
  static detectPreference(
    histories: Record<InterventionStrategy, InterventionRecord[]>
  ): StrategyRecommendation | null {
    const comparisons = EffectivenessCalculator.compareStrategies(histories)

    if (comparisons.length < 2) {
      return null // Not enough strategies tried
    }

    const best = comparisons[0]
    const secondBest = comparisons[1]

    // Strong preference if:
    // 1. Best strategy has >80% compliance
    // 2. Gap to second best is >30%
    // 3. At least 10 data points

    const hasStrongScore = best.score > 0.8
    const hasSignificantGap = best.score - secondBest.score > 0.3
    const hasEnoughData = histories[best.strategy].length >= 10

    if (hasStrongScore && hasSignificantGap && hasEnoughData) {
      return {
        strategy: best.strategy,
        score: best.score,
        reason: 'Strong user preference detected',
        confidence: 0.95,
      }
    }

    return null
  }

  /**
   * Select strategy for experimentation (try underused strategies)
   */
  static selectForExploration(
    histories: Record<InterventionStrategy, InterventionRecord[]>,
    currentStrategy: InterventionStrategy
  ): StrategyRecommendation | null {
    // Find strategies with <10 data points
    const underusedStrategies = Object.entries(histories)
      .filter(([strategy, history]) => history.length < 10 && strategy !== currentStrategy)
      .map(([strategy, _]) => strategy as InterventionStrategy)

    if (underusedStrategies.length === 0) {
      return null // All strategies well-tested
    }

    // Pick random underused strategy
    const strategy = underusedStrategies[Math.floor(Math.random() * underusedStrategies.length)]

    return {
      strategy,
      score: 0.5, // Neutral
      reason: 'Exploring underused strategy to gather more data',
      confidence: 0.4,
    }
  }
}
