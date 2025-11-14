# App Watcher

System-wide activity monitoring daemon for macOS that tracks application usage, detects procrastination patterns, and triggers personalized interventions.

## Overview

The App Watcher monitors your active application and window in real-time, analyzes patterns, and integrates with the Footnote intervention system to help you stay focused on your main commitment.

## Architecture

```
AppWatcher (Orchestrator)
    ├── PlatformWatcher (macOS) - Get current app/window via AppleScript
    ├── ActivityLogger - Persist to SQLite database
    ├── PatternAnalyzer - Detect procrastination patterns
    ├── CommitmentMatcher - Check alignment with daily commitment
    ├── InterventionTrigger - Decide when to intervene
    └── NotificationManager - Display interventions as desktop notifications
```

## Components

### AppWatcher
Main orchestrator that:
- Polls active app every 5 seconds (configurable)
- Detects activity changes
- Coordinates pattern analysis
- Triggers interventions when needed

### PlatformWatcher (macOS)
macOS-specific implementation using AppleScript to:
- Get frontmost application name
- Extract window title
- Extract browser URLs (Chrome, Safari, Firefox)
- Check accessibility permissions

### ActivityLogger
Manages SQLite database (`~/.footnote/activity.db`) to:
- Log activity records with timestamps
- Calculate activity duration
- Prevent duplicate logging
- Clean up old records (90-day retention)

### PatternAnalyzer
Detects procrastination patterns:
1. **Planning Loops** - Multiple planning activities instead of execution
2. **Research Rabbit Holes** - Extended research sessions (1+ hour)
3. **Context Switching** - Frequent app changes (20+ per hour)

### CommitmentMatcher
Determines if current activity aligns with daily commitment:
- Uses AI-powered semantic analysis
- Falls back to keyword matching
- Categorizes activities (coding, planning, research, communication, other)
- Caches results for 5 minutes

### ProductiveProcrastinationDetector
Identifies activities that feel productive but avoid the main task:
- Planning instead of doing
- Research instead of doing
- Yak shaving (coding unrelated things)

### InterventionTrigger
Decides when to trigger interventions:
- Threshold-based triggering
- Cooldown periods to prevent spam
- Integrates with InterventionEngine
- Logs intervention history

### NotificationManager
Displays interventions as macOS notifications:
- Native notification UI
- Action buttons (Return to focus, Capture as footnote, Continue anyway)
- Tracks user responses

## Usage

### Check Permissions
```bash
footnote permissions check
```

### Setup Permissions
```bash
footnote permissions setup
```

### Start App Watcher (via daemon)
```bash
footnote daemon start
```

## Database Schema

### activity_records
- `id` - Auto-increment primary key
- `timestamp` - ISO 8601 timestamp
- `app` - Application name
- `window_title` - Window title
- `url` - Browser URL (optional)
- `duration` - Duration in seconds
- `category` - coding | planning | research | communication | other
- `alignment` - on_track | off_track | productive_procrastination
- `commitment` - Reference to daily commitment

### intervention_triggers
- `id` - Auto-increment primary key
- `timestamp` - When intervention was triggered
- `activity_id` - Foreign key to activity_records
- `trigger_type` - shiny_object | planning_procrastination | context_switch | research_rabbit_hole
- `strategy_used` - hard_block | accountability | micro_task | time_boxed
- `user_response` - complied | overrode | ignored
- `time_to_refocus` - Seconds until user returned to commitment

### activity_patterns
- Pre-computed pattern detection cache
- Used for analytics and performance optimization

### app_usage_summary
- Daily app usage aggregates
- Used for dashboard and reports

## Configuration

Default configuration in `~/.footnote/config.json`:

```json
{
  "appWatcher": {
    "enabled": true,
    "pollIntervalMs": 5000,
    "inactivityThresholdMs": 300000,
    "patternDetection": {
      "enabled": true,
      "planningLoopThreshold": 3,
      "researchDurationThreshold": 3600,
      "contextSwitchThreshold": 20
    },
    "intervention": {
      "enabled": true,
      "quietHours": {
        "enabled": false,
        "start": "22:00",
        "end": "08:00"
      }
    }
  }
}
```

## Pattern Detection Algorithms

### Planning Loop
```
Threshold: 3+ planning activities in 30 minutes
Confidence: occurrences / 10 (capped at 1.0)
Cooldown: 1 hour
```

### Research Rabbit Hole
```
Threshold: 1+ hour continuous research OR 10+ tabs opened
Confidence: Based on duration and tab count
Cooldown: 2 hours
```

### Context Switching
```
Threshold: 20+ app switches in 1 hour
Confidence: Based on switch frequency and avg time per app
Cooldown: 30 minutes
```

## Testing

### Unit Tests
```bash
npm run test -- tests/unit/app-watcher
```

### Integration Tests
```bash
npm run test -- tests/integration/app-watcher
```

### Manual Testing
See `internal/workflows/04-app-watcher.workflow.json` for manual test scenarios.

## Privacy & Security

- All data stored locally (`~/.footnote/activity.db`)
- No cloud sync (by default)
- Sensitive URLs filtered (passwords, tokens)
- Window titles sanitized (email subjects, private messages)
- Option to exclude specific apps from logging
- 90-day retention policy (configurable)

## Performance

- Polling: 5 seconds (configurable)
- Database: SQLite with WAL mode
- Caching: Alignment results cached for 5 minutes
- Indexes: Optimized for common queries
- Cleanup: Automatic old record deletion

## Troubleshooting

### Permission Errors
```
Error: Missing accessibility permissions
Fix: Run 'footnote permissions setup'
```

### AppleScript Errors
```
Error: AppleScript execution failed
Fix: Check System Preferences → Privacy → Accessibility
```

### Database Errors
```
Error: Database locked
Fix: Close other instances of Footnote
```

## Future Enhancements

1. **Cross-platform support** - Windows and Linux implementations
2. **ML-based pattern detection** - Learn user-specific patterns
3. **Productivity insights** - Weekly/monthly reports
4. **Smart intervention timing** - Learn optimal intervention moments
5. **Team mode** - Aggregate patterns across team (privacy-preserving)

## See Also

- [Architecture Documentation](../../../docs/app-watcher-architecture.md)
- [Pattern Detection Algorithms](../../../docs/pattern-detection-algorithms.md)
- [Database Schema](./schema.sql)
- [Common Queries](./database-queries.sql)
