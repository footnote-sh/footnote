/**
 * Micro-task intervention strategy
 * Breaks down commitment into tiny, immediately actionable steps
 */

import type {
  InterventionContext,
  InterventionResult,
  StrategyInterface,
} from '../../types/intervention.js'

export class MicroTaskStrategy implements StrategyInterface {
  canHandle(context: InterventionContext): boolean {
    // Micro-tasks work well for planning procrastination and context switches
    return (
      context.trigger === 'planning_procrastination' ||
      context.trigger === 'context_switch' ||
      context.userProfile.patterns.planning_instead_of_doing
    )
  }

  execute(context: InterventionContext): InterventionResult {
    const message = this.generateMessage(context)
    const microTasks = this.generateMicroTasks(context)

    return {
      type: 'micro_task',
      message,
      action: 'suggest',
      metadata: {
        microTasks,
      },
    }
  }

  private generateMessage(context: InterventionContext): string {
    const { tone, formality } = context.userProfile
    const { commitment } = context

    const messages: Record<typeof tone, Record<typeof formality, string>> = {
      direct: {
        coach: `Stop overthinking. Pick the tiniest possible step toward "${commitment}" and do it now.`,
        friend: `Dude, just start. Here's the smallest thing you can do:`,
        therapist: `You're stuck in analysis. Let's make it simple. One tiny action toward "${commitment}":`,
      },
      gentle: {
        coach: `Let's break "${commitment}" into something small and doable right now:`,
        friend: `No pressure - just pick one tiny thing to get started on "${commitment}":`,
        therapist: `Big tasks can feel overwhelming. What's one small step toward "${commitment}"?`,
      },
      teaching: {
        coach: `Momentum comes from action, not planning. Here's a micro-task for "${commitment}":`,
        friend: `Pro tip: Start with something so small it feels silly. Like this:`,
        therapist: `The paradox of action: Starting small makes hard things feel manageable. Try this:`,
      },
      curious: {
        coach: `What's the smallest possible action that moves "${commitment}" forward?`,
        friend: `If you had to make progress in 2 minutes, what would you do?`,
        therapist: `What would it feel like to take just one tiny step right now?`,
      },
    }

    return messages[tone][formality]
  }

  private generateMicroTasks(context: InterventionContext): string[] {
    const { commitment, trigger } = context

    // Generate context-appropriate micro-tasks
    const taskSuggestions: Record<typeof trigger, string[]> = {
      planning_procrastination: [
        `Open the file/tool needed for "${commitment}"`,
        `Write one sentence about "${commitment}"`,
        `Set a 5-minute timer and start anything related to "${commitment}"`,
      ],
      context_switch: [
        `Close the current tab/window and open what you need for "${commitment}"`,
        `Write down your next immediate action for "${commitment}"`,
        `Spend 2 minutes on the easiest part of "${commitment}"`,
      ],
      shiny_object: [
        `Bookmark this for later and return to "${commitment}"`,
        `Note this idea in 10 words or less, then back to "${commitment}"`,
        `Quick: What's the next obvious step for "${commitment}"?`,
      ],
      research_rabbit_hole: [
        `Save this resource and get back to implementing "${commitment}"`,
        `Time-box this research: 5 more minutes, then back to "${commitment}"`,
        `What's one thing you can do with what you already know about "${commitment}"?`,
      ],
    }

    return taskSuggestions[trigger]
  }
}
