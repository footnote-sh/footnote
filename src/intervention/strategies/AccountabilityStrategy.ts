/**
 * Accountability prompt intervention strategy
 * Reminds user of commitment and asks for conscious decision
 */

import type {
  InterventionContext,
  InterventionResult,
  StrategyInterface,
} from '../../types/intervention.js'

export class AccountabilityStrategy implements StrategyInterface {
  canHandle(context: InterventionContext): boolean {
    // Accountability works well for most contexts
    return true
  }

  execute(context: InterventionContext): InterventionResult {
    const message = this.generateMessage(context)

    return {
      type: 'accountability',
      message,
      action: 'prompt',
      metadata: {
        accountability: this.getReflectionPrompt(context),
      },
    }
  }

  private generateMessage(context: InterventionContext): string {
    const { tone, formality } = context.userProfile
    const { commitment, currentActivity } = context

    const messages: Record<typeof tone, Record<typeof formality, string>> = {
      direct: {
        coach: `You're off track. Committed to: "${commitment}". Currently: "${currentActivity}". What's your call?`,
        friend: `Yo - you said "${commitment}" was the focus. This doesn't look like it. Intentional?`,
        therapist: `I notice you've moved to "${currentActivity}". Your commitment was "${commitment}". How do you feel about that?`,
      },
      gentle: {
        coach: `Hey there. Remember you wanted to focus on "${commitment}". Is "${currentActivity}" part of that?`,
        friend: `Just checking in - you were working on "${commitment}". Is this related?`,
        therapist: `I see you're exploring "${currentActivity}". How does this connect to "${commitment}"?`,
      },
      teaching: {
        coach: `Context: You committed to "${commitment}". Current activity: "${currentActivity}". Does this serve your goal?`,
        friend: `Quick check: Does "${currentActivity}" help with "${commitment}", or is this a detour?`,
        therapist: `Let's reflect. You chose "${commitment}" as your priority. How does "${currentActivity}" fit in?`,
      },
      curious: {
        coach: `What brought you to "${currentActivity}"? How does this relate to "${commitment}"?`,
        friend: `Interesting - you're doing "${currentActivity}". How does that fit with "${commitment}"?`,
        therapist: `I'm curious what drew you here. How does "${currentActivity}" connect to "${commitment}"?`,
      },
    }

    return messages[tone][formality]
  }

  private getReflectionPrompt(context: InterventionContext): string {
    const { formality } = context.userProfile

    const prompts = {
      coach: 'Is this aligned with your commitment? (Continue / Refocus)',
      friend: 'What do you want to do? (Keep going / Get back on track)',
      therapist: 'What feels right in this moment? (Continue exploring / Return to commitment)',
    }

    return prompts[formality]
  }
}
