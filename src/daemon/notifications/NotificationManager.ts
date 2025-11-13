/**
 * Notification manager - displays interventions as desktop notifications
 * macOS implementation using node-notifier
 */

import notifier from 'node-notifier'
import type { InterventionResult } from '../../types/intervention.js'

export interface NotificationAction {
  type: 'complied' | 'overrode' | 'ignored'
  captureAsFootnote?: boolean
}

export class NotificationManager {
  /**
   * Show intervention as desktop notification
   */
  async showIntervention(
    intervention: InterventionResult,
    commitment: string
  ): Promise<NotificationAction> {
    return new Promise((resolve) => {
      const title = this.getTitle(intervention.action)
      const message = intervention.message

      // Show simple notification (avoiding JSON parse errors from complex actions)
      notifier.notify(
        {
          title,
          message,
          sound: true,
          timeout: 10, // 10 seconds
          subtitle: `Your focus: ${commitment}`,
        },
        (err, response, metadata) => {
          if (err) {
            console.error('Notification error:', err)
            resolve({ type: 'ignored' })
            return
          }

          // For now, always resolve as ignored since we don't have interactive buttons
          // TODO: Add proper action buttons once node-notifier config is fixed
          resolve({ type: 'ignored' })
        }
      )
    })
  }

  /**
   * Show simple notification (non-intervention)
   */
  async showNotification(title: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title,
          message,
          sound: false,
          wait: false,
          timeout: 5,
        },
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
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
