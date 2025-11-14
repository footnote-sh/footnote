/**
 * Notification manager - displays interventions as desktop notifications
 * macOS implementation using terminal-notifier
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import type { InterventionResult } from '../../types/intervention.js'

const execAsync = promisify(exec)

export interface NotificationAction {
  type: 'complied' | 'overrode' | 'ignored'
  captureAsFootnote?: boolean
}

export class NotificationManager {
  private isShowingIntervention = false

  /**
   * Show blocking intervention dialog (AppleScript modal)
   * This blocks the user and requires a response
   */
  async showBlockingIntervention(
    intervention: InterventionResult,
    commitment: string
  ): Promise<NotificationAction> {
    // Prevent stacking interventions - only show one at a time
    if (this.isShowingIntervention) {
      console.log(`⏭️  Intervention already showing, skipping...`)
      return { type: 'ignored' }
    }

    this.isShowingIntervention = true

    const title = this.getTitle(intervention.action)
    const message = intervention.message.replace(/"/g, '\\"')
    const commitmentShort = commitment.substring(0, 40)

    console.log(`🚨 Showing BLOCKING intervention: "${title}"`)

    try {
      // AppleScript dialog with buttons (blocking modal)
      const script = `display dialog "Getting distracted?

${message}

Your focus: ${commitmentShort}" buttons {"Take a break", "Override", "Back to focus!"} default button 3 with icon caution with title "Footnote"`

      const { stdout } = await execAsync(`osascript <<'APPLESCRIPT'\n${script}\nAPPLESCRIPT`)

      console.log(`✅ User responded: ${stdout.trim()}`)

      // Parse user response
      let result: NotificationAction
      if (stdout.includes('Back to focus')) {
        result = { type: 'complied' }
      } else if (stdout.includes('Take a break')) {
        // Prompt for break duration
        const breakPrompt = await this.promptForBreak()
        console.log(`📝 User taking break: ${breakPrompt.reason} for ${breakPrompt.minutes} min`)
        result = { type: 'overrode', captureAsFootnote: true }
      } else {
        // Override option
        result = { type: 'overrode' }
      }

      this.isShowingIntervention = false
      return result
    } catch (err) {
      // User cancelled or error occurred
      console.error('❌ Dialog error:', err)
      this.isShowingIntervention = false
      return { type: 'ignored' }
    }
  }

  /**
   * Prompt user for break details
   */
  private async promptForBreak(): Promise<{ reason: string; minutes: number }> {
    try {
      // Get reason for break
      const reasonScript = `set theReason to text returned of (display dialog "Why do you need to switch gears?" default answer "" with title "Footnote" buttons {"Cancel", "Continue"} default button 2)
return theReason`

      const { stdout: reasonOutput } = await execAsync(
        `osascript <<'APPLESCRIPT'\n${reasonScript}\nAPPLESCRIPT`
      )

      const reason = reasonOutput.trim() || 'Break'

      // Get duration
      const durationScript = `set theDuration to text returned of (display dialog "How long do you need? (minutes)" default answer "15" with title "Footnote" buttons {"Cancel", "Set timer"} default button 2)
return theDuration`

      const { stdout: durationOutput } = await execAsync(
        `osascript <<'APPLESCRIPT'\n${durationScript}\nAPPLESCRIPT`
      )

      const minutesStr = durationOutput.trim() || '15'
      const minutes = parseInt(minutesStr, 10) || 15

      return { reason, minutes }
    } catch (err) {
      console.error('❌ Break prompt error:', err)
      return { reason: 'Quick break', minutes: 15 }
    }
  }

  /**
   * Show intervention as desktop notification (non-blocking)
   */
  async showIntervention(
    intervention: InterventionResult,
    commitment: string
  ): Promise<NotificationAction> {
    const title = this.getTitle(intervention.action)
    // Shorten subtitle to avoid cutoff (macOS limits subtitle length)
    const subtitle = commitment.substring(0, 35)
    // Clean message - escape quotes and truncate
    const message = intervention.message
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/[\n\r\t]/g, ' ')
      .substring(0, 200)

    console.log(`📢 Sending notification: "${title}" - "${message}"`)

    try {
      // Use terminal-notifier with Terminal.app as sender (uses Terminal's notification permissions)
      // -ignoreDnD bypasses Focus/Do Not Disturb mode (critical for focus interventions!)
      const cmd = `terminal-notifier -title "Footnote" -subtitle "${subtitle}" -message "${message}" -sound default -sender com.apple.Terminal -group "footnote" -ignoreDnD`
      await execAsync(cmd)

      console.log('✅ Notification sent successfully')

      // For now, always return ignored since we don't have interactive buttons
      // TODO: Add proper action buttons using terminal-notifier actions
      return { type: 'ignored' }
    } catch (err) {
      console.error('❌ Notification error:', err)
      return { type: 'ignored' }
    }
  }

  /**
   * Show simple notification (non-intervention)
   */
  async showNotification(title: string, message: string): Promise<void> {
    const cleanTitle = title.replace(/[\n\r\t"'\\]/g, ' ')
    const cleanMessage = message.replace(/[\n\r\t"'\\]/g, ' ').substring(0, 200)

    try {
      const cmd = `terminal-notifier -title "${cleanTitle}" -message "${cleanMessage}" -sender com.apple.Terminal -group "footnote"`
      await execAsync(cmd)
    } catch (err) {
      console.error('Notification error:', err)
      throw err
    }
  }

  /**
   * Get notification title based on action type
   */
  private getTitle(action: InterventionResult['action']): string {
    switch (action) {
      case 'block':
        return '⛔️ Main thought check-in'
      case 'prompt':
        return '💭 Main thought check-in'
      case 'suggest':
        return '💡 Main thought check-in'
      case 'timebox':
        return '⏱️ Main thought check-in'
      default:
        return '🎯 Main thought check-in'
    }
  }
}
