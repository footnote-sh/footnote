/**
 * Generate weekly insights about behavior patterns and adaptation
 * For optional visibility to users
 */

import type { InterventionStrategy, InterventionRecord } from '../types/state.js'
import { BehaviorTracker } from './BehaviorTracker.js'
import { EffectivenessCalculator } from './EffectivenessCalculator.js'
import { ProfileStore } from '../state/ProfileStore.js'

export interface WeeklyInsight {
  week: string // ISO date of week start
  generatedAt: string // ISO timestamp
  summary: {
    totalInterventions: number
    mostCommonTrigger: string
    overallCompliance: number
    currentStrategy: InterventionStrategy
  }
  patterns: string[] // Human-readable patterns detected
  adaptations: Array<{
    from: InterventionStrategy
    to: InterventionStrategy
    reason: string
  }>
  recommendations: string[]
}

export class InsightGenerator {
  constructor(
    private profileStore: ProfileStore,
    private behaviorTracker: BehaviorTracker
  ) {}

  /**
   * Generate insights for the past week
   */
  generateWeeklyInsight(): WeeklyInsight {
    const weekStart = this.getWeekStart()
    const weekHistory = this.getWeekHistory()

    return {
      week: weekStart.toISOString(),
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(weekHistory),
      patterns: this.detectPatterns(weekHistory),
      adaptations: this.getWeekAdaptations(),
      recommendations: this.generateRecommendations(weekHistory),
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(history: InterventionRecord[]): WeeklyInsight['summary'] {
    const profile = this.profileStore.get()
    const currentStrategy = profile?.behavior_tracking.current_strategy || 'accountability'

    const totalInterventions = history.length

    const triggerCounts: Record<string, number> = {}
    for (const record of history) {
      triggerCounts[record.trigger] = (triggerCounts[record.trigger] || 0) + 1
    }

    const mostCommonTrigger =
      Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'

    const complied = history.filter((r) => r.user_response === 'complied').length
    const overallCompliance = totalInterventions > 0 ? complied / totalInterventions : 0

    return {
      totalInterventions,
      mostCommonTrigger,
      overallCompliance,
      currentStrategy,
    }
  }

  /**
   * Detect behavior patterns from history
   */
  private detectPatterns(history: InterventionRecord[]): string[] {
    const patterns: string[] = []

    if (history.length === 0) {
      return ['No data yet - still learning your patterns']
    }

    // Time of day patterns
    const hourCounts: Record<number, number> = {}
    for (const record of history) {
      const hour = new Date(record.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (peakHour && hourCounts[parseInt(peakHour)] >= history.length * 0.3) {
      const hourNum = parseInt(peakHour)
      const timeOfDay = hourNum < 12 ? 'morning' : hourNum < 17 ? 'afternoon' : 'evening'
      patterns.push(`Most distractions happen in the ${timeOfDay} (around ${peakHour}:00)`)
    }

    // Trigger patterns
    const triggerCounts: Record<string, number> = {}
    for (const record of history) {
      triggerCounts[record.trigger] = (triggerCounts[record.trigger] || 0) + 1
    }

    const dominantTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]
    if (dominantTrigger && dominantTrigger[1] >= history.length * 0.4) {
      const triggerNames = {
        shiny_object: 'getting pulled into shiny new things',
        planning_procrastination: 'planning instead of doing',
        context_switch: 'context switching',
        research_rabbit_hole: 'research rabbit holes',
      }
      patterns.push(
        `Primary distraction pattern: ${triggerNames[dominantTrigger[0] as keyof typeof triggerNames]}`
      )
    }

    // Response patterns
    const overrideRate =
      history.filter((r) => r.user_response === 'overrode').length / history.length

    if (overrideRate > 0.3) {
      patterns.push('You often override interventions - considering gentler approaches')
    } else if (overrideRate < 0.1) {
      patterns.push("Interventions are working well - you're responsive to reminders")
    }

    // Refocus time patterns
    const avgRefocusTime = history.reduce((sum, r) => sum + r.time_to_refocus, 0) / history.length

    if (avgRefocusTime < 60) {
      patterns.push('You refocus quickly when reminded (usually < 1 minute)')
    } else if (avgRefocusTime > 300) {
      patterns.push('Refocusing takes time - might need stronger interventions')
    }

    // Day-of-week patterns
    const dayCounts: Record<number, number> = {}
    for (const record of history) {
      const day = new Date(record.timestamp).getDay()
      dayCounts[day] = (dayCounts[day] || 0) + 1
    }

    const maxDayCount = Math.max(...Object.values(dayCounts))
    const minDayCount = Math.min(...Object.values(dayCounts))

    if (maxDayCount > minDayCount * 2) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]
      const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      patterns.push(`${dayNames[parseInt(peakDay)]} is your highest-distraction day`)
    }

    return patterns
  }

  /**
   * Get adaptations that occurred this week
   */
  private getWeekAdaptations(): WeeklyInsight['adaptations'] {
    // This would require storing adaptation history
    // For now, just check if strategy changed
    const profile = this.profileStore.get()
    if (!profile) {
      return []
    }

    const lastAdapted = new Date(profile.behavior_tracking.last_adapted)
    const weekStart = this.getWeekStart()

    if (lastAdapted >= weekStart) {
      // Strategy changed this week
      return [
        {
          from: profile.intervention_style.primary,
          to: profile.behavior_tracking.current_strategy,
          reason: 'Adapted to improve effectiveness',
        },
      ]
    }

    return []
  }

  /**
   * Generate recommendations based on patterns
   */
  private generateRecommendations(history: InterventionRecord[]): string[] {
    const recommendations: string[] = []

    if (history.length < 5) {
      recommendations.push('Keep using Footnote - need more data to personalize recommendations')
      return recommendations
    }

    const metrics = EffectivenessCalculator.calculateMetrics(history)

    // Compliance-based recommendations
    if (metrics.complianceRate < 0.5) {
      recommendations.push(
        'Consider adjusting your intervention style in settings - current approach may be too harsh or gentle'
      )
    }

    // Override-based recommendations
    if (metrics.overrideRate > 0.4) {
      recommendations.push(
        'You frequently override interventions - try a gentler communication style'
      )
    }

    // Refocus time recommendations
    if (metrics.averageRefocusTime > 300) {
      recommendations.push(
        'Refocusing takes a while - consider stronger interventions or shorter time-boxes'
      )
    }

    // Trigger-specific recommendations
    const triggerFreq = this.behaviorTracker.getTriggerFrequency(7)
    const dominantTrigger = Object.entries(triggerFreq).sort((a, b) => b[1] - a[1])[0]

    if (dominantTrigger) {
      const triggerTips = {
        shiny_object: 'Keep a "later" list to capture ideas without derailing focus',
        planning_procrastination: 'Try the "2-minute rule" - if you can start in 2 min, do it now',
        context_switch: 'Use focus blocks with specific commitments per block',
        research_rabbit_hole: 'Set strict time limits before researching',
      }

      const tip = triggerTips[dominantTrigger[0] as keyof typeof triggerTips]
      if (tip) {
        recommendations.push(tip)
      }
    }

    // Trend-based recommendations
    if (metrics.recentTrend === 'declining') {
      recommendations.push('Effectiveness is declining - considering strategy adjustment')
    } else if (metrics.recentTrend === 'improving') {
      recommendations.push("Great progress! You're building better focus habits")
    }

    return recommendations
  }

  /**
   * Get start of current week (Monday)
   */
  private getWeekStart(): Date {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day // Monday as start
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  /**
   * Get intervention history for current week
   */
  private getWeekHistory(): InterventionRecord[] {
    const weekStart = this.getWeekStart()
    const allHistory = this.behaviorTracker.getRecentHistory(200)

    return allHistory.filter((record) => new Date(record.timestamp) >= weekStart)
  }

  /**
   * Format insight for display
   */
  formatInsight(insight: WeeklyInsight, verbose: boolean = false): string {
    const lines: string[] = []

    lines.push('# Weekly Insight')
    lines.push('')
    lines.push(`Week of ${new Date(insight.week).toLocaleDateString()}`)
    lines.push('')

    lines.push('## Summary')
    lines.push(`- Interventions: ${insight.summary.totalInterventions}`)
    lines.push(`- Compliance rate: ${Math.round(insight.summary.overallCompliance * 100)}%`)
    lines.push(`- Most common trigger: ${insight.summary.mostCommonTrigger}`)
    lines.push(`- Current strategy: ${insight.summary.currentStrategy}`)
    lines.push('')

    if (insight.patterns.length > 0) {
      lines.push('## Patterns Detected')
      for (const pattern of insight.patterns) {
        lines.push(`- ${pattern}`)
      }
      lines.push('')
    }

    if (insight.adaptations.length > 0) {
      lines.push('## Strategy Adaptations')
      for (const adaptation of insight.adaptations) {
        lines.push(`- ${adaptation.from} → ${adaptation.to}: ${adaptation.reason}`)
      }
      lines.push('')
    }

    if (insight.recommendations.length > 0) {
      lines.push('## Recommendations')
      for (const rec of insight.recommendations) {
        lines.push(`- ${rec}`)
      }
    }

    return lines.join('\n')
  }
}
