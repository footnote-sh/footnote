-- Common query patterns for app-watcher database

-- ===================================
-- ACTIVITY QUERIES
-- ===================================

-- Get recent activity (last N hours)
-- Example: Get last 2 hours of activity
SELECT
  id, timestamp, app, window_title, url, duration,
  category, alignment, commitment
FROM activity_records
WHERE timestamp >= datetime('now', '-2 hours')
ORDER BY timestamp DESC;

-- Get activity for specific date range
SELECT
  id, timestamp, app, window_title, url, duration,
  category, alignment, commitment
FROM activity_records
WHERE date(timestamp) BETWEEN '2025-11-13' AND '2025-11-15'
ORDER BY timestamp DESC;

-- Get current activity (most recent record)
SELECT
  id, timestamp, app, window_title, url, duration,
  category, alignment, commitment
FROM activity_records
ORDER BY timestamp DESC
LIMIT 1;

-- ===================================
-- PATTERN DETECTION QUERIES
-- ===================================

-- Detect planning loops (multiple planning activities in short time)
-- "Planning instead of doing" pattern
SELECT
  date(timestamp) as date,
  COUNT(*) as planning_count,
  SUM(duration) as total_planning_seconds,
  GROUP_CONCAT(window_title, ' | ') as activities
FROM activity_records
WHERE category = 'planning'
  AND alignment = 'productive_procrastination'
  AND timestamp >= datetime('now', '-1 day')
GROUP BY date(timestamp)
HAVING planning_count >= 3; -- 3+ planning activities = loop

-- Detect research rabbit holes (extended research sessions)
SELECT
  timestamp,
  app,
  window_title,
  url,
  duration,
  SUM(duration) OVER (
    PARTITION BY category
    ORDER BY timestamp
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) as cumulative_research_time
FROM activity_records
WHERE category = 'research'
  AND timestamp >= datetime('now', '-2 hours')
ORDER BY timestamp DESC;

-- Detect context switches (frequent app changes)
SELECT
  date(timestamp) as date,
  COUNT(DISTINCT app) as unique_apps,
  COUNT(*) as total_switches,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT app), 2) as avg_switches_per_app
FROM activity_records
WHERE timestamp >= datetime('now', '-1 day')
GROUP BY date(timestamp)
HAVING total_switches > 20; -- More than 20 switches = problematic

-- Find off-track activities
SELECT
  timestamp,
  app,
  window_title,
  url,
  duration,
  commitment
FROM activity_records
WHERE alignment = 'off_track'
  AND timestamp >= datetime('now', '-1 day')
ORDER BY timestamp DESC;

-- ===================================
-- TIME TRACKING QUERIES
-- ===================================

-- Time spent per app (today)
SELECT
  app,
  category,
  COUNT(*) as activity_count,
  SUM(duration) as total_seconds,
  ROUND(SUM(duration) / 60.0, 2) as total_minutes
FROM activity_records
WHERE date(timestamp) = date('now')
GROUP BY app, category
ORDER BY total_seconds DESC;

-- Time spent per category (today)
SELECT
  category,
  alignment,
  COUNT(*) as activity_count,
  SUM(duration) as total_seconds,
  ROUND(SUM(duration) / 60.0, 2) as total_minutes,
  ROUND(100.0 * SUM(duration) / (SELECT SUM(duration) FROM activity_records WHERE date(timestamp) = date('now')), 2) as percentage
FROM activity_records
WHERE date(timestamp) = date('now')
GROUP BY category, alignment
ORDER BY total_seconds DESC;

-- Time aligned with commitment (today)
SELECT
  alignment,
  COUNT(*) as activity_count,
  SUM(duration) as total_seconds,
  ROUND(SUM(duration) / 60.0, 2) as total_minutes,
  ROUND(100.0 * SUM(duration) / (SELECT SUM(duration) FROM activity_records WHERE date(timestamp) = date('now')), 2) as percentage
FROM activity_records
WHERE date(timestamp) = date('now')
GROUP BY alignment
ORDER BY
  CASE alignment
    WHEN 'on_track' THEN 1
    WHEN 'productive_procrastination' THEN 2
    WHEN 'off_track' THEN 3
  END;

-- ===================================
-- INTERVENTION QUERIES
-- ===================================

-- Intervention effectiveness (by type)
SELECT
  trigger_type,
  strategy_used,
  COUNT(*) as total_interventions,
  SUM(CASE WHEN user_response = 'complied' THEN 1 ELSE 0 END) as complied_count,
  SUM(CASE WHEN user_response = 'overrode' THEN 1 ELSE 0 END) as overrode_count,
  SUM(CASE WHEN user_response = 'ignored' THEN 1 ELSE 0 END) as ignored_count,
  ROUND(100.0 * SUM(CASE WHEN user_response = 'complied' THEN 1 ELSE 0 END) / COUNT(*), 2) as compliance_rate,
  ROUND(AVG(time_to_refocus), 2) as avg_refocus_time_seconds
FROM intervention_triggers
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY trigger_type, strategy_used
ORDER BY compliance_rate DESC;

-- Recent interventions
SELECT
  it.timestamp,
  it.trigger_type,
  it.strategy_used,
  it.user_response,
  it.time_to_refocus,
  ar.app,
  ar.window_title,
  ar.commitment
FROM intervention_triggers it
LEFT JOIN activity_records ar ON it.activity_id = ar.id
WHERE it.timestamp >= datetime('now', '-1 day')
ORDER BY it.timestamp DESC;

-- ===================================
-- DATA CLEANUP QUERIES
-- ===================================

-- Delete records older than 90 days
DELETE FROM activity_records
WHERE timestamp < datetime('now', '-90 days');

-- Delete interventions older than 90 days
DELETE FROM intervention_triggers
WHERE timestamp < datetime('now', '-90 days');

-- Delete pattern cache older than 90 days
DELETE FROM activity_patterns
WHERE date < date('now', '-90 days');

-- Delete app summary older than 90 days
DELETE FROM app_usage_summary
WHERE date < date('now', '-90 days');

-- Vacuum database to reclaim space
VACUUM;

-- ===================================
-- ANALYTICS / DASHBOARD QUERIES
-- ===================================

-- Daily productivity summary
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
WHERE date(timestamp) >= date('now', '-7 days')
GROUP BY date(timestamp)
ORDER BY date DESC;

-- Top distractions (off-track activities)
SELECT
  app,
  window_title,
  COUNT(*) as occurrences,
  SUM(duration) as total_seconds,
  ROUND(SUM(duration) / 60.0, 2) as total_minutes
FROM activity_records
WHERE alignment = 'off_track'
  AND timestamp >= datetime('now', '-7 days')
GROUP BY app, window_title
ORDER BY total_seconds DESC
LIMIT 10;
