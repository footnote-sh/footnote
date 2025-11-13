/**
 * Time-boxed exploration intervention strategy
 * Allows controlled exploration with explicit time limit
 */

import type {
  InterventionContext,
  InterventionResult,
  StrategyInterface,
} from '../../types/intervention.js'

export class TimeBoxedStrategy implements StrategyInterface {
  canHandle(context: InterventionContext): boolean {
    // Time-boxing works well for research and curiosity-driven detours
    return (
      context.trigger === 'research_rabbit_hole' ||
      context.trigger === 'shiny_object' ||
      context.userProfile.patterns.research_rabbit_holes ||
      context.userProfile.patterns.tool_setup_dopamine
    )
  }

  execute(context: InterventionContext): InterventionResult {
    const timeLimit = this.determineTimeLimit(context)
    const message = this.generateMessage(context, timeLimit)

    return {
      type: 'time_boxed',
      message,
      action: 'timebox',
      metadata: {
        timeLimit,
      },
    }
  }

  private determineTimeLimit(context: InterventionContext): number {
    const { trigger, timeOfDay } = context

    // Shorter time limits for known high-risk triggers
    const baseTimeMinutes: Record<typeof trigger, number> = {
      research_rabbit_hole: 10,
      shiny_object: 5,
      planning_procrastination: 10,
      context_switch: 5,
    }

    // Reduce time limits later in the day (fatigue increases distraction risk)
    const hour = parseInt(timeOfDay.split(':')[0])
    const multiplier = hour >= 15 ? 0.5 : 1 // Afternoon/evening: cut time in half

    return Math.floor(baseTimeMinutes[trigger] * multiplier)
  }

  private generateMessage(context: InterventionContext, timeLimit: number): string {
    const { tone, formality } = context.userProfile
    const { commitment, currentActivity } = context

    const messages: Record<typeof tone, Record<typeof formality, (minutes: number) => string>> = {
      direct: {
        coach: (m) =>
          `You have ${m} minutes for "${currentActivity}". Timer starts now. Then back to "${commitment}".`,
        friend: (m) => `Fine. ${m} minutes for this, then you're back on "${commitment}". Deal?`,
        therapist: (m) =>
          `Let's make a deal: ${m} minutes for "${currentActivity}", then we return to "${commitment}".`,
      },
      gentle: {
        coach: (m) =>
          `How about ${m} minutes for "${currentActivity}"? Then we can refocus on "${commitment}".`,
        friend: (m) =>
          `I know this is interesting. Take ${m} minutes, then let's get back to "${commitment}".`,
        therapist: (m) =>
          `I understand the pull. Would ${m} minutes satisfy your curiosity, then back to "${commitment}"?`,
      },
      teaching: {
        coach: (m) =>
          `Time-boxing allows exploration without derailment. ${m} minutes for "${currentActivity}", then "${commitment}".`,
        friend: (m) =>
          `Pro move: ${m} minutes to scratch this itch, then back to focused work on "${commitment}".`,
        therapist: (m) =>
          `Curiosity is valuable when bounded. Let's honor it: ${m} minutes, then return to "${commitment}".`,
      },
      curious: {
        coach: (m) =>
          `What could you discover about "${currentActivity}" in ${m} minutes? Then back to "${commitment}".`,
        friend: (m) =>
          `If you had ${m} minutes to explore this, what would you look for? Then back to "${commitment}".`,
        therapist: (m) =>
          `How would it feel to give yourself ${m} minutes here, knowing you'll return to "${commitment}"?`,
      },
    }

    return messages[tone][formality](timeLimit)
  }
}
