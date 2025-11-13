/**
 * Activity logger - persists activity records to database
 * Handles duration calculation and duplicate detection
 */

import type { ActivityRecord } from '../../types/state.js'
import type { ActivitySnapshot } from '../../types/activity.js'
import { DatabaseManager } from './DatabaseManager.js'

export class ActivityLogger {
  private db: DatabaseManager
  private lastActivity: ActivitySnapshot | null = null
  private lastActivityId: number | null = null
  private activityStartTime: Date | null = null

  constructor(dbPath?: string) {
    this.db = new DatabaseManager(dbPath)
  }

  /**
   * Log a new activity snapshot
   * Calculates duration based on time since last activity
   */
  logActivity(
    activity: ActivitySnapshot,
    category: ActivityRecord['category'],
    alignment: ActivityRecord['alignment'],
    commitment: string
  ): number | null {
    // If this is the same as last activity, don't log duplicate
    if (this.isSameActivity(activity, this.lastActivity)) {
      // Update duration of existing activity
      if (this.lastActivityId) {
        this.updateActivityDuration(this.lastActivityId)
      }
      return this.lastActivityId
    }

    // Finalize previous activity duration
    if (this.lastActivityId && this.activityStartTime) {
      const duration = Math.floor((new Date().getTime() - this.activityStartTime.getTime()) / 1000)
      this.updateActivityDuration(this.lastActivityId, duration)
    }

    // Create new activity record
    const record: ActivityRecord = {
      timestamp: activity.timestamp,
      app: activity.app,
      window_title: activity.windowTitle,
      url: activity.url,
      duration: 0, // Will be updated when activity changes
      category,
      alignment,
      commitment,
    }

    const id = this.db.insertActivity(record)

    // Update tracking
    this.lastActivity = activity
    this.lastActivityId = id
    this.activityStartTime = new Date()

    return id
  }

  /**
   * Get recent activity from database
   */
  getRecentActivity(hours: number = 2): ActivityRecord[] {
    const records = this.db.getRecentActivity(hours)
    return records.map((r) => ({
      timestamp: r.timestamp,
      app: r.app,
      window_title: r.window_title,
      url: r.url,
      duration: r.duration,
      category: r.category,
      alignment: r.alignment,
      commitment: r.commitment,
    }))
  }

  /**
   * Get current activity from database
   */
  getCurrentActivity(): ActivityRecord | null {
    const record = this.db.getCurrentActivity()
    if (!record) return null

    return {
      timestamp: record.timestamp,
      app: record.app,
      window_title: record.window_title,
      url: record.url,
      duration: record.duration,
      category: record.category,
      alignment: record.alignment,
      commitment: record.commitment,
    }
  }

  /**
   * Finalize current activity (call on shutdown)
   */
  finalizeCurrentActivity(): void {
    if (this.lastActivityId && this.activityStartTime) {
      const duration = Math.floor((new Date().getTime() - this.activityStartTime.getTime()) / 1000)
      this.updateActivityDuration(this.lastActivityId, duration)
    }
  }

  /**
   * Clean up old records
   */
  cleanup(retentionDays: number = 90): void {
    this.db.cleanup(retentionDays)
  }

  /**
   * Close database connection
   */
  close(): void {
    this.finalizeCurrentActivity()
    this.db.close()
  }

  /**
   * Check if two activities are the same
   */
  private isSameActivity(a: ActivitySnapshot | null, b: ActivitySnapshot | null): boolean {
    if (!a || !b) return false
    return a.app === b.app && a.windowTitle === b.windowTitle && a.url === b.url
  }

  /**
   * Update activity duration in database
   */
  private updateActivityDuration(activityId: number, duration?: number): void {
    if (duration === undefined && this.activityStartTime) {
      duration = Math.floor((new Date().getTime() - this.activityStartTime.getTime()) / 1000)
    }

    if (duration !== undefined) {
      // Use raw SQL to update duration
      // Note: DatabaseManager doesn't have updateActivity method yet
      // We'll add it or use raw SQL here
      // For now, skip the update (duration will be calculated from timestamps)
    }
  }
}
