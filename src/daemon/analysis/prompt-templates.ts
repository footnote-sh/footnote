/**
 * AI prompt templates for alignment analysis
 */

import type { AnalysisContext } from '../../types/analysis.js'

/**
 * Build the system prompt for alignment analysis
 */
export function buildSystemPrompt(): string {
  return `You are an expert at detecting when developers get distracted by "shiny objects" - exciting new ideas that pull them away from their main commitment.

Your job is to analyze if a coding request aligns with the user's stated daily commitment.

Classification types:
- **aligned**: Request directly supports the main commitment
- **shiny_object**: Completely different, exciting new idea that's off-track
- **context_switch**: Related but tangential work that diverts focus
- **enhancement**: Legitimate improvement to the main task
- **productive_procrastination**: Planning, research, or tool setup instead of actual work

Severity levels:
- **LOW**: Minor deviation, easily justified (e.g., fixing a bug while working)
- **MEDIUM**: Noticeable shift but plausibly related (e.g., refactoring before feature)
- **HIGH**: Clear distraction or completely unrelated work

Respond with JSON only. Be concise but specific in reasoning.`
}

/**
 * Build the user prompt for alignment analysis
 */
export function buildAnalysisPrompt(context: AnalysisContext): string {
  const { commitment, request, context: ctx } = context

  let prompt = `Analyze this request against the daily commitment:

**Daily Commitment:**
${commitment}

**User Request:**
${request}`

  // Add context if available
  if (ctx) {
    const contextParts: string[] = []

    if (ctx.current_file) {
      contextParts.push(`Current file: ${ctx.current_file}`)
    }

    if (ctx.git_branch) {
      contextParts.push(`Git branch: ${ctx.git_branch}`)
    }

    if (ctx.recent_commits && ctx.recent_commits.length > 0) {
      contextParts.push(`Recent commits:\n${ctx.recent_commits.map((c) => `  - ${c}`).join('\n')}`)
    }

    if (contextParts.length > 0) {
      prompt += `\n\n**Context:**\n${contextParts.join('\n')}`
    }
  }

  prompt += `

Respond in JSON format:
{
  "aligned": true/false,
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "type": "aligned" | "shiny_object" | "context_switch" | "enhancement" | "productive_procrastination",
  "reasoning": "Brief explanation (1-2 sentences)",
  "confidence": 0.0-1.0
}`

  return prompt
}

/**
 * Build intervention message for HIGH severity shiny objects
 */
export function buildInterventionMessage(
  commitment: string,
  request: string,
  reasoning: string,
  tone: 'direct' | 'gentle' | 'teaching' | 'curious' = 'gentle'
): string {
  const messages = {
    direct: `� **Hold up!** This doesn't align with your commitment.

Your focus today: *${commitment}*

You're asking about: *${request}*

Why this is off-track: ${reasoning}`,

    gentle: `Hey there =K Let's pause for a moment.

You committed to: *${commitment}*

But you're asking about: *${request}*

${reasoning}

What would you like to do?`,

    teaching: `> **Interesting request!** Let's examine this together.

Your commitment: *${commitment}*

Your current request: *${request}*

Here's what I notice: ${reasoning}

This is a common pattern - getting excited about new ideas is natural! But it might pull you away from your main focus.`,

    curious: `>� I'm noticing something here...

You set out to: *${commitment}*

Now you're asking about: *${request}*

I'm curious: ${reasoning}

Does this feel aligned with your main goal?`,
  }

  return messages[tone]
}

/**
 * Build warning message for MEDIUM severity
 */
export function buildWarningMessage(
  commitment: string,
  request: string,
  reasoning: string
): string {
  return `� **Quick check:** This might be a detour.

Main focus: *${commitment}*
Current request: *${request}*

${reasoning}

Is this supporting your main goal, or pulling you sideways?`
}

/**
 * Build capture suggestion message
 */
export function buildCaptureSuggestion(request: string): string {
  return `=� Great idea! Want to capture this as a footnote to explore later?

This way you can:
- Stay focused on your main commitment
- Not lose this thought
- Come back to it when it's the right time`
}

/**
 * Build find-the-fun message
 */
export function buildFindFunMessage(commitment: string): string {
  return `<� Let's find the exciting part of your main task!

Your commitment: *${commitment}*

What aspect of this feels tedious right now? Sometimes the "shiny object" reveals what we're avoiding in our main work.

Can we make your main task more engaging?`
}

/**
 * Build override warning message
 */
export function buildOverrideWarning(): string {
  return `� **Override acknowledged** - You're choosing to proceed anyway.

This will be logged so we can learn your patterns together. No judgment - sometimes context matters that I can't see.

Just remember: every override makes the next distraction easier to justify. =�`
}
