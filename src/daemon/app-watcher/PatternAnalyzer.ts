/**
 * Pattern analyzer - detects procrastination patterns
 * Implements algorithms from pattern-detection-algorithms.md
 */

import type { ActivityRecord } from '../../types/state.js'
import type { ActivityContext, PatternDetectionResult } from '../../types/activity.js'
import { DatabaseManager } from './DatabaseManager.js'

export class PatternAnalyzer {
  private db: DatabaseManager

  constructor(dbPath?: string) {
    this.db = new DatabaseManager(dbPath)
  }

  /**
   * Analyze current activity context for patterns
   */
  analyzeActivity(context: ActivityContext): PatternDetectionResult {
    // Get recent activity from database
    const recentActivity = this.db.getRecentActivity(2) // Last 2 hours

    // Check for each pattern type
    const planningLoop = this.detectPlanningLoop(recentActivity)
    if (planningLoop.patternType !== 'none') {
      return planningLoop
    }

    const rabbitHole = this.detectResearchRabbitHole(recentActivity)
    if (rabbitHole.patternType !== 'none') {
      return rabbitHole
    }

    const contextSwitching = this.detectContextSwitching(recentActivity)
    if (contextSwitching.patternType !== 'none') {
      return contextSwitching
    }

    return {
      patternType: 'none',
      confidence: 0,
      evidence: {},
    }
  }

  /**
   * Detect planning loop pattern
   */
  detectPlanningLoop(activities: ActivityRecord[]): PatternDetectionResult {
    // Filter to planning activities in last 30 minutes
    const last30Min = activities.filter(
      (a) => this.isWithinLast(a.timestamp, 30, 'minutes') && a.category === 'planning'
    )

    const occurrences = last30Min.length
    const totalDuration = last30Min.reduce((sum, a) => sum + a.duration, 0)

    // Thresholds
    const MIN_OCCURRENCES = 3
    const MIN_DURATION = 15 * 60 // 15 minutes

    if (occurrences >= MIN_OCCURRENCES && totalDuration >= MIN_DURATION) {
      return {
        patternType: 'planning_loop',
        confidence: Math.min(occurrences / 10, 1.0),
        evidence: {
          frequency: occurrences,
          duration: totalDuration,
          recentActivities: last30Min.slice(0, 5).map((a) => ({
            timestamp: a.timestamp,
            app: a.app,
            windowTitle: a.window_title,
            url: a.url,
          })),
        },
        recommendation: "You've been planning for a while. Ready to execute?",
      }
    }

    return { patternType: 'none', confidence: 0, evidence: {} }
  }

  /**
   * Detect research rabbit hole pattern
   */
  detectResearchRabbitHole(activities: ActivityRecord[]): PatternDetectionResult {
    const researchSession = this.findContinuousResearchSession(activities)

    if (!researchSession) {
      return { patternType: 'none', confidence: 0, evidence: {} }
    }

    const { duration, urls } = researchSession

    // Thresholds
    const MODERATE_DURATION = 30 * 60 // 30 minutes
    const DEEP_DURATION = 60 * 60 // 1 hour
    const TAB_EXPLOSION_THRESHOLD = 10

    let confidence = 0

    if (duration > MODERATE_DURATION) {
      confidence += 0.3
    }
    if (duration > DEEP_DURATION) {
      confidence += 0.4
    }
    if (urls.length > TAB_EXPLOSION_THRESHOLD) {
      confidence += 0.3
    }

    if (confidence > 0.5) {
      return {
        patternType: 'research_rabbit_hole',
        confidence,
        evidence: {
          duration,
          recentActivities: researchSession.activities.slice(0, 5).map((a) => ({
            timestamp: a.timestamp,
            app: a.app,
            windowTitle: a.window_title,
            url: a.url,
          })),
        },
        recommendation: 'Research session running long. Found what you need?',
      }
    }

    return { patternType: 'none', confidence: 0, evidence: {} }
  }

  /**
   * Detect context switching pattern
   */
  detectContextSwitching(activities: ActivityRecord[]): PatternDetectionResult {
    const last1Hour = activities.filter((a) => this.isWithinLast(a.timestamp, 1, 'hour'))

    const uniqueApps = new Set(last1Hour.map((a) => a.app))
    const switches = last1Hour.length

    // Calculate average duration per app
    const appGroups = this.groupBy(last1Hour, 'app')
    const avgDurationPerApp =
      Object.values(appGroups).reduce((sum, acts) => {
        return sum + acts.reduce((s, a) => s + a.duration, 0)
      }, 0) / uniqueApps.size

    // Thresholds
    const HIGH_SWITCH_COUNT = 20
    const LOW_AVG_DURATION = 3 * 60 // < 3 minutes per app

    let confidence = 0

    if (switches > HIGH_SWITCH_COUNT) {
      confidence += 0.5
    }
    if (avgDurationPerApp < LOW_AVG_DURATION) {
      confidence += 0.3
    }
    if (uniqueApps.size > 8) {
      confidence += 0.2
    }

    if (confidence > 0.5) {
      return {
        patternType: 'context_switching',
        confidence,
        evidence: {
          frequency: switches,
          duration: avgDurationPerApp,
          recentActivities: last1Hour.slice(-10).map((a) => ({
            timestamp: a.timestamp,
            app: a.app,
            windowTitle: a.window_title,
            url: a.url,
          })),
        },
        recommendation: 'Lots of switching. Try focusing on one thing?',
      }
    }

    return { patternType: 'none', confidence: 0, evidence: {} }
  }

  /**
   * Find continuous research session
   */
  private findContinuousResearchSession(activities: ActivityRecord[]): {
    duration: number
    activities: ActivityRecord[]
    urls: string[]
  } | null {
    const researchActivities = activities
      .filter((a) => a.category === 'research')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (researchActivities.length === 0) return null

    let sessionActivities = [researchActivities[0]]
    let totalDuration = 0

    for (let i = 1; i < researchActivities.length; i++) {
      const prev = researchActivities[i - 1]
      const curr = researchActivities[i]
      const gap = this.timeDiff(prev.timestamp, curr.timestamp)

      if (gap < 5 * 60) {
        // Continuous session (< 5 min gap)
        sessionActivities.push(curr)
        totalDuration += gap
      } else {
        // Session break
        if (totalDuration > 30 * 60) {
          // Found a long session
          break
        }
        sessionActivities = [curr]
        totalDuration = 0
      }
    }

    const urls = Array.from(
      new Set(sessionActivities.map((a) => a.url).filter((url): url is string => !!url))
    )

    return {
      duration: totalDuration,
      activities: sessionActivities,
      urls,
    }
  }

  /**
   * Check if timestamp is within last N minutes/hours
   */
  private isWithinLast(timestamp: string, amount: number, unit: 'minutes' | 'hours'): boolean {
    const now = new Date()
    const then = new Date(timestamp)
    const diff = now.getTime() - then.getTime()

    const threshold = unit === 'minutes' ? amount * 60 * 1000 : amount * 60 * 60 * 1000

    return diff <= threshold
  }

  /**
   * Calculate time difference between timestamps (in seconds)
   */
  private timeDiff(timestamp1: string, timestamp2: string): number {
    const t1 = new Date(timestamp1).getTime()
    const t2 = new Date(timestamp2).getTime()
    return Math.abs(t2 - t1) / 1000
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
