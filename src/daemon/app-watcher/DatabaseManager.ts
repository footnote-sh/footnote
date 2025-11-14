/**
 * SQLite database manager for activity logging
 * Location: ~/.footnote/activity.db
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { ActivityRecord, InterventionRecord } from '../../types/state.js'

const DATABASE_SCHEMA = `
-- Activity logging database schema for Footnote app-watcher
-- Database location: ~/.footnote/activity.db

-- Main activity records table
CREATE TABLE IF NOT EXISTS activity_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL, -- ISO 8601 timestamp
  app TEXT NOT NULL,
  window_title TEXT NOT NULL,
  url TEXT, -- Optional, for browsers
  duration INTEGER NOT NULL DEFAULT 0, -- Duration in seconds

  -- Analysis fields
  category TEXT CHECK(category IN ('coding', 'planning', 'research', 'communication', 'other')) NOT NULL DEFAULT 'other',
  alignment TEXT CHECK(alignment IN ('on_track', 'off_track', 'productive_procrastination')) NOT NULL DEFAULT 'on_track',
  commitment TEXT NOT NULL, -- Reference to today's main thought

  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Indexes for common queries
  UNIQUE(timestamp, app) -- Prevent duplicate records
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_records(date(timestamp) DESC);
CREATE INDEX IF NOT EXISTS idx_activity_app ON activity_records(app);
CREATE INDEX IF NOT EXISTS idx_activity_category ON activity_records(category);
CREATE INDEX IF NOT EXISTS idx_activity_alignment ON activity_records(alignment);
CREATE INDEX IF NOT EXISTS idx_activity_commitment ON activity_records(commitment);

-- Intervention triggers table (linked to activity that triggered them)
CREATE TABLE IF NOT EXISTS intervention_triggers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  activity_id INTEGER NOT NULL, -- FK to activity_records
  trigger_type TEXT CHECK(trigger_type IN ('shiny_object', 'planning_procrastination', 'context_switch', 'research_rabbit_hole')) NOT NULL,
  strategy_used TEXT CHECK(strategy_used IN ('hard_block', 'accountability', 'micro_task', 'time_boxed')) NOT NULL,
  user_response TEXT CHECK(user_response IN ('complied', 'overrode', 'ignored')) NOT NULL DEFAULT 'ignored',
  time_to_refocus INTEGER, -- Seconds until user returned to commitment (null if overrode)

  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (activity_id) REFERENCES activity_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_intervention_timestamp ON intervention_triggers(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_intervention_activity ON intervention_triggers(activity_id);
CREATE INDEX IF NOT EXISTS idx_intervention_type ON intervention_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_intervention_response ON intervention_triggers(user_response);

-- Pattern detection cache (pre-computed patterns for faster analysis)
CREATE TABLE IF NOT EXISTS activity_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, -- ISO date (YYYY-MM-DD)
  pattern_type TEXT NOT NULL, -- e.g., 'planning_loop', 'research_rabbit_hole', 'context_switching'
  occurrences INTEGER NOT NULL DEFAULT 0,
  total_duration INTEGER NOT NULL DEFAULT 0, -- Total seconds spent in this pattern
  activity_ids TEXT NOT NULL, -- JSON array of activity record IDs

  -- Metadata
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(date, pattern_type)
);

CREATE INDEX IF NOT EXISTS idx_patterns_date ON activity_patterns(date DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON activity_patterns(pattern_type);

-- App usage summary (for quick dashboard queries)
CREATE TABLE IF NOT EXISTS app_usage_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, -- ISO date (YYYY-MM-DD)
  app TEXT NOT NULL,
  category TEXT NOT NULL,
  total_duration INTEGER NOT NULL DEFAULT 0, -- Total seconds
  switch_count INTEGER NOT NULL DEFAULT 0, -- Number of times switched to this app

  -- Metadata
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(date, app)
);

CREATE INDEX IF NOT EXISTS idx_app_summary_date ON app_usage_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_app_summary_app ON app_usage_summary(app);

-- Database version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_version (version) VALUES (1);
`

export interface ActivityRecordDB extends ActivityRecord {
  id: number
  created_at: string
}

export interface InterventionTriggerDB {
  id: number
  timestamp: string
  activity_id: number
  trigger_type:
    | 'shiny_object'
    | 'planning_procrastination'
    | 'context_switch'
    | 'research_rabbit_hole'
  strategy_used: 'hard_block' | 'accountability' | 'micro_task' | 'time_boxed'
  user_response: 'complied' | 'overrode' | 'ignored'
  time_to_refocus: number | null
  created_at: string
}

export interface ActivityPattern {
  id: number
  date: string
  pattern_type: string
  occurrences: number
  total_duration: number
  activity_ids: number[] // Stored as JSON
  detected_at: string
}

export interface AppUsageSummary {
  id: number
  date: string
  app: string
  category: string
  total_duration: number
  switch_count: number
  last_updated: string
}

export interface DailyProductivitySummary {
  date: string
  total_activities: number
  unique_apps_used: number
  total_active_seconds: number
  total_active_hours: number
  on_track_seconds: number
  procrastination_seconds: number
  off_track_seconds: number
  focus_percentage: number
}

export class DatabaseManager {
  private db: Database.Database

  constructor(dbPath?: string) {
    // Default to ~/.footnote/activity.db
    const defaultPath = path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.footnote',
      'activity.db'
    )
    const resolvedPath = dbPath || defaultPath

    // Ensure directory exists
    const dir = path.dirname(resolvedPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    this.db = new Database(resolvedPath)
    this.db.pragma('journal_mode = WAL') // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON')

    this.initialize()
  }

  /**
   * Initialize database schema
   */
  private initialize(): void {
    // Execute schema (split by semicolon and execute each statement)
    const statements = DATABASE_SCHEMA.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      this.db.exec(statement)
    }
  }

  /**
   * Insert activity record
   */
  insertActivity(record: ActivityRecord): number {
    const stmt = this.db.prepare(`
      INSERT INTO activity_records (
        timestamp, app, window_title, url, duration,
        category, alignment, commitment
      ) VALUES (
        @timestamp, @app, @window_title, @url, @duration,
        @category, @alignment, @commitment
      )
    `)

    const result = stmt.run({
      timestamp: record.timestamp,
      app: record.app,
      window_title: record.window_title,
      url: record.url || null,
      duration: record.duration,
      category: record.category,
      alignment: record.alignment,
      commitment: record.commitment,
    })

    return result.lastInsertRowid as number
  }

  /**
   * Update activity duration
   */
  updateActivityDuration(activityId: number, duration: number): void {
    const stmt = this.db.prepare(`
      UPDATE activity_records
      SET duration = @duration
      WHERE id = @activityId
    `)

    stmt.run({ activityId, duration })
  }

  /**
   * Get recent activity (last N hours)
   */
  getRecentActivity(hours: number = 2): ActivityRecordDB[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const stmt = this.db.prepare(`
      SELECT
        id, timestamp, app, window_title, url, duration,
        category, alignment, commitment, created_at
      FROM activity_records
      WHERE timestamp >= @cutoffTime
      ORDER BY timestamp DESC
    `)

    return stmt.all({ cutoffTime }) as ActivityRecordDB[]
  }

  /**
   * Get activity by date range
   */
  getActivityByDateRange(startDate: string, endDate: string): ActivityRecordDB[] {
    const stmt = this.db.prepare(`
      SELECT
        id, timestamp, app, window_title, url, duration,
        category, alignment, commitment, created_at
      FROM activity_records
      WHERE date(timestamp) BETWEEN @startDate AND @endDate
      ORDER BY timestamp DESC
    `)

    return stmt.all({ startDate, endDate }) as ActivityRecordDB[]
  }

  /**
   * Get current activity (most recent)
   */
  getCurrentActivity(): ActivityRecordDB | null {
    const stmt = this.db.prepare(`
      SELECT
        id, timestamp, app, window_title, url, duration,
        category, alignment, commitment, created_at
      FROM activity_records
      ORDER BY timestamp DESC
      LIMIT 1
    `)

    return stmt.get() as ActivityRecordDB | null
  }

  /**
   * Insert intervention trigger
   */
  insertIntervention(intervention: Omit<InterventionTriggerDB, 'id' | 'created_at'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO intervention_triggers (
        timestamp, activity_id, trigger_type, strategy_used,
        user_response, time_to_refocus
      ) VALUES (
        @timestamp, @activity_id, @trigger_type, @strategy_used,
        @user_response, @time_to_refocus
      )
    `)

    const result = stmt.run(intervention)
    return result.lastInsertRowid as number
  }

  /**
   * Update intervention response
   */
  updateInterventionResponse(
    interventionId: number,
    userResponse: 'complied' | 'overrode' | 'ignored',
    timeToRefocus?: number
  ): void {
    const stmt = this.db.prepare(`
      UPDATE intervention_triggers
      SET user_response = @user_response,
          time_to_refocus = @time_to_refocus
      WHERE id = @id
    `)

    stmt.run({
      id: interventionId,
      user_response: userResponse,
      time_to_refocus: timeToRefocus || null,
    })
  }

  /**
   * Detect planning loops (productive procrastination)
   */
  detectPlanningLoops(minOccurrences: number = 3): ActivityPattern[] {
    const stmt = this.db.prepare(`
      SELECT
        date(timestamp) as date,
        COUNT(*) as occurrences,
        SUM(duration) as total_duration,
        json_group_array(id) as activity_ids
      FROM activity_records
      WHERE category = 'planning'
        AND alignment = 'productive_procrastination'
        AND timestamp >= datetime('now', '-1 day')
      GROUP BY date(timestamp)
      HAVING occurrences >= @minOccurrences
    `)

    const results = stmt.all({ minOccurrences }) as any[]

    return results.map((r) => ({
      id: 0, // Will be set when cached
      date: r.date,
      pattern_type: 'planning_loop',
      occurrences: r.occurrences,
      total_duration: r.total_duration,
      activity_ids: JSON.parse(r.activity_ids),
      detected_at: new Date().toISOString(),
    }))
  }

  /**
   * Detect research rabbit holes
   */
  detectResearchRabbitHoles(minDuration: number = 3600): ActivityPattern[] {
    // Research sessions longer than minDuration seconds (default 1 hour)
    const stmt = this.db.prepare(`
      SELECT
        date(timestamp) as date,
        COUNT(*) as occurrences,
        SUM(duration) as total_duration,
        json_group_array(id) as activity_ids
      FROM activity_records
      WHERE category = 'research'
        AND timestamp >= datetime('now', '-1 day')
      GROUP BY date(timestamp)
      HAVING total_duration >= @minDuration
    `)

    const results = stmt.all({ minDuration }) as any[]

    return results.map((r) => ({
      id: 0,
      date: r.date,
      pattern_type: 'research_rabbit_hole',
      occurrences: r.occurrences,
      total_duration: r.total_duration,
      activity_ids: JSON.parse(r.activity_ids),
      detected_at: new Date().toISOString(),
    }))
  }

  /**
   * Detect context switching (excessive app changes)
   */
  detectContextSwitching(minSwitches: number = 20): ActivityPattern[] {
    const stmt = this.db.prepare(`
      SELECT
        date(timestamp) as date,
        COUNT(*) as occurrences,
        SUM(duration) as total_duration,
        json_group_array(id) as activity_ids
      FROM activity_records
      WHERE timestamp >= datetime('now', '-1 day')
      GROUP BY date(timestamp)
      HAVING occurrences >= @minSwitches
    `)

    const results = stmt.all({ minSwitches }) as any[]

    return results.map((r) => ({
      id: 0,
      date: r.date,
      pattern_type: 'context_switching',
      occurrences: r.occurrences,
      total_duration: r.total_duration,
      activity_ids: JSON.parse(r.activity_ids),
      detected_at: new Date().toISOString(),
    }))
  }

  /**
   * Get daily productivity summary
   */
  getDailyProductivitySummary(days: number = 7): DailyProductivitySummary[] {
    const stmt = this.db.prepare(`
      SELECT
        date(timestamp) as date,
        COUNT(*) as total_activities,
        COUNT(DISTINCT app) as unique_apps_used,
        SUM(duration) as total_active_seconds,
        ROUND(SUM(duration) / 3600.0, 2) as total_active_hours,
        SUM(CASE WHEN alignment = 'on_track' THEN duration ELSE 0 END) as on_track_seconds,
        SUM(CASE WHEN alignment = 'productive_procrastination' THEN duration ELSE 0 END) as procrastination_seconds,
        SUM(CASE WHEN alignment = 'off_track' THEN duration ELSE 0 END) as off_track_seconds,
        ROUND(100.0 * SUM(CASE WHEN alignment = 'on_track' THEN duration ELSE 0 END) / SUM(duration), 2) as focus_percentage
      FROM activity_records
      WHERE date(timestamp) >= date('now', '-${days} days')
      GROUP BY date(timestamp)
      ORDER BY date DESC
    `)

    return stmt.all() as DailyProductivitySummary[]
  }

  /**
   * Get time spent per category (today)
   */
  getTimeByCategory(date?: string): Array<{
    category: string
    alignment: string
    total_seconds: number
    total_minutes: number
    percentage: number
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0]

    const stmt = this.db.prepare(`
      SELECT
        category,
        alignment,
        SUM(duration) as total_seconds,
        ROUND(SUM(duration) / 60.0, 2) as total_minutes,
        ROUND(100.0 * SUM(duration) / (SELECT SUM(duration) FROM activity_records WHERE date(timestamp) = @date), 2) as percentage
      FROM activity_records
      WHERE date(timestamp) = @date
      GROUP BY category, alignment
      ORDER BY total_seconds DESC
    `)

    return stmt.all({ date: targetDate }) as any[]
  }

  /**
   * Clean up old records (retention policy)
   */
  cleanup(retentionDays: number = 90): void {
    // Delete old activity records
    this.db
      .prepare(
        `
      DELETE FROM activity_records
      WHERE timestamp < datetime('now', '-${retentionDays} days')
    `
      )
      .run()

    // Delete old interventions
    this.db
      .prepare(
        `
      DELETE FROM intervention_triggers
      WHERE timestamp < datetime('now', '-${retentionDays} days')
    `
      )
      .run()

    // Delete old patterns
    this.db
      .prepare(
        `
      DELETE FROM activity_patterns
      WHERE date < date('now', '-${retentionDays} days')
    `
      )
      .run()

    // Delete old app summaries
    this.db
      .prepare(
        `
      DELETE FROM app_usage_summary
      WHERE date < date('now', '-${retentionDays} days')
    `
      )
      .run()

    // Vacuum to reclaim space
    this.db.exec('VACUUM')
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close()
  }
}
