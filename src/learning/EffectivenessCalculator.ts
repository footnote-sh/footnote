/**
 * Calculate intervention effectiveness scores
 * Combines compliance rate, refocus time, and user satisfaction
 */

import type { InterventionStrategy, InterventionRecord } from '../types/state.js'

export interface EffectivenessMetrics {
  complianceRate: number // 0-1: How often user complies
  averageRefocusTime: number // seconds: How quickly user refocuses
  overrideRate: number // 0-1: How often user explicitly overrides
  ignoreRate: number // 0-1: How often user ignores intervention
  recentTrend: 'improving' | 'declining' | 'stable' // Trend over time
}

export class EffectivenessCalculator {
  /**
   * Calculate comprehensive effectiveness score (0-1)
   */
  static calculateScore(history: InterventionRecord[]): number {
    if (history.length === 0) {
      return 0
    }

    const metrics = this.calculateMetrics(history)

    // Weighted effectiveness calculation
    const weights = {
      compliance: 0.4, // Most important: did it work?
      refocusSpeed: 0.3, // How quickly did they get back on track?
      override: -0.2, // Explicit rejection is bad
      ignore: -0.1, // Ignoring is less bad than overriding
    }

    // Normalize refocus time (lower is better, capped at 5 minutes)
    const maxRefocusTime = 300 // 5 minutes
    const normalizedRefocusTime =
      Math.min(metrics.averageRefocusTime, maxRefocusTime) / maxRefocusTime
    const refocusScore = 1 - normalizedRefocusTime // Invert: faster = better

    const score =
      weights.compliance * metrics.complianceRate +
      weights.refocusSpeed * refocusScore +
      weights.override * metrics.overrideRate +
      weights.ignore * metrics.ignoreRate

    // Clamp to 0-1
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate detailed metrics for a strategy
   */
  static calculateMetrics(history: InterventionRecord[]): EffectivenessMetrics {
    if (history.length === 0) {
      return {
        complianceRate: 0,
        averageRefocusTime: 0,
        overrideRate: 0,
        ignoreRate: 0,
        recentTrend: 'stable',
      }
    }

    const complied = history.filter((r) => r.user_response === 'complied').length
    const overrode = history.filter((r) => r.user_response === 'overrode').length
    const ignored = history.filter((r) => r.user_response === 'ignored').length

    const total = history.length

    const complianceRate = complied / total
    const overrideRate = overrode / total
    const ignoreRate = ignored / total

    const totalRefocusTime = history.reduce((sum, r) => sum + r.time_to_refocus, 0)
    const averageRefocusTime = totalRefocusTime / total

    const recentTrend = this.calculateTrend(history)

    return {
      complianceRate,
      averageRefocusTime,
      overrideRate,
      ignoreRate,
      recentTrend,
    }
  }

  /**
   * Calculate trend direction by comparing recent vs older performance
   */
  private static calculateTrend(
    history: InterventionRecord[]
  ): 'improving' | 'declining' | 'stable' {
    if (history.length < 10) {
      return 'stable' // Not enough data
    }

    const midpoint = Math.floor(history.length / 2)
    const olderHalf = history.slice(0, midpoint)
    const recentHalf = history.slice(midpoint)

    const olderScore = this.calculateScore(olderHalf)
    const recentScore = this.calculateScore(recentHalf)

    const difference = recentScore - olderScore

    if (difference > 0.1) return 'improving'
    if (difference < -0.1) return 'declining'
    return 'stable'
  }

  /**
   * Compare effectiveness across strategies
   */
  static compareStrategies(
    histories: Record<InterventionStrategy, InterventionRecord[]>
  ): Array<{ strategy: InterventionStrategy; score: number; metrics: EffectivenessMetrics }> {
    const comparisons = Object.entries(histories).map(([strategy, history]) => ({
      strategy: strategy as InterventionStrategy,
      score: this.calculateScore(history),
      metrics: this.calculateMetrics(history),
    }))

    // Sort by score descending
    return comparisons.sort((a, b) => b.score - a.score)
  }

  /**
   * Determine if a strategy needs adjustment
   */
  static needsAdjustment(history: InterventionRecord[], threshold: number = 0.4): boolean {
    const score = this.calculateScore(history)
    const metrics = this.calculateMetrics(history)

    // Needs adjustment if:
    // 1. Score is below threshold
    // 2. Trend is declining
    // 3. Override rate is too high (>50%)

    return score < threshold || metrics.recentTrend === 'declining' || metrics.overrideRate > 0.5
  }

  /**
   * Get recommended strategy based on effectiveness
   */
  static recommendStrategy(
    histories: Record<InterventionStrategy, InterventionRecord[]>,
    currentStrategy: InterventionStrategy
  ): InterventionStrategy | null {
    const comparisons = this.compareStrategies(histories)

    // Find best performing strategy
    const best = comparisons[0]

    // Only recommend change if:
    // 1. Best strategy is different from current
    // 2. Best strategy has significantly better score (>20% improvement)
    // 3. Best strategy has enough data (>5 records)

    const currentScore = this.calculateScore(histories[currentStrategy] || [])
    const improvement = best.score - currentScore

    const hasEnoughData = histories[best.strategy]?.length >= 5

    if (best.strategy !== currentStrategy && improvement > 0.2 && hasEnoughData) {
      return best.strategy
    }

    return null // No change recommended
  }
}
