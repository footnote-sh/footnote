/**
 * Permission checker - verifies and requests macOS accessibility permissions
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class PermissionChecker {
  /**
   * Check if process has accessibility permissions
   */
  async checkAccessibility(): Promise<boolean> {
    try {
      // Try to execute AppleScript that requires accessibility
      const script = `
        tell application "System Events"
          return name of first application process whose frontmost is true
        end tell
      `

      await execAsync(`osascript -e '${script}'`, { timeout: 5000 })
      return true
    } catch (error) {
      // If this fails, we likely don't have permissions
      return false
    }
  }

  /**
   * Request accessibility permissions from user
   * Opens System Preferences to the Accessibility pane
   */
  async requestAccessibility(): Promise<void> {
    try {
      const script = `
        tell application "System Preferences"
          activate
          reveal anchor "Privacy_Accessibility" of pane id "com.apple.preference.security"
        end tell
      `

      await execAsync(`osascript -e '${script}'`)

      console.log('\n🔐 Accessibility Permissions Required\n')
      console.log('Please grant accessibility permissions in System Preferences:')
      console.log('1. Click the lock icon and authenticate')
      console.log('2. Find "Terminal" (or "Footnote") in the list')
      console.log('3. Check the box next to it to enable')
      console.log('4. Close System Preferences\n')
      console.log('Once done, run: footnote daemon start\n')
    } catch (error) {
      console.error('Error opening System Preferences:', error)
      throw error
    }
  }

  /**
   * Get permission status with helpful message
   */
  async getStatus(): Promise<{
    hasPermissions: boolean
    message: string
  }> {
    const hasPermissions = await this.checkAccessibility()

    if (hasPermissions) {
      return {
        hasPermissions: true,
        message: '✅ Accessibility permissions granted',
      }
    } else {
      return {
        hasPermissions: false,
        message: '❌ Accessibility permissions not granted\n   Run: footnote permissions setup',
      }
    }
  }
}
