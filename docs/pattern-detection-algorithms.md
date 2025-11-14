# Pattern Detection Algorithms

## Overview

The Pattern Analyzer uses sliding window analysis and heuristic-based detection to identify procrastination and distraction patterns in real-time.

## Core Patterns

### 1. Planning Loops (Productive Procrastination)

**Definition:** Repeated planning activities instead of actual execution

**Detection Algorithm:**
```typescript
function detectPlanningLoop(activities: ActivityRecord[]): PatternDetectionResult {
  const last30Min = activities.filter(a =>
    isWithinLast(a.timestamp, 30, 'minutes') &&
    a.category === 'planning'
  )

  const occurrences = last30Min.length
  const totalDuration = sum(last30Min.map(a => a.duration))

  // Thresholds
  const MIN_OCCURRENCES = 3 // 3+ planning activities
  const MIN_DURATION = 15 * 60 // 15 minutes total

  if (occurrences >= MIN_OCCURRENCES && totalDuration >= MIN_DURATION) {
    return {
      patternType: 'planning_loop',
      confidence: Math.min(occurrences / 10, 1.0), // Max at 10 occurrences
      evidence: {
        frequency: occurrences,
        duration: totalDuration,
        recentActivities: last30Min.slice(0, 5)
      },
      recommendation: "You've been planning for a while. Ready to execute?"
    }
  }

  return { patternType: 'none', confidence: 0 }
}
```

**Categorization Logic:**
- **Apps classified as "planning":**
  - Notion
  - Obsidian
  - Roam Research
  - Apple Notes (with keywords: "plan", "todo", "roadmap")
  - Markdown editors (when editing planning docs)

**Alignment Heuristic:**
- If commitment is "Plan marketplace feature" → planning = on_track
- If commitment is "Fix email bug" → planning = productive_procrastination

### 2. Research Rabbit Holes

**Definition:** Extended research sessions that exceed intended scope

**Detection Algorithm:**
```typescript
function detectResearchRabbitHole(activities: ActivityRecord[]): PatternDetectionResult {
  const researchSession = findContinuousResearchSession(activities)

  if (!researchSession) {
    return { patternType: 'none', confidence: 0 }
  }

  const { duration, urls, tabs } = researchSession

  // Thresholds
  const MODERATE_DURATION = 30 * 60 // 30 minutes
  const DEEP_DURATION = 60 * 60 // 1 hour
  const TAB_EXPLOSION_THRESHOLD = 10 // 10+ tabs

  let confidence = 0

  if (duration > MODERATE_DURATION) {
    confidence += 0.3
  }
  if (duration > DEEP_DURATION) {
    confidence += 0.4
  }
  if (tabs > TAB_EXPLOSION_THRESHOLD) {
    confidence += 0.3
  }

  if (confidence > 0.5) {
    return {
      patternType: 'research_rabbit_hole',
      confidence,
      evidence: {
        duration,
        recentActivities: researchSession.activities
      },
      recommendation: "Research session running long. Found what you need?"
    }
  }

  return { patternType: 'none', confidence: 0 }
}

function findContinuousResearchSession(activities: ActivityRecord[]) {
  const researchActivities = activities
    .filter(a => a.category === 'research')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  if (researchActivities.length === 0) return null

  let sessionStart = researchActivities[0]
  let sessionEnd = researchActivities[researchActivities.length - 1]

  // Check for continuity (gaps < 5 minutes = same session)
  let totalDuration = 0
  let sessionActivities = [sessionStart]

  for (let i = 1; i < researchActivities.length; i++) {
    const prev = researchActivities[i - 1]
    const curr = researchActivities[i]
    const gap = timeDiff(prev.timestamp, curr.timestamp)

    if (gap < 5 * 60) {
      // Continuous session
      sessionActivities.push(curr)
      totalDuration += gap
    } else {
      // Session break, start new session
      if (totalDuration > 30 * 60) {
        // Found a long session, return it
        break
      }
      sessionActivities = [curr]
      totalDuration = 0
    }
  }

  const urls = new Set(sessionActivities.map(a => a.url).filter(Boolean))

  return {
    duration: totalDuration,
    activities: sessionActivities,
    urls: Array.from(urls),
    tabs: urls.size
  }
}
```

**Categorization Logic:**
- **Apps classified as "research":**
  - Chrome/Safari/Firefox (browsing)
  - Stack Overflow
  - GitHub (viewing issues/docs, not coding)
  - Documentation sites
  - YouTube (technical videos)

**Tab Explosion Detection:**
- Track browser tab count (if accessible via browser extension)
- 10+ tabs opened in session = likely rabbit hole

### 3. Context Switching

**Definition:** Frequent switching between different apps/tasks

**Detection Algorithm:**
```typescript
function detectContextSwitching(activities: ActivityRecord[]): PatternDetectionResult {
  const last1Hour = activities.filter(a => isWithinLast(a.timestamp, 1, 'hour'))

  // Count unique apps
  const uniqueApps = new Set(last1Hour.map(a => a.app))
  const switches = last1Hour.length

  // Calculate average time per app
  const appDurations = groupBy(last1Hour, 'app')
  const avgDurationPerApp = Object.values(appDurations).map(acts =>
    sum(acts.map(a => a.duration))
  ).reduce((a, b) => a + b, 0) / uniqueApps.size

  // Thresholds
  const HIGH_SWITCH_COUNT = 20
  const LOW_AVG_DURATION = 3 * 60 // < 3 minutes per app

  let confidence = 0

  if (switches > HIGH_SWITCH_COUNT) {
    confidence += 0.5
  }
  if (avgDurationPerApp < LOW_AVG_DURATION) {
    confidence += 0.3
  }
  if (uniqueApps.size > 8) {
    confidence += 0.2
  }

  if (confidence > 0.5) {
    return {
      patternType: 'context_switching',
      confidence,
      evidence: {
        frequency: switches,
        duration: avgDurationPerApp,
        recentActivities: last1Hour.slice(-10) // Last 10 switches
      },
      recommendation: "Lots of switching. Try focusing on one thing?"
    }
  }

  return { patternType: 'none', confidence: 0 }
}
```

**Ignoring Legitimate Switches:**
- Communication apps (Slack, email) during work hours = normal
- Quick reference lookups (< 30s) = OK
- Only flag switches that indicate scattered attention

### 4. Productive Procrastination (Composite)

**Definition:** Activities that feel productive but avoid the main commitment

**Detection Algorithm:**
```typescript
function detectProductiveProcrastination(
  activities: ActivityRecord[],
  commitment: string
): PatternDetectionResult {
  const last30Min = activities.filter(a => isWithinLast(a.timestamp, 30, 'minutes'))

  // Look for activities that are:
  // 1. Productive in nature (coding, planning, research)
  // 2. BUT not aligned with commitment
  const productiveButOffTrack = last30Min.filter(a =>
    ['coding', 'planning', 'research'].includes(a.category) &&
    a.alignment === 'productive_procrastination'
  )

  const totalDuration = sum(productiveButOffTrack.map(a => a.duration))

  // Threshold: 15+ minutes of productive procrastination
  if (totalDuration > 15 * 60) {
    // Identify specific procrastination type
    const categories = groupBy(productiveButOffTrack, 'category')
    const dominantCategory = Object.entries(categories)
      .sort((a, b) => b[1].length - a[1].length)[0][0]

    let specificPattern = 'productive_procrastination'
    let recommendation = "This feels productive, but is it your main focus?"

    if (dominantCategory === 'planning') {
      specificPattern = 'planning_instead_of_doing'
      recommendation = "Lots of planning. Ready to build?"
    } else if (dominantCategory === 'research') {
      specificPattern = 'research_instead_of_doing'
      recommendation = "Research is helpful, but have you started coding?"
    } else if (dominantCategory === 'coding') {
      specificPattern = 'yak_shaving'
      recommendation = "This refactoring is nice, but does it help with your main task?"
    }

    return {
      patternType: specificPattern,
      confidence: Math.min(totalDuration / (30 * 60), 1.0),
      evidence: {
        duration: totalDuration,
        recentActivities: productiveButOffTrack
      },
      recommendation
    }
  }

  return { patternType: 'none', confidence: 0 }
}
```

**Productive Procrastination Subcategories:**
1. **Planning instead of doing** (most common)
2. **Research instead of doing** (rabbit holes)
3. **Yak shaving** (refactoring unrelated code)
4. **Tool setup dopamine** (configuring tools instead of working)

## Commitment Alignment Algorithm

**Semantic Comparison using AI:**
```typescript
async function checkCommitmentAlignment(
  activity: ActivitySnapshot,
  commitment: string
): Promise<CommitmentAlignment> {
  // Extract semantic context from activity
  const context = extractContext(activity)

  // Use existing AlignmentAnalyzer (from hook-server)
  const result = await AlignmentAnalyzer.analyze({
    prompt: context.description,
    commitment: commitment
  })

  // Map result to alignment
  if (result.isAligned) {
    return {
      isAligned: true,
      alignment: 'on_track',
      confidence: result.confidence,
      reasoning: result.reasoning
    }
  } else if (result.isProductiveProcrastination) {
    return {
      isAligned: false,
      alignment: 'productive_procrastination',
      confidence: result.confidence,
      reasoning: result.reasoning
    }
  } else {
    return {
      isAligned: false,
      alignment: 'off_track',
      confidence: result.confidence,
      reasoning: result.reasoning
    }
  }
}

function extractContext(activity: ActivitySnapshot): { description: string } {
  let description = `App: ${activity.app}`

  if (activity.windowTitle) {
    description += `\nWindow: ${activity.windowTitle}`
  }

  if (activity.url) {
    description += `\nURL: ${activity.url}`
  }

  return { description }
}
```

**Caching Strategy:**
- Cache alignment results per (app, windowTitle, commitment)
- TTL: 5 minutes
- Invalidate on commitment change

**Fallback (when AI unavailable):**
```typescript
function keywordBasedAlignment(
  activity: ActivitySnapshot,
  commitment: string
): CommitmentAlignment {
  const commitmentKeywords = extractKeywords(commitment)
  const activityText = `${activity.app} ${activity.windowTitle} ${activity.url || ''}`

  const matches = commitmentKeywords.filter(kw =>
    activityText.toLowerCase().includes(kw.toLowerCase())
  )

  const matchRatio = matches.length / commitmentKeywords.length

  if (matchRatio > 0.5) {
    return {
      isAligned: true,
      alignment: 'on_track',
      confidence: matchRatio,
      reasoning: `Matched keywords: ${matches.join(', ')}`
    }
  } else {
    return {
      isAligned: false,
      alignment: 'off_track',
      confidence: 1 - matchRatio,
      reasoning: 'No keyword matches found'
    }
  }
}
```

## Activity Categorization

**Rule-based categorization:**
```typescript
function categorizeActivity(activity: ActivitySnapshot): ActivityCategory {
  const app = activity.app.toLowerCase()
  const window = activity.windowTitle.toLowerCase()

  // Coding
  if (
    app.includes('code') ||
    app.includes('vim') ||
    app.includes('sublime') ||
    app.includes('intellij') ||
    app.includes('xcode') ||
    window.includes('.ts') ||
    window.includes('.js') ||
    window.includes('.py')
  ) {
    return 'coding'
  }

  // Planning
  if (
    app.includes('notion') ||
    app.includes('obsidian') ||
    app.includes('roam') ||
    (app.includes('notes') && (window.includes('plan') || window.includes('todo')))
  ) {
    return 'planning'
  }

  // Research
  if (
    (app.includes('chrome') || app.includes('safari') || app.includes('firefox')) &&
    (
      activity.url?.includes('stackoverflow') ||
      activity.url?.includes('github.com') ||
      activity.url?.includes('docs.') ||
      window.includes('documentation')
    )
  ) {
    return 'research'
  }

  // Communication
  if (
    app.includes('slack') ||
    app.includes('mail') ||
    app.includes('zoom') ||
    app.includes('teams')
  ) {
    return 'communication'
  }

  // Default
  return 'other'
}
```

## Intervention Thresholds

**When to trigger interventions:**

| Pattern | Threshold | Cooldown |
|---------|-----------|----------|
| Planning Loop | 3+ occurrences in 30 min | 1 hour |
| Research Rabbit Hole | 1 hour continuous | 2 hours |
| Context Switching | 20+ switches in 1 hour | 30 min |
| Off-track Activity | 10 minutes | 30 min |
| Productive Procrastination | 15 minutes | 1 hour |

**Cooldown Period:**
- Prevent intervention spam
- Track last intervention time per pattern type
- Don't re-trigger same pattern within cooldown window

**Escalation:**
- First occurrence: Gentle nudge
- Second occurrence (within session): Stronger intervention
- Third occurrence: Hard block (if user profile allows)

## Performance Optimization

### Query Optimization
- Keep sliding window queries efficient (indexed by timestamp)
- Limit lookback period (max 2 hours for most patterns)
- Use database aggregates where possible

### Caching
- Cache pattern detection results for 1 minute
- Cache alignment results for 5 minutes
- Invalidate on new activity or commitment change

### Throttling
- Analyze patterns only on activity change (not every poll)
- Debounce rapid switches (wait 3s before analyzing)

## Testing Fixtures

**Fixture: Planning Loop**
```typescript
const planningLoopFixture = [
  { app: 'Notion', windowTitle: 'Marketplace Roadmap', duration: 300, category: 'planning' },
  { app: 'VS Code', windowTitle: 'email.ts', duration: 120, category: 'coding' },
  { app: 'Notion', windowTitle: 'API Design', duration: 420, category: 'planning' },
  { app: 'Notion', windowTitle: 'Database Schema', duration: 360, category: 'planning' },
  { app: 'Notion', windowTitle: 'User Stories', duration: 240, category: 'planning' },
]
// Expected: detectPlanningLoop() → { patternType: 'planning_loop', confidence: 0.4 }
```

**Fixture: Research Rabbit Hole**
```typescript
const rabbitHoleFixture = [
  { app: 'Chrome', url: 'https://reactjs.org/docs', duration: 600 },
  { app: 'Chrome', url: 'https://stackoverflow.com/...', duration: 420 },
  { app: 'Chrome', url: 'https://github.com/...', duration: 720 },
  { app: 'Chrome', url: 'https://medium.com/...', duration: 900 },
]
// Expected: detectResearchRabbitHole() → { patternType: 'research_rabbit_hole', confidence: 0.7 }
```

**Fixture: Context Switching**
```typescript
const contextSwitchFixture = [
  // 25 rapid switches between apps
  { app: 'VS Code', duration: 120 },
  { app: 'Chrome', duration: 90 },
  { app: 'Slack', duration: 45 },
  { app: 'VS Code', duration: 180 },
  // ... 21 more switches
]
// Expected: detectContextSwitching() → { patternType: 'context_switching', confidence: 0.8 }
```
