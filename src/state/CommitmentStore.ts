/**
 * Daily commitment storage and retrieval
 */

import { StateManager } from './StateManager.js'
import type { DailyCommitment } from '../types/state.js'

export class CommitmentStore {
  constructor(private stateManager: StateManager) {}

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Get today's commitment
   */
  getToday(): DailyCommitment | undefined {
    const today = this.getTodayDate()
    return this.stateManager.getCommitment(today)
  }

  /**
   * Set today's main thought (commitment)
   */
  setMainThought(mainThought: string): DailyCommitment {
    const today = this.getTodayDate()
    const now = new Date().toISOString()

    const commitment: DailyCommitment = {
      date: today,
      mainThought,
      footnotes: [],
      createdAt: now,
    }

    this.stateManager.setCommitment(today, commitment)
    this.stateManager.setCurrentCommitment(commitment)

    return commitment
  }

  /**
   * Add a footnote to today's commitment
   */
  addFootnote(footnote: string): DailyCommitment | undefined {
    const today = this.getTodayDate()
    const commitment = this.stateManager.getCommitment(today)

    if (!commitment) {
      return undefined
    }

    commitment.footnotes.push(footnote)
    this.stateManager.setCommitment(today, commitment)
    this.stateManager.setCurrentCommitment(commitment)

    return commitment
  }

  /**
   * Mark today's commitment as completed
   */
  markCompleted(): DailyCommitment | undefined {
    const today = this.getTodayDate()
    const commitment = this.stateManager.getCommitment(today)

    if (!commitment) {
      return undefined
    }

    commitment.completedAt = new Date().toISOString()
    this.stateManager.setCommitment(today, commitment)
    this.stateManager.setCurrentCommitment(commitment)

    return commitment
  }

  /**
   * Get commitment for a specific date
   */
  getByDate(date: string): DailyCommitment | undefined {
    return this.stateManager.getCommitment(date)
  }

  /**
   * Check if today has a commitment
   */
  hasCommitmentToday(): boolean {
    return this.getToday() !== undefined
  }

  /**
   * Get all commitments
   */
  getAll(): Record<string, DailyCommitment> {
    const state = this.stateManager.exportState()
    return state.commitments
  }

  /**
   * Get commitments for a date range
   */
  getRange(startDate: string, endDate: string): DailyCommitment[] {
    const all = this.getAll()
    const start = new Date(startDate)
    const end = new Date(endDate)

    return Object.values(all).filter((commitment) => {
      const date = new Date(commitment.date)
      return date >= start && date <= end
    })
  }
}
