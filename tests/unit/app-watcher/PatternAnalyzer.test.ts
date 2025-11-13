/**
 * Unit tests for PatternAnalyzer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PatternAnalyzer } from '../../../src/daemon/app-watcher/PatternAnalyzer.js'
import { DatabaseManager } from '../../../src/daemon/app-watcher/DatabaseManager.js'
import type { ActivityRecord } from '../../../src/types/state.js'
import fs from 'fs'
import path from 'path'

describe('PatternAnalyzer', () => {
  let analyzer: PatternAnalyzer
  let dbPath: string

  beforeEach(() => {
    // Use in-memory database for testing
    dbPath = ':memory:'
    analyzer = new PatternAnalyzer(dbPath)
  })

  afterEach(() => {
    // Cleanup
    if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
  })

  describe('detectPlanningLoop', () => {
    it('should detect planning loop with 3+ planning activities', () => {
      const now = new Date()
      const activities: ActivityRecord[] = [
        {
          timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
          app: 'Notion',
          window_title: 'Marketplace Roadmap',
          duration: 300,
          category: 'planning',
          alignment: 'productive_procrastination',
          commitment: 'Fix email bug',
        },
        {
          timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
          app: 'Notion',
          window_title: 'API Design',
          duration: 420,
          category: 'planning',
          alignment: 'productive_procrastination',
          commitment: 'Fix email bug',
        },
        {
          timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          app: 'Notion',
          window_title: 'Database Schema',
          duration: 360,
          category: 'planning',
          alignment: 'productive_procrastination',
          commitment: 'Fix email bug',
        },
        {
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          app: 'Notion',
          window_title: 'User Stories',
          duration: 240,
          category: 'planning',
          alignment: 'productive_procrastination',
          commitment: 'Fix email bug',
        },
      ]

      const result = analyzer.detectPlanningLoop(activities)

      expect(result.patternType).toBe('planning_loop')
      expect(result.confidence).toBeGreaterThan(0.3)
      expect(result.evidence.frequency).toBe(4)
      expect(result.evidence.duration).toBeGreaterThan(15 * 60)
    })

    it('should NOT detect planning loop with insufficient activities', () => {
      const now = new Date()
      const activities: ActivityRecord[] = [
        {
          timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
          app: 'Notion',
          window_title: 'Planning',
          duration: 300,
          category: 'planning',
          alignment: 'on_track',
          commitment: 'Plan marketplace',
        },
        {
          timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
          app: 'VS Code',
          window_title: 'email.ts',
          duration: 600,
          category: 'coding',
          alignment: 'on_track',
          commitment: 'Fix email bug',
        },
      ]

      const result = analyzer.detectPlanningLoop(activities)

      expect(result.patternType).toBe('none')
      expect(result.confidence).toBe(0)
    })
  })

  describe('detectResearchRabbitHole', () => {
    it('should detect research rabbit hole with 1+ hour session', () => {
      const now = new Date()
      const activities: ActivityRecord[] = []

      // Create 1.5 hour continuous research session
      for (let i = 90; i >= 0; i -= 5) {
        activities.push({
          timestamp: new Date(now.getTime() - i * 60 * 1000).toISOString(),
          app: 'Chrome',
          window_title: 'React Documentation',
          url: 'https://reactjs.org/docs',
          duration: 300,
          category: 'research',
          alignment: 'productive_procrastination',
          commitment: 'Fix email bug',
        })
      }

      const result = analyzer.detectResearchRabbitHole(activities)

      expect(result.patternType).toBe('research_rabbit_hole')
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.evidence.duration).toBeGreaterThan(60 * 60)
    })

    it('should NOT detect rabbit hole for short research sessions', () => {
      const now = new Date()
      const activities: ActivityRecord[] = [
        {
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          app: 'Chrome',
          window_title: 'Stack Overflow',
          url: 'https://stackoverflow.com',
          duration: 600,
          category: 'research',
          alignment: 'on_track',
          commitment: 'Fix email bug',
        },
      ]

      const result = analyzer.detectResearchRabbitHole(activities)

      expect(result.patternType).toBe('none')
      expect(result.confidence).toBe(0)
    })
  })

  describe('detectContextSwitching', () => {
    it('should detect context switching with 20+ switches', () => {
      const now = new Date()
      const activities: ActivityRecord[] = []

      // Create 25 rapid switches
      const apps = ['VS Code', 'Chrome', 'Slack', 'Terminal', 'Notion']
      for (let i = 50; i >= 0; i -= 2) {
        activities.push({
          timestamp: new Date(now.getTime() - i * 60 * 1000).toISOString(),
          app: apps[Math.floor(Math.random() * apps.length)],
          window_title: 'Window',
          duration: 120,
          category: 'other',
          alignment: 'on_track',
          commitment: 'Fix email bug',
        })
      }

      const result = analyzer.detectContextSwitching(activities)

      expect(result.patternType).toBe('context_switching')
      expect(result.confidence).toBeGreaterThan(0.5)
      expect(result.evidence.frequency).toBeGreaterThan(20)
    })

    it('should NOT detect context switching for focused work', () => {
      const now = new Date()
      const activities: ActivityRecord[] = [
        {
          timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
          app: 'VS Code',
          window_title: 'email.ts',
          duration: 3000,
          category: 'coding',
          alignment: 'on_track',
          commitment: 'Fix email bug',
        },
        {
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          app: 'Chrome',
          window_title: 'Documentation',
          duration: 600,
          category: 'research',
          alignment: 'on_track',
          commitment: 'Fix email bug',
        },
      ]

      const result = analyzer.detectContextSwitching(activities)

      expect(result.patternType).toBe('none')
    })
  })
})
