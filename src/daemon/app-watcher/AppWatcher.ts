/**
 * Main app watcher - orchestrates activity monitoring
 * Polls platform watcher, logs activity, triggers pattern analysis
 */

import type { PlatformWatcher, AppWatcherConfig } from '../../types/activity.js'
import { MacOSWatcher } from './platforms/MacOSWatcher.js'
import { ActivityLogger } from './ActivityLogger.js'
import { EventEmitter } from 'events'

export interface AppWatcherEvents {
  'activity-changed': (activity: any) => void
  'pattern-detected': (pattern: any) => void
  error: (error: Error) => void
  started: () => void
  stopped: () => void
}

export declare interface AppWatcher {
  on<K extends keyof AppWatcherEvents>(event: K, listener: AppWatcherEvents[K]): this
  emit<K extends keyof AppWatcherEvents>(
    event: K,
    ...args: Parameters<AppWatcherEvents[K]>
  ): boolean
}

export class AppWatcher extends EventEmitter {
  private platformWatcher: PlatformWatcher
  private activityLogger: ActivityLogger
  private config: AppWatcherConfig
  private pollInterval: NodeJS.Timeout | null = null
  private isRunning: boolean = false

  constructor(config?: Partial<AppWatcherConfig>, dbPath?: string) {
    super()

    // Default config
    this.config = {
      pollIntervalMs: config?.pollIntervalMs || 5000,
      inactivityThresholdMs: config?.inactivityThresholdMs || 300000,
      patternDetectionEnabled: config?.patternDetectionEnabled ?? true,
      interventionEnabled: config?.interventionEnabled ?? true,
      platforms: {
        macos: {
          useAccessibility: config?.platforms?.macos?.useAccessibility ?? true,
          trackBrowserUrls: config?.platforms?.macos?.trackBrowserUrls ?? true,
        },
      },
    }

    // Initialize platform watcher based on OS
    this.platformWatcher = this.createPlatformWatcher()

    // Initialize activity logger
    this.activityLogger = new ActivityLogger(dbPath)
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('AppWatcher is already running')
    }

    // Check permissions
    const hasPermissions = await this.platformWatcher.checkPermissions()
    if (!hasPermissions) {
      throw new Error('Missing accessibility permissions. Run: footnote permissions setup')
    }

    this.isRunning = true
    this.emit('started')

    // Start polling
    this.poll() // Immediate first poll
    this.pollInterval = setInterval(() => {
      this.poll()
    }, this.config.pollIntervalMs)

    console.log(`AppWatcher started (polling every ${this.config.pollIntervalMs}ms)`)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }

    this.activityLogger.finalizeCurrentActivity()
    this.isRunning = false
    this.emit('stopped')

    console.log('AppWatcher stopped')
  }

  /**
   * Get current status
   */
  getStatus(): { isRunning: boolean; config: AppWatcherConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    }
  }

  /**
   * Clean up resources
   */
  close(): void {
    this.stop()
    this.activityLogger.close()
  }

  /**
   * Poll current activity
   */
  private async poll(): Promise<void> {
    try {
      // Get current activity from platform
      const activity = await this.platformWatcher.getCurrentActivity()

      // TODO: Categorize activity
      const category = 'other' // Placeholder - will implement categorization

      // TODO: Check alignment with commitment
      const alignment = 'on_track' // Placeholder - will implement alignment check

      // TODO: Get current commitment
      const commitment = 'Default commitment' // Placeholder

      // Log activity
      const activityId = this.activityLogger.logActivity(activity, category, alignment, commitment)

      // Emit activity change event (if new activity)
      if (activityId !== null) {
        this.emit('activity-changed', {
          id: activityId,
          activity,
          category,
          alignment,
        })

        // TODO: Trigger pattern analysis
        // TODO: Trigger intervention if needed
      }
    } catch (error) {
      this.emit('error', error as Error)
      console.error('Error polling activity:', error)
    }
  }

  /**
   * Create platform-specific watcher
   */
  private createPlatformWatcher(): PlatformWatcher {
    const platform = process.platform

    switch (platform) {
      case 'darwin':
        return new MacOSWatcher()
      case 'win32':
        throw new Error('Windows support not yet implemented')
      case 'linux':
        throw new Error('Linux support not yet implemented')
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }
}
