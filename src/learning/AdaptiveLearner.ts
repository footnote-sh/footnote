/**
 * Core adaptive learning logic
 * Detects patterns and shifts strategies quietly
 */

import type { InterventionStrategy } from '../types/state.js'
import { ProfileStore } from '../state/ProfileStore.js'
import { BehaviorTracker } from './BehaviorTracker.js'
import { EffectivenessCalculator } from './EffectivenessCalculator.js'
import { StrategySelector } from './StrategySelector.js'

export interface AdaptationEvent {
  timestamp: string
  from_strategy: InterventionStrategy
  to_strategy: InterventionStrategy
  reason: string
  confidence: number // 0-1
}

export class AdaptiveLearner {
  constructor(
    private profileStore: ProfileStore,
    private behaviorTracker: BehaviorTracker
  ) {}

  /**
   * Main adaptation check - run periodically
   * Returns true if strategy was changed
   */
  checkAndAdapt(): AdaptationEvent | null {
    const profile = this.profileStore.get()
    if (!profile || !profile.learning.adaptation_enabled) {
      return null
    }

    const currentStrategy = profile.behavior_tracking.current_strategy

    // Need minimum data to adapt (at least 10 interventions with current strategy)
    const currentHistory = this.behaviorTracker.getHistoryForStrategy(currentStrategy)
    if (currentHistory.length < 10) {
      return null // Not enough data yet
    }

    // Check if current strategy needs adjustment
    const needsChange = EffectivenessCalculator.needsAdjustment(currentHistory)
    if (!needsChange) {
      return null // Current strategy is working fine
    }

    // Get all strategy histories
    const allHistories = {
      hard_block: this.behaviorTracker.getHistoryForStrategy('hard_block'),
      accountability: this.behaviorTracker.getHistoryForStrategy('accountability'),
      micro_task: this.behaviorTracker.getHistoryForStrategy('micro_task'),
      time_boxed: this.behaviorTracker.getHistoryForStrategy('time_boxed'),
    }

    // Find better strategy
    const recommended = EffectivenessCalculator.recommendStrategy(allHistories, currentStrategy)

    if (!recommended) {
      return null // No better alternative found
    }

    // Calculate confidence in recommendation
    const confidence = this.calculateConfidence(allHistories, currentStrategy, recommended)

    // Only adapt if confidence is high enough (>70%)
    if (confidence < 0.7) {
      return null
    }

    // Perform adaptation
    this.profileStore.updateStrategy(recommended)

    const event: AdaptationEvent = {
      timestamp: new Date().toISOString(),
      from_strategy: currentStrategy,
      to_strategy: recommended,
      reason: this.generateReason(allHistories, currentStrategy, recommended),
      confidence,
    }

    return event
  }

  /**
   * Force adaptation to specific strategy (for testing or manual override)
   */
  forceAdapt(newStrategy: InterventionStrategy, reason: string): AdaptationEvent {
    const profile = this.profileStore.get()
    if (!profile) {
      throw new Error('No profile found')
    }

    const currentStrategy = profile.behavior_tracking.current_strategy

    this.profileStore.updateStrategy(newStrategy)

    return {
      timestamp: new Date().toISOString(),
      from_strategy: currentStrategy,
      to_strategy: newStrategy,
      reason: `Manual override: ${reason}`,
      confidence: 1.0,
    }
  }

  /**
   * Calculate confidence in strategy recommendation
   */
  private calculateConfidence(
    histories: Record<InterventionStrategy, any[]>,
    currentStrategy: InterventionStrategy,
    recommendedStrategy: InterventionStrategy
  ): number {
    const currentScore = EffectivenessCalculator.calculateScore(histories[currentStrategy])
    const recommendedScore = EffectivenessCalculator.calculateScore(histories[recommendedStrategy])

    // Data sufficiency
    const recommendedDataCount = histories[recommendedStrategy].length
    const dataConfidence = Math.min(recommendedDataCount / 20, 1) // Max confidence at 20+ records

    // Score improvement
    const improvement = recommendedScore - currentScore
    const improvementConfidence = Math.min(improvement / 0.5, 1) // Max confidence at 50%+ improvement

    // Combined confidence (average)
    return (dataConfidence + improvementConfidence) / 2
  }

  /**
   * Generate human-readable reason for adaptation
   */
  private generateReason(
    histories: Record<InterventionStrategy, any[]>,
    from: InterventionStrategy,
    to: InterventionStrategy
  ): string {
    const fromMetrics = EffectivenessCalculator.calculateMetrics(histories[from])
    const toMetrics = EffectivenessCalculator.calculateMetrics(histories[to])

    const reasons: string[] = []

    if (fromMetrics.complianceRate < 0.5) {
      reasons.push('low compliance with current approach')
    }

    if (fromMetrics.overrideRate > 0.4) {
      reasons.push('frequently overriding current strategy')
    }

    if (fromMetrics.recentTrend === 'declining') {
      reasons.push('declining effectiveness')
    }

    if (toMetrics.complianceRate > fromMetrics.complianceRate + 0.2) {
      reasons.push(
        `${to} shows ${Math.round((toMetrics.complianceRate - fromMetrics.complianceRate) * 100)}% better compliance`
      )
    }

    return reasons.join('; ')
  }

  /**
   * Get current effectiveness scores for all strategies
   */
  getCurrentEffectiveness(): Record<InterventionStrategy, number> {
    const strategies: InterventionStrategy[] = [
      'hard_block',
      'accountability',
      'micro_task',
      'time_boxed',
    ]

    const effectiveness: Record<InterventionStrategy, number> = {
      hard_block: 0,
      accountability: 0,
      micro_task: 0,
      time_boxed: 0,
    }

    for (const strategy of strategies) {
      const history = this.behaviorTracker.getHistoryForStrategy(strategy)
      effectiveness[strategy] = EffectivenessCalculator.calculateScore(history)
    }

    return effectiveness
  }

  /**
   * Check if ready for adaptation (has enough data)
   */
  isReadyForAdaptation(): boolean {
    const profile = this.profileStore.get()
    if (!profile) {
      return false
    }

    const totalHistory = this.behaviorTracker.getRecentHistory(100)
    return totalHistory.length >= 20 // Need at least 20 total interventions
  }

  /**
   * Get time since last adaptation
   */
  getDaysSinceLastAdaptation(): number {
    const profile = this.profileStore.get()
    if (!profile) {
      return 0
    }

    const lastAdapted = new Date(profile.behavior_tracking.last_adapted)
    const now = new Date()
    const diffMs = now.getTime() - lastAdapted.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    return Math.floor(diffDays)
  }
}
