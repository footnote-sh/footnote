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
