/**
 * Core state management using Conf storage
 */

import Conf from 'conf'
import type { StateConfig, DailyCommitment, UserProfile } from '../types/state.js'

export class StateManager {
  private store: Conf<StateConfig>

  constructor() {
    this.store = new Conf<StateConfig>({
      projectName: 'footnote',
      defaults: {
        version: '1.0.0',
        commitments: {},
        onboarding_completed: false,
        daemon_enabled: false,
      },
    })
  }

  // Version management
  getVersion(): string {
    return this.store.get('version')
  }

  // Onboarding
  isOnboardingCompleted(): boolean {
    return this.store.get('onboarding_completed')
  }

  setOnboardingCompleted(completed: boolean): void {
    this.store.set('onboarding_completed', completed)
  }

  // Profile management
  getProfile(): UserProfile | undefined {
    return this.store.get('profile')
  }

  setProfile(profile: UserProfile): void {
    this.store.set('profile', profile)
  }

  hasProfile(): boolean {
    return this.store.has('profile')
  }

  // Commitment management
  getCommitment(date: string): DailyCommitment | undefined {
    const commitments = this.store.get('commitments')
    return commitments[date]
  }

  setCommitment(date: string, commitment: DailyCommitment): void {
    const commitments = this.store.get('commitments')
    commitments[date] = commitment
    this.store.set('commitments', commitments)
  }

  getCurrentCommitment(): DailyCommitment | undefined {
    return this.store.get('current_commitment')
  }

  setCurrentCommitment(commitment: DailyCommitment): void {
    this.store.set('current_commitment', commitment)
  }

  // Daemon
  isDaemonEnabled(): boolean {
    return this.store.get('daemon_enabled')
  }

  setDaemonEnabled(enabled: boolean): void {
    this.store.set('daemon_enabled', enabled)
  }

  // Utility
  reset(): void {
    this.store.clear()
  }

  getStorePath(): string {
    return this.store.path
  }

  exportState(): StateConfig {
    return this.store.store
  }
}
