# App Watcher Architecture

## Overview

The App Watcher is a system-level activity monitoring daemon that tracks application usage, detects procrastination patterns, and triggers personalized interventions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      App Watcher Daemon                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  AppWatcher  │     │   Pattern    │     │ Intervention │
│   (Core)     │────▶│   Analyzer   │────▶│   Trigger    │
└──────────────┘     └──────────────┘     └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Platform   │     │  Commitment  │     │Notification  │
│   Watcher    │     │   Matcher    │     │  Manager     │
│  (macOS)     │     └──────────────┘     └──────────────┘
└──────────────┘              │
        │                     │
        ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Activity    │     │ Intervention │     │  SQLite DB   │
│   Logger     │────▶│   Engine     │     │  (Activity   │
└──────────────┘     │  (Existing)  │     │   Records)   │
                     └──────────────┘     └──────────────┘
```

## Components

### 1. AppWatcher (Core)
**Responsibility:** Main orchestrator of the app-watching system

**Interface:**
- `start()`: Start monitoring
- `stop()`: Stop monitoring
- `getStatus()`: Get current monitoring status

**Behavior:**
- Polls platform watcher every N seconds (configurable, default: 5s)
- Detects activity changes (new app, new window)
- Logs activity to database via ActivityLogger
- Triggers pattern analysis on activity changes
- Emits events for downstream consumers

**Dependencies:**
- `PlatformWatcher` (injected based on OS)
- `ActivityLogger`
- `PatternAnalyzer`

### 2. Platform Watcher (macOS)
**Responsibility:** macOS-specific implementation for activity monitoring

**Interface:** Implements `PlatformWatcher`

**macOS Implementation:**
- Uses AppleScript to query active application:
  ```applescript
  tell application "System Events"
    set activeApp to name of first application process whose frontmost is true
    tell process activeApp
      set windowTitle to name of front window
    end tell
  end tell
  ```
- For browsers (Chrome, Safari, Firefox): Extract current URL from frontmost tab
- Requires Accessibility permissions

**Permissions:**
- Accessibility API access (required)
- Screen Recording (optional, for enhanced tracking)

### 3. ActivityLogger
**Responsibility:** Persist activity records to SQLite database

**Interface:**
- `logActivity(record: ActivityRecord): void`
- `getRecentActivity(hours: number): ActivityRecord[]`

**Behavior:**
- Writes to `~/.footnote/activity.db`
- Handles duplicate detection (prevents logging same activity twice)
- Calculates duration based on time delta between activities

**Storage:**
- SQLite database with schema defined in `schema.sql`
- WAL mode for concurrent access

### 4. PatternAnalyzer
**Responsibility:** Detect procrastination and distraction patterns

**Interface:**
- `analyzeActivity(context: ActivityContext): PatternDetectionResult`

**Patterns Detected:**
1. **Planning Loops** (Productive Procrastination)
   - Multiple Notion/planning app activities within short time
   - Threshold: 3+ planning activities in 30 minutes

2. **Research Rabbit Holes**
   - Extended browser research sessions
   - Threshold: 1+ hours of continuous research

3. **Context Switching**
   - Frequent app changes
   - Threshold: 20+ app switches in 1 hour

**Algorithm:**
- Uses recent activity history from database
- Sliding window analysis (last 30 min, 1 hour, 2 hours)
- Confidence scoring based on pattern strength

### 5. CommitmentMatcher
**Responsibility:** Determine if current activity aligns with daily commitment

**Interface:**
- `checkAlignment(activity: ActivitySnapshot, commitment: string): CommitmentAlignment`

**Behavior:**
- Uses semantic analysis (AI-powered) to compare:
  - Window title → Commitment
  - App context → Commitment
  - URL (if browser) → Commitment

**Example:**
```typescript
Commitment: "Fix email rendering bug"
Activity: VS Code → "email-renderer.ts"
Result: { isAligned: true, alignment: 'on_track', confidence: 0.95 }

Activity: Chrome → "Notion - Marketplace Planning"
Result: { isAligned: false, alignment: 'off_track', confidence: 0.87 }
```

**Integration:**
- Reuses existing `AlignmentAnalyzer` from hook-server
- Caches results to avoid excessive API calls

### 6. ProductiveProcrastinationDetector
**Responsibility:** Specialized detector for "planning instead of doing" pattern

**Interface:**
- `detectProductiveProcrastination(activities: ActivityRecord[]): boolean`

**Behavior:**
- Identifies activities that FEEL productive but avoid the main task
- Examples:
  - Planning in Notion when should be coding
  - Researching architecture when bug fix is needed
  - Refactoring unrelated code

**Detection Criteria:**
- Activity category: planning/research
- Alignment: off_track OR productive_procrastination
- Duration: > 15 minutes
- Frequency: Multiple occurrences in session

### 7. InterventionTrigger
**Responsibility:** Decide when to trigger interventions based on activity patterns

**Interface:**
- `shouldIntervene(pattern: PatternDetectionResult, alignment: CommitmentAlignment): boolean`
- `triggerIntervention(context: InterventionContext): void`

**Behavior:**
- Threshold-based triggering:
  - Planning loop: After 3rd occurrence
  - Research rabbit hole: After 1 hour
  - Off-track activity: After 10 minutes
  - Context switching: After 20 switches

**Integration:**
- Calls existing `InterventionEngine.selectIntervention()`
- Logs intervention to database
- Delegates notification to NotificationManager

### 8. NotificationManager
**Responsibility:** Display interventions as native desktop notifications

**macOS Implementation:**
- Uses `node-notifier` for native macOS notifications
- Formats intervention as notification with actions
- Handles user interaction (complied, overrode, ignored)

**Notification Format:**
```
Title: "Main thought check-in"
Body: [Intervention message from InterventionEngine]
Actions:
- "Return to focus" (complied)
- "Capture as footnote" (complied + capture)
- "Continue anyway" (overrode)
```

**User Response Handling:**
- Logs response to intervention_triggers table
- Starts timer to measure time_to_refocus
- Updates intervention effectiveness metrics

## Data Flow

### Activity Monitoring Flow
1. **AppWatcher** polls **PlatformWatcher** every 5s
2. **PlatformWatcher** returns current app + window
3. **AppWatcher** detects change → creates ActivityRecord
4. **ActivityLogger** persists to database
5. **PatternAnalyzer** analyzes recent activity
6. **CommitmentMatcher** checks alignment with commitment
7. If pattern detected + off-track → **InterventionTrigger** fires
8. **InterventionEngine** selects intervention strategy
9. **NotificationManager** displays intervention
10. User responds → **InterventionTrigger** logs response

### Pattern Detection Flow
1. **PatternAnalyzer** queries recent activities from DB
2. Runs detection algorithms (planning loops, rabbit holes, context switching)
3. Returns pattern type + confidence score
4. **InterventionTrigger** evaluates if intervention needed
5. If threshold met → trigger intervention

### Commitment Alignment Flow
1. **CommitmentMatcher** receives current activity
2. Loads today's commitment from StateManager
3. Calls **AlignmentAnalyzer** (AI-powered semantic comparison)
4. Caches result for current activity
5. Returns alignment + confidence
6. **InterventionTrigger** uses alignment in decision

## Integration Points

### With Existing Systems

**StateManager:**
- Read current commitment (`StateManager.getCurrentCommitment()`)
- Read user profile for intervention preferences

**InterventionEngine:**
- Reuse all existing strategies (HardBlock, Accountability, MicroTask, TimeBoxed)
- Reuse intervention formatting and messaging

**AlignmentAnalyzer:**
- Reuse semantic analysis from hook-server
- Same API for consistency

**Hook Server:**
- App Watcher is complementary, not replacement
- Hook server: Intercepts AI coding requests
- App Watcher: Monitors general system activity
- Both feed into same InterventionEngine

### Configuration

**~/.footnote/config.json:**
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

## Permissions & Setup

### macOS Accessibility Permissions
Required for app watching. User must grant via:
1. System Preferences → Security & Privacy → Privacy → Accessibility
2. Add Terminal.app (or Footnote.app if packaged)

**Permission Checker:**
- `PermissionChecker.checkAccessibility()` → boolean
- `PermissionChecker.requestAccessibility()` → opens System Preferences

**CLI Command:**
```bash
footnote permissions check
footnote permissions setup
```

## Error Handling

### Permission Denied
- Gracefully degrade: Disable app watching, log warning
- Show notification: "Enable accessibility permissions to use app watcher"
- CLI command: `footnote permissions setup`

### Database Errors
- Retry logic for transient errors
- Fallback: In-memory cache if DB unavailable
- Log errors for debugging

### Platform API Failures
- AppleScript errors: Retry with exponential backoff
- Timeout handling: Skip activity if query takes > 2s
- Fallback: Log "Unknown" app/window if query fails

## Testing Strategy

### Unit Tests
- PatternAnalyzer: Test detection algorithms with fixture data
- CommitmentMatcher: Test alignment logic with mock AI analyzer
- DatabaseManager: Test CRUD operations with in-memory DB

### Integration Tests
- AppWatcher → ActivityLogger → Database (full flow)
- PatternAnalyzer → InterventionTrigger → InterventionEngine
- End-to-end: Simulate activity sequence, verify intervention

### Manual Testing
- Real activity monitoring (per workflow: 04-app-watcher.workflow.json)
- Permission setup flow
- Notification interaction

## Performance Considerations

### Polling Frequency
- Default: 5s polling (balance between accuracy and CPU usage)
- Configurable via config
- Adaptive: Increase frequency during active coding, decrease during idle

### Database Optimization
- Indexes on timestamp, app, category
- WAL mode for concurrent reads
- Cleanup old records (90-day retention)

### AI API Usage
- Cache alignment results per activity
- Batch alignment checks when possible
- Fallback to keyword matching if API unavailable

## Security & Privacy

### Data Storage
- All data stored locally (~/.footnote/)
- No cloud sync by default
- User can enable cloud backup (future)

### Permissions
- Minimal permissions requested
- Clear explanation of why each permission needed
- User can disable app watching anytime

### Sensitive Data
- URLs filtered for sensitive content (e.g., exclude passwords, tokens)
- Window titles sanitized (remove email subjects, private messages)
- Option to exclude specific apps from logging

## Future Enhancements

1. **Cross-platform support:** Windows, Linux implementations
2. **ML-based pattern detection:** Learn user-specific patterns
3. **Productivity insights:** Weekly/monthly reports
4. **Smart intervention timing:** Learn optimal intervention moments
5. **Team mode:** Aggregate patterns across team (opt-in, privacy-preserving)
