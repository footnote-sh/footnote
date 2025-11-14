/**
 * Prompts and templates for making tasks more appealing
 * Used by FindTheFun and can be extended with AI generation
 */

export interface ReframingPromptTemplate {
  category: string
  templates: Array<{
    pattern: RegExp
    reframes: string[]
    rationale: string
  }>
}

/**
 * Pre-built reframing templates for common task types
 */
export const REFRAMING_TEMPLATES: ReframingPromptTemplate[] = [
  {
    category: 'Code Writing',
    templates: [
      {
        pattern: /write|implement|code/i,
        reframes: [
          'Code golf: {task} in the fewest lines possible',
          'Clean code challenge: {task} with perfect readability',
          'TDD speedrun: {task} test-first in 30 minutes',
          'Rubber duck session: Explain {task} out loud as you code',
        ],
        rationale: 'Turn coding into a skill-building game',
      },
    ],
  },
  {
    category: 'Debugging',
    templates: [
      {
        pattern: /debug|fix bug|troubleshoot/i,
        reframes: [
          'Detective mode: Hunt down the bug causing {issue}',
          'System archaeology: Trace the bug back to its origins',
          'Bug bounty: Find and eliminate {bug} faster than expected',
          'Rubber duck interrogation: Explain the bug until it reveals itself',
        ],
        rationale: 'Frame debugging as investigation/problem-solving',
      },
    ],
  },
  {
    category: 'Testing',
    templates: [
      {
        pattern: /test|qa|quality/i,
        reframes: [
          'Break it: Try to make {feature} fail in interesting ways',
          'Future-proofing: Prevent bugs before they happen with {tests}',
          'Confidence builder: Prove {feature} works perfectly',
          'Safety net weaving: Create tests for {feature}',
        ],
        rationale: 'Reframe testing as creative destruction or protection',
      },
    ],
  },
  {
    category: 'Documentation',
    templates: [
      {
        pattern: /document|write docs|readme/i,
        reframes: [
          "Teach mode: Explain {topic} like you're the expert",
          'Future gift: Save your future self hours of confusion',
          'Community contribution: Help other devs understand {topic}',
          'Knowledge transfer: Document {topic} so well a junior could use it',
        ],
        rationale: 'Connect docs to helping others or future self',
      },
    ],
  },
  {
    category: 'Refactoring',
    templates: [
      {
        pattern: /refactor|clean up|improve/i,
        reframes: [
          'Code spa day: Pamper {codebase} with clean refactoring',
          'Leave it better: Scout rule applied to {code}',
          'Technical debt paydown: Clear {code} of cruft',
          'Code archaeology: Modernize {legacy} code',
        ],
        rationale: 'Frame refactoring as improvement/care',
      },
    ],
  },
  {
    category: 'Learning',
    templates: [
      {
        pattern: /learn|study|research/i,
        reframes: [
          'Skill tree unlocked: Learn {technology}',
          'Power-up acquired: Master {concept}',
          'Deep dive: Explore {topic} until it clicks',
          'Experiment time: Play with {new-tool}',
        ],
        rationale: 'Frame learning as exploration or skill acquisition',
      },
    ],
  },
  {
    category: 'Meetings',
    templates: [
      {
        pattern: /meeting|standup|sync/i,
        reframes: [
          'Intelligence gathering: Collect context from {meeting}',
          'Alignment check: Sync with team on {topic}',
          'Co-working session: Collaborate on {goal} with team',
          'Fast-forward: Get unblocked in {meeting}',
        ],
        rationale: 'Reframe meetings as information gathering or unblocking',
      },
    ],
  },
  {
    category: 'Admin/Boring Tasks',
    templates: [
      {
        pattern: /admin|paperwork|form|report/i,
        reframes: [
          'Power through: Batch {admin-task} and be done',
          'Pomodoro sprint: {task} for 25 minutes',
          'Habit stack: Do {boring-task} while listening to [podcast]',
          'Friday finish: Clear {admin} to start fresh next week',
        ],
        rationale: 'Bundle with enjoyable activities or time-box strictly',
      },
    ],
  },
]

/**
 * AI prompt templates for generating custom reframes
 */
export const AI_REFRAMING_PROMPTS = {
  gamification: `Reframe this boring task as a game or challenge:
Task: {task}
User profile: {profile}

Generate 3 game-like reframes that make this fun.`,

  curiosity: `Reframe this task to spark curiosity and learning:
Task: {task}
User profile: {profile}

Generate 3 curiosity-driven reframes.`,

  impact: `Reframe this task to highlight its meaningful impact:
Task: {task}
User profile: {profile}

Generate 3 impact-focused reframes showing why this matters.`,

  constraint: `Add creative constraints to make this task interesting:
Task: {task}
User profile: {profile}

Generate 3 constraint-based reframes that spark creativity.`,
}

/**
 * Get reframe suggestions for a task
 */
export function getReframeSuggestions(task: string): string[] {
  const suggestions: string[] = []

  for (const category of REFRAMING_TEMPLATES) {
    for (const template of category.templates) {
      if (template.pattern.test(task)) {
        // Replace {task} placeholder with actual task
        const customized = template.reframes.map((r) => r.replace('{task}', task))
        suggestions.push(...customized)
      }
    }
  }

  return suggestions
}

/**
 * Match task to reframing category
 */
export function categorizeTask(task: string): string | null {
  for (const category of REFRAMING_TEMPLATES) {
    for (const template of category.templates) {
      if (template.pattern.test(task)) {
        return category.category
      }
    }
  }

  return null
}
