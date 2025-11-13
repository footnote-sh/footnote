/**
 * macOS-specific implementation for app watching
 * Uses AppleScript to query active app and window
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import type { ActivitySnapshot, PlatformWatcher } from '../../../types/activity.js'

const execAsync = promisify(exec)

export class MacOSWatcher implements PlatformWatcher {
  readonly platform = 'macos' as const

  /**
   * Get current active application and window using AppleScript
   */
  async getCurrentActivity(): Promise<ActivitySnapshot> {
    try {
      // AppleScript to get frontmost app and window title
      const script = `
        tell application "System Events"
          set frontApp to name of first application process whose frontmost is true
          set windowTitle to ""
          try
            tell process frontApp
              if (count of windows) > 0 then
                set windowTitle to name of front window
              end if
            end tell
          end try
          return frontApp & "|||" & windowTitle
        end tell
      `

      const { stdout } = await execAsync(`osascript -e '${script}'`)
      const [app, windowTitle] = stdout.trim().split('|||')

      const activity: ActivitySnapshot = {
        timestamp: new Date().toISOString(),
        app: app.trim(),
        windowTitle: windowTitle.trim(),
      }

      // If browser, try to get current URL
      if (this.isBrowser(app)) {
        const url = await this.getBrowserUrl(app)
        if (url) {
          activity.url = url
        }
      }

      return activity
    } catch (error) {
      // Fallback to basic info if AppleScript fails
      console.error('Error getting activity:', error)
      return {
        timestamp: new Date().toISOString(),
        app: 'Unknown',
        windowTitle: '',
      }
    }
  }

  /**
   * Check if current user has accessibility permissions
   */
  async checkPermissions(): Promise<boolean> {
    try {
      // Try to get frontmost app - if this works, we have permissions
      await this.getCurrentActivity()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Request accessibility permissions from user
   * Opens System Preferences to Privacy & Security
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const script = `
        tell application "System Preferences"
          activate
          reveal anchor "Privacy_Accessibility" of pane id "com.apple.preference.security"
        end tell
      `

      await execAsync(`osascript -e '${script}'`)

      console.log('\nPlease grant Accessibility permissions in System Preferences.')
      console.log('Add Terminal.app (or the app running Footnote) to the list.\n')

      return false // User needs to manually grant
    } catch (error) {
      console.error('Error opening System Preferences:', error)
      return false
    }
  }

  /**
   * Check if app is a web browser
   */
  private isBrowser(app: string): boolean {
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Brave', 'Arc']
    return browsers.some((browser) => app.includes(browser))
  }

  /**
   * Get current URL from browser
   * Supports Chrome, Safari, Firefox
   */
  private async getBrowserUrl(app: string): Promise<string | undefined> {
    try {
      if (app.includes('Chrome') || app.includes('Brave')) {
        return await this.getChromeUrl()
      } else if (app.includes('Safari')) {
        return await this.getSafariUrl()
      } else if (app.includes('Firefox')) {
        return await this.getFirefoxUrl()
      }
    } catch (error) {
      // Silently fail - URL extraction is optional
      return undefined
    }
  }

  /**
   * Get URL from Chrome/Brave using AppleScript
   */
  private async getChromeUrl(): Promise<string | undefined> {
    try {
      const script = `
        tell application "Google Chrome"
          if (count of windows) > 0 then
            get URL of active tab of front window
          end if
        end tell
      `

      const { stdout } = await execAsync(`osascript -e '${script}'`, {
        timeout: 2000,
      })
      return stdout.trim()
    } catch {
      return undefined
    }
  }

  /**
   * Get URL from Safari using AppleScript
   */
  private async getSafariUrl(): Promise<string | undefined> {
    try {
      const script = `
        tell application "Safari"
          if (count of windows) > 0 then
            get URL of current tab of front window
          end if
        end tell
      `

      const { stdout } = await execAsync(`osascript -e '${script}'`, {
        timeout: 2000,
      })
      return stdout.trim()
    } catch {
      return undefined
    }
  }

  /**
   * Get URL from Firefox using AppleScript
   */
  private async getFirefoxUrl(): Promise<string | undefined> {
    try {
      const script = `
        tell application "Firefox"
          if (count of windows) > 0 then
            tell front window
              get URL of current tab
            end tell
          end if
        end tell
      `

      const { stdout } = await execAsync(`osascript -e '${script}'`, {
        timeout: 2000,
      })
      return stdout.trim()
    } catch {
      return undefined
    }
  }
}
