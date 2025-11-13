/**
 * Productive procrastination detector
 * Identifies activities that FEEL productive but avoid the main task
 */

import type { ActivityRecord } from '../../types/state.js'
import type { PatternDetectionResult } from '../../types/activity.js'

export class ProductiveProcrastinationDetector {
  /**
   * Detect productive procrastination pattern
   */
  detectProductiveProcrastination(
    activities: ActivityRecord[],
    commitment: string
  ): PatternDetectionResult {
    const last30Min = activities.filter((a) => this.isWithinLast(a.timestamp, 30, 'minutes'))

    // Look for activities that are:
    // 1. Productive in nature (coding, planning, research)
    // 2. BUT not aligned with commitment
    const productiveButOffTrack = last30Min.filter(
      (a) =>
        ['coding', 'planning', 'research'].includes(a.category) &&
        a.alignment === 'productive_procrastination'
    )

    const totalDuration = productiveButOffTrack.reduce((sum, a) => sum + a.duration, 0)

    // Threshold: 15+ minutes of productive procrastination
    if (totalDuration > 15 * 60) {
      // Identify specific procrastination type
      const categories = this.groupBy(productiveButOffTrack, 'category')
      const dominantCategory = Object.entries(categories).sort(
        (a, b) => b[1].length - a[1].length
      )[0]?.[0]

      let specificPattern: PatternDetectionResult['patternType'] = 'planning_loop'
      let recommendation = 'This feels productive, but is it your main focus?'

      if (dominantCategory === 'planning') {
        specificPattern = 'planning_loop'
        recommendation = 'Lots of planning. Ready to build?'
      } else if (dominantCategory === 'research') {
        specificPattern = 'research_rabbit_hole'
        recommendation = 'Research is helpful, but have you started coding?'
      } else if (dominantCategory === 'coding') {
        // Yak shaving (coding unrelated stuff)
        specificPattern = 'context_switching'
        recommendation = 'This refactoring is nice, but does it help with your main task?'
      }

      return {
        patternType: specificPattern,
        confidence: Math.min(totalDuration / (30 * 60), 1.0),
        evidence: {
          duration: totalDuration,
          recentActivities: productiveButOffTrack.slice(0, 5).map((a) => ({
            timestamp: a.timestamp,
            app: a.app,
            windowTitle: a.window_title,
            url: a.url,
          })),
        },
        recommendation,
      }
    }

    return { patternType: 'none', confidence: 0, evidence: {} }
  }

  /**
   * Identify specific type of productive procrastination
   */
  identifyProcrastinationType(activities: ActivityRecord[]): string {
    const categories = activities.map((a) => a.category)

    // Count occurrences
    const counts = categories.reduce(
      (acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Find dominant pattern
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]

    switch (dominant) {
      case 'planning':
        return 'planning_instead_of_doing'
      case 'research':
        return 'research_instead_of_doing'
      case 'coding':
        // Check if coding unrelated things (yak shaving)
        return 'yak_shaving'
      default:
        return 'productive_procrastination'
    }
  }

  /**
   * Check if timestamp is within last N minutes
   */
  private isWithinLast(timestamp: string, amount: number, unit: 'minutes' | 'hours'): boolean {
    const now = new Date()
    const then = new Date(timestamp)
    const diff = now.getTime() - then.getTime()

    const threshold = unit === 'minutes' ? amount * 60 * 1000 : amount * 60 * 60 * 1000

    return diff <= threshold
  }

  /**
   * Group array by key
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const value = String(item[key])
        if (!groups[value]) {
          groups[value] = []
        }
        groups[value].push(item)
        return groups
      },
      {} as Record<string, T[]>
    )
  }
}
