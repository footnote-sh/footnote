/**
 * Track intervention outcomes and user responses
 */

import type { InterventionRecord, InterventionStrategy } from '../types/state.js'
import { ProfileStore } from '../state/ProfileStore.js'

export type UserResponse = 'complied' | 'overrode' | 'ignored'

export interface TrackingEvent {
  trigger: InterventionRecord['trigger']
  strategyUsed: InterventionStrategy
  userResponse: UserResponse
  timeToRefocus: number // seconds
}

export class BehaviorTracker {
  constructor(private profileStore: ProfileStore) {}

  /**
   * Record an intervention outcome
   */
  recordIntervention(event: TrackingEvent): void {
    const record: InterventionRecord = {
      timestamp: new Date().toISOString(),
      trigger: event.trigger,
      style_used: event.strategyUsed,
      user_response: event.userResponse,
      time_to_refocus: event.timeToRefocus,
    }

    this.profileStore.addInterventionRecord(record)
  }

  /**
   * Get recent intervention history
   */
  getRecentHistory(limit: number = 20): InterventionRecord[] {
    const history = this.profileStore.getInterventionHistory()
    return history.slice(-limit)
  }

  /**
   * Get intervention history for specific strategy
   */
  getHistoryForStrategy(strategy: InterventionStrategy): InterventionRecord[] {
    const history = this.profileStore.getInterventionHistory()
    return history.filter((record) => record.style_used === strategy)
  }

  /**
   * Get intervention history for specific trigger
   */
  getHistoryForTrigger(trigger: InterventionRecord['trigger']): InterventionRecord[] {
    const history = this.profileStore.getInterventionHistory()
    return history.filter((record) => record.trigger === trigger)
  }

  /**
   * Calculate compliance rate for a strategy
   */
  getComplianceRate(strategy: InterventionStrategy, recentCount: number = 10): number {
    const history = this.getHistoryForStrategy(strategy).slice(-recentCount)

    if (history.length === 0) {
      return 0
    }

    const complied = history.filter((record) => record.user_response === 'complied').length

    return complied / history.length
  }

  /**
   * Calculate average time to refocus for a strategy
   */
  getAverageRefocusTime(strategy: InterventionStrategy, recentCount: number = 10): number {
    const history = this.getHistoryForStrategy(strategy).slice(-recentCount)

    if (history.length === 0) {
      return 0
    }

    const totalTime = history.reduce((sum, record) => sum + record.time_to_refocus, 0)

    return totalTime / history.length
  }

  /**
   * Get response pattern breakdown for a strategy
   */
  getResponsePattern(
    strategy: InterventionStrategy,
    recentCount: number = 20
  ): Record<UserResponse, number> {
    const history = this.getHistoryForStrategy(strategy).slice(-recentCount)

    const pattern: Record<UserResponse, number> = {
      complied: 0,
      overrode: 0,
      ignored: 0,
    }

    for (const record of history) {
      pattern[record.user_response]++
    }

    return pattern
  }

  /**
   * Detect if user is consistently overriding a strategy
   */
  isStrategyBeingRejected(strategy: InterventionStrategy, threshold: number = 0.7): boolean {
    const pattern = this.getResponsePattern(strategy, 10)
    const total = pattern.complied + pattern.overrode + pattern.ignored

    if (total < 5) {
      // Not enough data
      return false
    }

    const rejectionRate = (pattern.overrode + pattern.ignored) / total
    return rejectionRate >= threshold
  }

  /**
   * Get trigger frequency distribution
   */
  getTriggerFrequency(daysBack: number = 7): Record<string, number> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysBack)

    const history = this.profileStore.getInterventionHistory()
    const recentHistory = history.filter((record) => new Date(record.timestamp) >= cutoff)

    const frequency: Record<string, number> = {
      shiny_object: 0,
      planning_procrastination: 0,
      context_switch: 0,
      research_rabbit_hole: 0,
    }

    for (const record of recentHistory) {
      frequency[record.trigger]++
    }

    return frequency
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(): {
    totalInterventions: number
    overallComplianceRate: number
    averageRefocusTime: number
    mostCommonTrigger: string
    strategiesUsed: Record<InterventionStrategy, number>
  } {
    const history = this.profileStore.getInterventionHistory()

    const totalInterventions = history.length
    const complied = history.filter((r) => r.user_response === 'complied').length
    const overallComplianceRate = totalInterventions > 0 ? complied / totalInterventions : 0

    const totalRefocusTime = history.reduce((sum, r) => sum + r.time_to_refocus, 0)
    const averageRefocusTime = totalInterventions > 0 ? totalRefocusTime / totalInterventions : 0

    const triggerCounts: Record<string, number> = {}
    const strategyCounts: Record<InterventionStrategy, number> = {
      hard_block: 0,
      accountability: 0,
      micro_task: 0,
      time_boxed: 0,
    }

    for (const record of history) {
      triggerCounts[record.trigger] = (triggerCounts[record.trigger] || 0) + 1
      strategyCounts[record.style_used]++
    }

    const mostCommonTrigger =
      Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'

    return {
      totalInterventions,
      overallComplianceRate,
      averageRefocusTime,
      mostCommonTrigger,
      strategiesUsed: strategyCounts,
    }
  }
}
