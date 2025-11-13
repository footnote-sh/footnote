/**
 * AI-powered task reframing to make boring tasks more appealing
 * "Find the fun" - reframes tasks in ways that make them more motivating
 */

import type { UserProfile } from '../types/state.js'

export interface TaskReframe {
  original: string
  reframed: string
  approach: 'gamification' | 'curiosity' | 'mastery' | 'impact' | 'social' | 'constraint'
  appeal: string // Why this reframe might work
}

export class FindTheFun {
  /**
   * Generate multiple reframes for a boring task
   */
  static reframeTask(boringTask: string, profile: UserProfile): TaskReframe[] {
    const reframes: TaskReframe[] = []

    // Generate different reframes based on known motivation types
    reframes.push(this.gamifyTask(boringTask))
    reframes.push(this.curiosityFrame(boringTask))
    reframes.push(this.masteryFrame(boringTask))
    reframes.push(this.impactFrame(boringTask))
    reframes.push(this.socialFrame(boringTask))
    reframes.push(this.constraintFrame(boringTask))

    // Sort by profile preferences
    return this.sortByProfile(reframes, profile)
  }

  /**
   * Gamification reframe: Add game-like elements
   */
  private static gamifyTask(task: string): TaskReframe {
    const gamifications = [
      {
        pattern: /write|draft|document/i,
        reframe: (t: string) => `Speed-run: ${t} in record time`,
        appeal: 'Turn it into a timed challenge',
      },
      {
        pattern: /fix|debug|solve/i,
        reframe: (t: string) => `Boss battle: ${t}`,
        appeal: 'Frame it as defeating an enemy',
      },
      {
        pattern: /review|check|test/i,
        reframe: (t: string) => `Quality assurance speedrun: ${t}`,
        appeal: 'Compete against yourself for speed + accuracy',
      },
      {
        pattern: /.*/,
        reframe: (t: string) => `Achievement unlocked: ${t}`,
        appeal: 'Collect completion achievements',
      },
    ]

    for (const g of gamifications) {
      if (g.pattern.test(task)) {
        return {
          original: task,
          reframed: g.reframe(task),
          approach: 'gamification',
          appeal: g.appeal,
        }
      }
    }

    return {
      original: task,
      reframed: `Level up: ${task}`,
      approach: 'gamification',
      appeal: 'Frame as progression',
    }
  }

  /**
   * Curiosity reframe: Add learning angle
   */
  private static curiosityFrame(task: string): TaskReframe {
    const curiosityFrames = [
      {
        pattern: /implement|build|create/i,
        reframe: (t: string) => `Experiment: How fast/elegant can I ${t.toLowerCase()}?`,
        appeal: 'Turn it into a learning experiment',
      },
      {
        pattern: /refactor|improve|optimize/i,
        reframe: (t: string) => `Research: What's the cleanest way to ${t.toLowerCase()}?`,
        appeal: 'Discover best practices',
      },
      {
        pattern: /fix|debug/i,
        reframe: (t: string) => `Mystery: What's really causing [issue]?`,
        appeal: 'Frame as detective work',
      },
      {
        pattern: /.*/,
        reframe: (t: string) => `What will I learn by doing: ${t}?`,
        appeal: 'Focus on learning outcome',
      },
    ]

    for (const f of curiosityFrames) {
      if (f.pattern.test(task)) {
        return {
          original: task,
          reframed: f.reframe(task),
          approach: 'curiosity',
          appeal: f.appeal,
        }
      }
    }

    return {
      original: task,
      reframed: `Discovery: ${task}`,
      approach: 'curiosity',
      appeal: 'Approach with beginner mind',
    }
  }

  /**
   * Mastery reframe: Focus on skill building
   */
  private static masteryFrame(task: string): TaskReframe {
    return {
      original: task,
      reframed: `Skill practice: ${task}`,
      approach: 'mastery',
      appeal: 'Build expertise through repetition',
    }
  }

  /**
   * Impact reframe: Connect to meaningful outcome
   */
  private static impactFrame(task: string): TaskReframe {
    const impactFrames = [
      {
        pattern: /test|qa/i,
        reframe: (t: string) => `Prevent future bugs: ${t}`,
        appeal: 'Save your future self time and frustration',
      },
      {
        pattern: /document|write/i,
        reframe: (t: string) => `Help future developers: ${t}`,
        appeal: "Make someone else's life easier",
      },
      {
        pattern: /refactor|clean/i,
        reframe: (t: string) => `Leave code better than you found it: ${t}`,
        appeal: 'Be a good codebase citizen',
      },
      {
        pattern: /.*/,
        reframe: (t: string) => `This enables: [next feature]. Do: ${t}`,
        appeal: 'Connect to bigger goal',
      },
    ]

    for (const f of impactFrames) {
      if (f.pattern.test(task)) {
        return {
          original: task,
          reframed: f.reframe(task),
          approach: 'impact',
          appeal: f.appeal,
        }
      }
    }

    return {
      original: task,
      reframed: `Create value: ${task}`,
      approach: 'impact',
      appeal: 'Focus on the why',
    }
  }

  /**
   * Social reframe: Add social/collaborative element
   */
  private static socialFrame(task: string): TaskReframe {
    return {
      original: task,
      reframed: `Make your team proud: ${task}`,
      approach: 'social',
      appeal: 'Connect to team/community',
    }
  }

  /**
   * Constraint reframe: Add creative constraints
   */
  private static constraintFrame(task: string): TaskReframe {
    const constraints = [
      `Do ${task} with NO googling - only what you know`,
      `${task} but you can only use 10 lines of code`,
      `${task} in exactly 15 minutes, no more`,
      `${task} as if explaining it to a 5-year-old`,
      `${task} using only keyboard shortcuts, no mouse`,
    ]

    const randomConstraint = constraints[Math.floor(Math.random() * constraints.length)]

    return {
      original: task,
      reframed: randomConstraint,
      approach: 'constraint',
      appeal: 'Constraints spark creativity',
    }
  }

  /**
   * Sort reframes by profile preferences
   */
  private static sortByProfile(reframes: TaskReframe[], profile: UserProfile): TaskReframe[] {
    // Customize based on user patterns and preferences

    const preferenceWeights: Record<TaskReframe['approach'], number> = {
      gamification: 1.0,
      curiosity: 1.0,
      mastery: 1.0,
      impact: 1.0,
      social: 1.0,
      constraint: 1.0,
    }

    // Adjust weights based on profile
    if (profile.procrastination_patterns.planning_instead_of_doing) {
      // People who over-plan might respond to action-oriented reframes
      preferenceWeights.constraint += 0.3 // Forces quick action
      preferenceWeights.gamification += 0.2 // Time pressure
    }

    if (profile.procrastination_patterns.research_rabbit_holes) {
      // Curious people might like curiosity frames
      preferenceWeights.curiosity += 0.3
      preferenceWeights.mastery += 0.2
    }

    if (profile.procrastination_patterns.tool_setup_dopamine) {
      // People who like setup might respond to mastery
      preferenceWeights.mastery += 0.3
      preferenceWeights.curiosity += 0.2
    }

    if (profile.communication.formality === 'friend') {
      // Casual users might prefer gamification
      preferenceWeights.gamification += 0.2
      preferenceWeights.social += 0.2
    }

    if (profile.communication.formality === 'coach') {
      // Goal-oriented users prefer impact/mastery
      preferenceWeights.impact += 0.3
      preferenceWeights.mastery += 0.2
    }

    // Sort by weighted preference
    return reframes.sort((a, b) => {
      return preferenceWeights[b.approach] - preferenceWeights[a.approach]
    })
  }

  /**
   * Get single best reframe for a task
   */
  static getBestReframe(boringTask: string, profile: UserProfile): TaskReframe {
    const reframes = this.reframeTask(boringTask, profile)
    return reframes[0]
  }

  /**
   * Format reframe for display
   */
  static formatReframe(reframe: TaskReframe, profile: UserProfile): string {
    const icon = this.getIcon(reframe.approach)
    const lines: string[] = []

    lines.push(`${icon} **${reframe.reframed}**`)
    lines.push('')
    lines.push(`💡 ${reframe.appeal}`)

    // Add actionable next step based on communication style
    if (profile.communication.tone === 'direct') {
      lines.push('')
      lines.push('Start now.')
    } else if (profile.communication.tone === 'teaching') {
      lines.push('')
      lines.push('Try this perspective and see if it helps.')
    } else if (profile.communication.tone === 'curious') {
      lines.push('')
      lines.push('How does this reframe feel to you?')
    }

    return lines.join('\n')
  }

  /**
   * Get icon for reframe approach
   */
  private static getIcon(approach: TaskReframe['approach']): string {
    const icons = {
      gamification: '🎮',
      curiosity: '🔍',
      mastery: '⚡',
      impact: '🎯',
      social: '👥',
      constraint: '⏱️',
    }

    return icons[approach]
  }
}
