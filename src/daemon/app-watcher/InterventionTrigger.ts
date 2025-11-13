/**
 * Intervention trigger - decides when to trigger interventions
 * Integrates with InterventionEngine and tracks intervention history
 */

import type { PatternDetectionResult, CommitmentAlignment } from '../../types/activity.js'
import type { UserProfile, InterventionRecord } from '../../types/state.js'
import type { InterventionContext } from '../../types/intervention.js'
import { InterventionEngine } from '../../intervention/InterventionEngine.js'
import { DatabaseManager } from './DatabaseManager.js'
import { NotificationManager } from '../notifications/NotificationManager.js'

export interface TriggerThresholds {
  planningLoop: { occurrences: number; cooldownMs: number }
  researchRabbitHole: { durationSeconds: number; cooldownMs: number }
  contextSwitching: { switches: number; cooldownMs: number }
  offTrack: { durationSeconds: number; cooldownMs: number }
  productiveProcrastination: { durationSeconds: number; cooldownMs: number }
}

export class InterventionTrigger {
  private interventionEngine: InterventionEngine
  private db: DatabaseManager
  private notificationManager: NotificationManager
  private lastInterventionTime: Map<string, number> = new Map()

  private thresholds: TriggerThresholds = {
    planningLoop: {
      occurrences: 2, // Catch it early - 2 planning sessions in a row is a pattern
      cooldownMs: 20 * 60 * 1000, // 20 minutes
    },
    researchRabbitHole: {
      durationSeconds: 15 * 60, // 15 minutes - rabbit holes happen fast!
      cooldownMs: 30 * 60 * 1000, // 30 minutes
    },
    contextSwitching: {
      switches: 10, // 10 app switches in recent activity is excessive
      cooldownMs: 15 * 60 * 1000, // 15 minutes
    },
    offTrack: {
      durationSeconds: 3 * 60, // 3 minutes - catch drift early!
      cooldownMs: 15 * 60 * 1000, // 15 minutes
    },
    productiveProcrastination: {
      durationSeconds: 5 * 60, // 5 minutes of "productive" work that's not your focus
      cooldownMs: 20 * 60 * 1000, // 20 minutes
    },
  }

  constructor(dbPath?: string, customThresholds?: Partial<TriggerThresholds>) {
    this.interventionEngine = new InterventionEngine()
    this.db = new DatabaseManager(dbPath)
    this.notificationManager = new NotificationManager()

    // Override default thresholds with custom ones if provided
    if (customThresholds) {
      this.thresholds = {
        ...this.thresholds,
        ...customThresholds,
      }
    }
  }

  /**
   * Evaluate if intervention should be triggered
   */
  shouldIntervene(pattern: PatternDetectionResult, alignment: CommitmentAlignment): boolean {
    // No intervention if no pattern detected
    if (pattern.patternType === 'none') {
      return false
    }

    // Check cooldown period
    const lastIntervention = this.lastInterventionTime.get(pattern.patternType)
    if (lastIntervention) {
      const cooldown = this.getCooldown(pattern.patternType)
      const elapsed = Date.now() - lastIntervention

      if (elapsed < cooldown) {
        return false // Still in cooldown
      }
    }

    // Check if pattern meets threshold
    return this.meetsThreshold(pattern, alignment)
  }

  /**
   * Trigger intervention and handle user response
   */
  async triggerIntervention(
    profile: UserProfile,
    pattern: PatternDetectionResult,
    alignment: CommitmentAlignment,
    currentActivity: string,
    commitment: string,
    activityId: number
  ): Promise<void> {
    // Map pattern to trigger type
    const trigger = this.mapPatternToTrigger(pattern.patternType)

    // Select intervention from engine
    const intervention = this.interventionEngine.selectIntervention(
      profile,
      trigger,
      currentActivity,
      commitment
    )

    // Show notification
    const userResponse = await this.notificationManager.showIntervention(intervention, commitment)

    // Log intervention to database
    const interventionId = this.db.insertIntervention({
      timestamp: new Date().toISOString(),
      activity_id: activityId,
      trigger_type: trigger,
      strategy_used: intervention.type,
      user_response: userResponse.type,
      time_to_refocus: null, // Will be updated if user complies
    })

    // Update cooldown
    this.lastInterventionTime.set(pattern.patternType, Date.now())

    // Handle user response
    if (userResponse.type === 'complied') {
      // Start tracking time to refocus
      const startTime = Date.now()

      // TODO: Monitor when user returns to aligned activity
      // For now, we'll just log the compliance
      console.log('User complied with intervention')

      if (userResponse.captureAsFootnote) {
        // TODO: Integrate with capture command
        console.log('User wants to capture as footnote')
      }
    } else if (userResponse.type === 'overrode') {
      console.log('User overrode intervention')
    } else {
      console.log('User ignored intervention')
    }
  }

  /**
   * Check if pattern meets threshold for intervention
   */
  private meetsThreshold(pattern: PatternDetectionResult, alignment: CommitmentAlignment): boolean {
    switch (pattern.patternType) {
      case 'planning_loop':
        return (pattern.evidence.frequency || 0) >= this.thresholds.planningLoop.occurrences

      case 'research_rabbit_hole':
        return (
          (pattern.evidence.duration || 0) >= this.thresholds.researchRabbitHole.durationSeconds
        )

      case 'context_switching':
        return (pattern.evidence.frequency || 0) >= this.thresholds.contextSwitching.switches

      default:
        return pattern.confidence > 0.5
    }
  }

  /**
   * Get cooldown period for pattern type
   */
  private getCooldown(patternType: PatternDetectionResult['patternType']): number {
    switch (patternType) {
      case 'planning_loop':
        return this.thresholds.planningLoop.cooldownMs
      case 'research_rabbit_hole':
        return this.thresholds.researchRabbitHole.cooldownMs
      case 'context_switching':
        return this.thresholds.contextSwitching.cooldownMs
      default:
        return 30 * 60 * 1000 // Default 30 minutes
    }
  }

  /**
   * Map pattern type to intervention trigger
   */
  private mapPatternToTrigger(
    patternType: PatternDetectionResult['patternType']
  ): InterventionContext['trigger'] {
    switch (patternType) {
      case 'planning_loop':
        return 'planning_procrastination'
      case 'research_rabbit_hole':
        return 'research_rabbit_hole'
      case 'context_switching':
        return 'context_switch'
      default:
        return 'shiny_object'
    }
  }
}
