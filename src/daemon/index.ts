/**
 * Main daemon entry point
 * Starts both Hook Server and App Watcher
 */

import { createHookServer, setupGracefulShutdown } from './hook-server/server.js'
import { AppWatcher } from './app-watcher/AppWatcher.js'
import { StateManager } from '../state/StateManager.js'
import { ProfileStore } from '../state/ProfileStore.js'
import { CommitmentStore } from '../state/CommitmentStore.js'
import { CommitmentMatcher } from './app-watcher/CommitmentMatcher.js'
import { PatternAnalyzer } from './app-watcher/PatternAnalyzer.js'
import { ProductiveProcrastinationDetector } from './app-watcher/ProductiveProcrastinationDetector.js'
import { InterventionTrigger } from './app-watcher/InterventionTrigger.js'
import type { ActivitySnapshot } from '../types/activity.js'

async function main() {
  console.log('Starting Footnote daemon...')

  // Initialize state management
  const stateManager = new StateManager()
  const profileStore = new ProfileStore(stateManager)
  const commitmentStore = new CommitmentStore(stateManager)

  // Start Hook Server
  console.log('Starting Hook Server on http://localhost:3040...')
  const hookServer = await createHookServer({ port: 3040, host: '127.0.0.1' })
  setupGracefulShutdown(hookServer)

  // Initialize app watcher components
  const profile = profileStore.get()
  const commitmentMatcher = new CommitmentMatcher(commitmentStore, profile)
  const patternAnalyzer = new PatternAnalyzer()
  const ppDetector = new ProductiveProcrastinationDetector()
  const interventionTrigger = new InterventionTrigger()

  // Import ActivityLogger to access recent activity
  const { ActivityLogger } = await import('./app-watcher/ActivityLogger.js')
  const activityLogger = new ActivityLogger()

  // Initialize app watcher
  const appWatcher = new AppWatcher({
    pollIntervalMs: 5000, // 5 seconds
    inactivityThresholdMs: 300000, // 5 minutes
    patternDetectionEnabled: true,
    interventionEnabled: true,
    platforms: {
      macos: {
        useAccessibility: true,
        trackBrowserUrls: true,
      },
    },
  })

  // Listen for activity changes
  appWatcher.on('activity-changed', async (event) => {
    try {
      const { activity, category } = event

      // Get current commitment
      const commitment = stateManager.getCurrentCommitment()
      if (!commitment) {
        // No commitment set, skip analysis
        return
      }

      // Check alignment with commitment
      const alignment = await commitmentMatcher.checkAlignment(
        activity as ActivitySnapshot,
        commitment.mainThought
      )

      // Get recent activity for pattern detection (last 2 hours)
      const recentActivity = activityLogger.getRecentActivity(2)

      // Detect patterns
      const pattern = patternAnalyzer.analyzeActivity({
        current: activity as ActivitySnapshot,
        duration: 0,
      })

      // Check for productive procrastination
      const ppPattern = ppDetector.detectProductiveProcrastination(
        recentActivity,
        commitment.mainThought
      )

      // Determine if intervention needed
      const shouldIntervene = interventionTrigger.shouldIntervene(
        pattern.patternType !== 'none' ? pattern : ppPattern,
        alignment
      )

      if (shouldIntervene) {
        // Get user profile
        const profile = profileStore.get()
        if (profile) {
          await interventionTrigger.triggerIntervention(
            profile,
            pattern.patternType !== 'none' ? pattern : ppPattern,
            alignment,
            `${activity.app} - ${activity.windowTitle}`,
            commitment.mainThought,
            event.id || 0
          )
        }
      }
    } catch (error) {
      console.error('Error processing activity:', error)
    }
  })

  // Listen for sleep/wake events
  appWatcher.on('sleep-detected', (sleepTime) => {
    console.log(`💤 Sleep detected at ${sleepTime.toLocaleString()}`)
  })

  appWatcher.on('wake-detected', (wakeTime, sleepDuration) => {
    const minutes = (sleepDuration / 1000 / 60).toFixed(1)
    console.log(`☀️  Wake detected at ${wakeTime.toLocaleString()} (slept for ${minutes} minutes)`)
  })

  // Listen for errors
  appWatcher.on('error', (error) => {
    console.error('App watcher error:', error)
  })

  // Start app watcher
  try {
    await appWatcher.start()
    console.log('App Watcher started (polling every 5s)')
  } catch (error) {
    console.error('Failed to start App Watcher:', error)
    console.error('Note: App watching requires accessibility permissions')
    console.error('Run: footnote permissions setup')
  }

  console.log('\nFootnote daemon is running')
  console.log('Press Ctrl+C to stop')

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nStopping Footnote daemon...')
    appWatcher.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\nStopping Footnote daemon...')
    appWatcher.stop()
    process.exit(0)
  })
}

// Run daemon
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
