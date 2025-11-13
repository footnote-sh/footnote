/**
 * Hard block intervention strategy
 * Blocks access and requires explicit confirmation to proceed
 */

import type {
  InterventionContext,
  InterventionResult,
  StrategyInterface,
} from '../../types/intervention.js'

export class HardBlockStrategy implements StrategyInterface {
  canHandle(context: InterventionContext): boolean {
    // Hard block is suitable for known procrastination triggers
    return (
      context.trigger === 'shiny_object' ||
      context.trigger === 'research_rabbit_hole' ||
      context.userProfile.patterns.research_rabbit_holes
    )
  }

  execute(context: InterventionContext): InterventionResult {
    const messages = this.generateMessage(context)

    return {
      type: 'hard_block',
      message: messages.primary,
      action: 'block',
      metadata: {
        accountability: messages.accountability,
      },
    }
  }

  private generateMessage(context: InterventionContext): {
    primary: string
    accountability: string
  } {
    const { tone, formality } = context.userProfile
    const { commitment, currentActivity, trigger } = context

    // Base messages by tone
    const toneMessages = {
      direct: {
        shiny_object: `Stop. You committed to "${commitment}". This isn't it.`,
        research_rabbit_hole: `This is a research rabbit hole. You know what you're supposed to be doing.`,
        planning_procrastination: `You're planning instead of doing. Back to "${commitment}".`,
        context_switch: `Context switching detected. Return to "${commitment}".`,
      },
      gentle: {
        shiny_object: `Hey, I noticed you're exploring something new. Remember your commitment: "${commitment}"`,
        research_rabbit_hole: `This looks like it might be research. Your main focus today is "${commitment}"`,
        planning_procrastination: `I see you planning. How about we work on "${commitment}" instead?`,
        context_switch: `You're switching contexts. Would you like to get back to "${commitment}"?`,
      },
      teaching: {
        shiny_object: `I see you're curious about "${currentActivity}". Let's think: does this serve "${commitment}"?`,
        research_rabbit_hole: `Research can be valuable, but is this helping "${commitment}" right now?`,
        planning_procrastination: `Planning feels productive, but execution matters more. Back to "${commitment}"?`,
        context_switch: `Context switching has cognitive costs. Your priority: "${commitment}"`,
      },
      curious: {
        shiny_object: `What drew you to "${currentActivity}"? Remember you chose "${commitment}" today.`,
        research_rabbit_hole: `What are you hoping to find? Will it help with "${commitment}"?`,
        planning_procrastination: `What's making you plan instead of work on "${commitment}"?`,
        context_switch: `What's pulling you away from "${commitment}"?`,
      },
    }

    // Accountability prompts by formality
    const accountabilityPrompts = {
      coach: `If you continue, you're choosing to break your commitment. Is that the decision you want to make?`,
      friend: `Hey, you said this was important. Still feel that way?`,
      therapist: `What's making this difficult right now? What do you need to get back on track?`,
    }

    return {
      primary: toneMessages[tone][trigger],
      accountability: accountabilityPrompts[formality],
    }
  }
}
