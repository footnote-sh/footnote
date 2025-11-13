/**
 * Format intervention messages based on communication preferences
 * Adds personality and adapts output style
 */

import type { InterventionResult } from '../types/intervention.js'
import type { UserProfile } from '../types/state.js'

export class InterventionFormatter {
  /**
   * Format intervention result for display to user
   */
  static format(result: InterventionResult, profile: UserProfile): string {
    const sections: string[] = []

    // Add emoji/icon based on intervention type (if user prefers visual cues)
    const icon = this.getIcon(result.type)
    sections.push(`${icon} ${result.message}`)

    // Add action-specific details
    if (result.action === 'block' && result.metadata?.accountability) {
      sections.push('')
      sections.push(result.metadata.accountability)
    }

    if (result.action === 'suggest' && result.metadata?.microTasks) {
      sections.push('')
      sections.push('Pick one:')
      result.metadata.microTasks.forEach((task, i) => {
        sections.push(`  ${i + 1}. ${task}`)
      })
    }

    if (result.action === 'timebox' && result.metadata?.timeLimit) {
      sections.push('')
      sections.push(`⏱️  Timer: ${result.metadata.timeLimit} minutes`)
    }

    // Add footer based on learning visibility preference
    if (profile.learning.visibility === 'explicit') {
      sections.push('')
      sections.push(this.getLearningFooter(result, profile))
    }

    return sections.join('\n')
  }

  /**
   * Get icon for intervention type
   */
  private static getIcon(type: InterventionResult['type']): string {
    const icons = {
      hard_block: '🛑',
      accountability: '💭',
      micro_task: '✅',
      time_boxed: '⏱️',
    }

    return icons[type]
  }

  /**
   * Generate learning/adaptation footer
   */
  private static getLearningFooter(result: InterventionResult, profile: UserProfile): string {
    if (!profile.learning.adaptation_enabled) {
      return ''
    }

    const currentStrategy = profile.behavior_tracking.current_strategy
    const effectivenessScore = profile.behavior_tracking.effectiveness_scores[currentStrategy]

    const footers = {
      invisible: '', // No footer
      optional: `💡 Current approach: ${currentStrategy} (${Math.round(effectivenessScore * 100)}% effective)`,
      explicit: [
        `📊 Strategy: ${result.type}`,
        `📈 Effectiveness: ${Math.round(effectivenessScore * 100)}%`,
        `🔄 Adapting based on your responses`,
      ].join('\n'),
    }

    return footers[profile.learning.visibility]
  }

  /**
   * Format for CLI display (with colors and formatting)
   */
  static formatForCLI(result: InterventionResult, profile: UserProfile): string {
    // This would use chalk or similar for terminal colors
    // For now, just return formatted text
    return this.format(result, profile)
  }

  /**
   * Format for notification (shorter, no multi-line)
   */
  static formatForNotification(result: InterventionResult): string {
    let notification = `${this.getIcon(result.type)} ${result.message}`

    if (result.action === 'timebox' && result.metadata?.timeLimit) {
      notification += ` (${result.metadata.timeLimit}min)`
    }

    return notification
  }

  /**
   * Format for logging/debugging
   */
  static formatForLog(result: InterventionResult, profile: UserProfile): object {
    return {
      type: result.type,
      action: result.action,
      message: result.message,
      metadata: result.metadata,
      profile: {
        current_strategy: profile.behavior_tracking.current_strategy,
        tone: profile.communication.tone,
        formality: profile.communication.formality,
      },
    }
  }
}
