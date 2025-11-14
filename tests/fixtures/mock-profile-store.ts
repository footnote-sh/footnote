/**
 * Mock ProfileStore for testing components that depend on state persistence
 * Simulates ProfileStore without filesystem I/O
 */

import type { InterventionRecord, UserProfile } from '../../src/types/state.js'

export class MockProfileStore {
  private profile: UserProfile | null = null
  private interventionHistory: InterventionRecord[] = []

  /**
   * Load profile (mock implementation)
   */
  loadProfile(): UserProfile | null {
    return this.profile
  }

  /**
   * Save profile (mock implementation)
   */
  saveProfile(profile: UserProfile): void {
    this.profile = profile
  }

  /**
   * Get intervention history
   */
  getInterventionHistory(): InterventionRecord[] {
    return [...this.interventionHistory]
  }

  /**
   * Add intervention record
   */
  addInterventionRecord(record: InterventionRecord): void {
    this.interventionHistory.push(record)

    // Update profile's behavior_tracking if profile exists
    if (this.profile) {
      this.profile.behavior_tracking.intervention_history.push(record)
    }
  }

  /**
   * Update effectiveness score
   */
  updateEffectivenessScore(
    strategy: keyof UserProfile['behavior_tracking']['effectiveness_scores'],
    score: number
  ): void {
    if (this.profile) {
      this.profile.behavior_tracking.effectiveness_scores[strategy] = score
    }
  }

  /**
   * Update current strategy
   */
  updateCurrentStrategy(strategy: UserProfile['behavior_tracking']['current_strategy']): void {
    if (this.profile) {
      this.profile.behavior_tracking.current_strategy = strategy
      this.profile.behavior_tracking.last_adapted = new Date().toISOString()
    }
  }

  /**
   * Reset mock (for test isolation)
   */
  reset(): void {
    this.profile = null
    this.interventionHistory = []
  }

  /**
   * Seed with initial data (for testing)
   */
  seed(profile: UserProfile, history: InterventionRecord[] = []): void {
    this.profile = profile
    this.interventionHistory = history

    // Ensure profile's history matches
    if (this.profile) {
      this.profile.behavior_tracking.intervention_history = [...history]
    }
  }

  /**
   * Get current profile state (for assertions)
   */
  getCurrentProfile(): UserProfile | null {
    return this.profile
  }

  /**
   * Get history count (for assertions)
   */
  getHistoryCount(): number {
    return this.interventionHistory.length
  }
}

/**
 * Factory function for creating fresh mock instances
 */
export function createMockProfileStore(): MockProfileStore {
  return new MockProfileStore()
}
