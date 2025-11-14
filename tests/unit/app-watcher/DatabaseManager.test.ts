/**
 * Unit tests for DatabaseManager
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseManager } from '../../../src/daemon/app-watcher/DatabaseManager.js'
import type { ActivityRecord } from '../../../src/types/state.js'

describe('DatabaseManager', () => {
  let db: DatabaseManager

  beforeEach(() => {
    // Use in-memory database for testing
    db = new DatabaseManager(':memory:')
  })

  describe('insertActivity', () => {
    it('should insert activity record and return ID', () => {
      const record: ActivityRecord = {
        timestamp: new Date().toISOString(),
        app: 'VS Code',
        window_title: 'email.ts',
        duration: 300,
        category: 'coding',
        alignment: 'on_track',
        commitment: 'Fix email bug',
      }

      const id = db.insertActivity(record)

      expect(id).toBeGreaterThan(0)
    })

    it('should store all activity fields correctly', () => {
      const record: ActivityRecord = {
        timestamp: new Date().toISOString(),
        app: 'Chrome',
        window_title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        duration: 600,
        category: 'research',
        alignment: 'on_track',
        commitment: 'Fix email bug',
      }

      db.insertActivity(record)
      const retrieved = db.getCurrentActivity()

      expect(retrieved).toBeDefined()
      expect(retrieved?.app).toBe('Chrome')
      expect(retrieved?.window_title).toBe('Stack Overflow')
      expect(retrieved?.url).toBe('https://stackoverflow.com')
      expect(retrieved?.category).toBe('research')
      expect(retrieved?.alignment).toBe('on_track')
    })
  })

  describe('getRecentActivity', () => {
    it('should retrieve activities from last N hours', () => {
      const now = new Date()

      // Insert activity from 1 hour ago
      db.insertActivity({
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        app: 'VS Code',
        window_title: 'old.ts',
        duration: 300,
        category: 'coding',
        alignment: 'on_track',
        commitment: 'Old task',
      })

      // Insert activity from 3 hours ago (should not be retrieved)
      db.insertActivity({
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        app: 'Notion',
        window_title: 'ancient.md',
        duration: 300,
        category: 'planning',
        alignment: 'on_track',
        commitment: 'Ancient task',
      })

      const recent = db.getRecentActivity(2) // Last 2 hours

      expect(recent.length).toBe(1)
      expect(recent[0].window_title).toBe('old.ts')
    })
  })

  describe('detectPlanningLoops', () => {
    it('should detect planning loops pattern', () => {
      const now = new Date()

      // Insert 4 planning activities
      for (let i = 0; i < 4; i++) {
        db.insertActivity({
          timestamp: new Date(now.getTime() - i * 10 * 60 * 1000).toISOString(),
          app: 'Notion',
          window_title: `Planning ${i}`,
          duration: 300,
          category: 'planning',
          alignment: 'productive_procrastination',
          commitment: 'Fix email bug',
        })
      }

      const patterns = db.detectPlanningLoops(3)

      expect(patterns.length).toBeGreaterThan(0)
      expect(patterns[0].pattern_type).toBe('planning_loop')
      expect(patterns[0].occurrences).toBe(4)
    })
  })

  describe('getDailyProductivitySummary', () => {
    it('should generate productivity summary', () => {
      const now = new Date()

      // On-track activity
      db.insertActivity({
        timestamp: now.toISOString(),
        app: 'VS Code',
        window_title: 'email.ts',
        duration: 3600,
        category: 'coding',
        alignment: 'on_track',
        commitment: 'Fix email bug',
      })

      // Off-track activity
      db.insertActivity({
        timestamp: new Date(now.getTime() - 1000).toISOString(),
        app: 'Chrome',
        window_title: 'YouTube',
        duration: 1800,
        category: 'other',
        alignment: 'off_track',
        commitment: 'Fix email bug',
      })

      const summary = db.getDailyProductivitySummary(1)

      expect(summary.length).toBeGreaterThan(0)
      expect(summary[0].total_activities).toBe(2)
      expect(summary[0].on_track_seconds).toBe(3600)
      expect(summary[0].off_track_seconds).toBe(1800)
      expect(summary[0].focus_percentage).toBeGreaterThan(60)
    })
  })

  describe('cleanup', () => {
    it('should delete old records', () => {
      const now = new Date()

      // Insert old record (100 days ago)
      db.insertActivity({
        timestamp: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        app: 'Old App',
        window_title: 'Old Window',
        duration: 300,
        category: 'other',
        alignment: 'on_track',
        commitment: 'Old commitment',
      })

      // Insert recent record
      db.insertActivity({
        timestamp: now.toISOString(),
        app: 'New App',
        window_title: 'New Window',
        duration: 300,
        category: 'coding',
        alignment: 'on_track',
        commitment: 'Current commitment',
      })

      db.cleanup(90) // Delete records older than 90 days

      const recent = db.getRecentActivity(240) // Last 10 days

      expect(recent.length).toBe(1)
      expect(recent[0].app).toBe('New App')
    })
  })
})
