/**
 * User profile and preferences storage
 */

import { StateManager } from './StateManager.js'
import type { UserProfile, InterventionStrategy, InterventionRecord } from '../types/state.js'

export class ProfileStore {
  constructor(private stateManager: StateManager) {}

  /**
   * Get user profile
   */
  get(): UserProfile | undefined {
    return this.stateManager.getProfile()
  }

  /**
   * Set user profile
   */
  set(profile: UserProfile): void {
    this.stateManager.setProfile(profile)
    this.stateManager.setOnboardingCompleted(true)
  }

  /**
   * Check if profile exists
   */
  exists(): boolean {
    return this.stateManager.hasProfile()
  }

  /**
   * Update specific profile fields
   */
  update(updates: Partial<UserProfile>): UserProfile | undefined {
    const profile = this.get()
    if (!profile) {
      return undefined
    }

    const updated = { ...profile, ...updates }
    this.set(updated)
    return updated
  }

  /**
   * Get current intervention strategy
   */
  getCurrentStrategy(): InterventionStrategy | undefined {
    const profile = this.get()
    return profile?.behavior_tracking.current_strategy
  }

  /**
   * Update current intervention strategy
   */
  updateStrategy(strategy: InterventionStrategy): void {
    const profile = this.get()
    if (!profile) {
      return
    }

    profile.behavior_tracking.current_strategy = strategy
    profile.behavior_tracking.last_adapted = new Date().toISOString()
    this.set(profile)
  }

  /**
   * Add intervention record
   */
  addInterventionRecord(record: InterventionRecord): void {
    const profile = this.get()
    if (!profile) {
      return
    }

    profile.behavior_tracking.intervention_history.push(record)
    this.set(profile)
  }

  /**
   * Get intervention history
   */
  getInterventionHistory(): InterventionRecord[] {
    const profile = this.get()
    return profile?.behavior_tracking.intervention_history || []
  }

  /**
   * Update effectiveness scores
   */
  updateEffectivenessScore(strategy: InterventionStrategy, score: number): void {
    const profile = this.get()
    if (!profile) {
      return
    }

    profile.behavior_tracking.effectiveness_scores[strategy] = score
    this.set(profile)
  }

  /**
   * Get effectiveness scores
   */
  getEffectivenessScores(): Record<InterventionStrategy, number> | undefined {
    const profile = this.get()
    return profile?.behavior_tracking.effectiveness_scores
  }

  /**
   * Create default profile structure
   */
  createDefault(name: string, role: UserProfile['role']): UserProfile {
    return {
      name,
      role,
      schedule: {
        work_hours: '9:00-17:00',
        deep_work_windows: ['morning'],
      },
      procrastination_patterns: {
        planning_instead_of_doing: false,
        research_rabbit_holes: false,
        tool_setup_dopamine: false,
        meeting_avoidance: false,
      },
      intervention_style: {
        primary: 'accountability',
        fallback: 'micro_task',
      },
      communication: {
        tone: 'gentle',
        formality: 'friend',
      },
      learning: {
        visibility: 'optional',
        adaptation_enabled: true,
      },
      behavior_tracking: {
        intervention_history: [],
        effectiveness_scores: {
          hard_block: 0,
          accountability: 0,
          micro_task: 0,
          time_boxed: 0,
        },
        current_strategy: 'accountability',
        last_adapted: new Date().toISOString(),
      },
    }
  }
}
