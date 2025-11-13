/**
 * Types for app-watcher activity monitoring system
 */

export interface ActivitySnapshot {
  timestamp: string // ISO timestamp
  app: string
  windowTitle: string
  url?: string
}

export interface ActivityContext {
  current: ActivitySnapshot
  previous?: ActivitySnapshot
  duration: number // Time spent in current activity (seconds)
}

export interface PatternDetectionResult {
  patternType: 'planning_loop' | 'research_rabbit_hole' | 'context_switching' | 'none'
  confidence: number // 0-1
  evidence: {
    duration?: number
    frequency?: number
    recentActivities?: ActivitySnapshot[]
  }
  recommendation?: string
}

export interface CommitmentAlignment {
  isAligned: boolean
  alignment: 'on_track' | 'off_track' | 'productive_procrastination'
  confidence: number // 0-1
  reasoning: string
}

export interface AppWatcherConfig {
  pollIntervalMs: number // How often to check current app (default: 5000)
  inactivityThresholdMs: number // No activity timeout (default: 300000 = 5 min)
  patternDetectionEnabled: boolean
  interventionEnabled: boolean
  platforms: {
    macos: {
      useAccessibility: boolean
      trackBrowserUrls: boolean
    }
  }
}

export interface PlatformWatcher {
  /**
   * Get current active application and window
   */
  getCurrentActivity(): Promise<ActivitySnapshot>

  /**
   * Check if platform has required permissions
   */
  checkPermissions(): Promise<boolean>

  /**
   * Request permissions from user
   */
  requestPermissions(): Promise<boolean>

  /**
   * Platform name
   */
  readonly platform: 'macos' | 'windows' | 'linux'
}
