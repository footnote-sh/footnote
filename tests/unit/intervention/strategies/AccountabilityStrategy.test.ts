/**
 * Unit tests for AccountabilityStrategy
 * Priority 2: Tests strategy logic and message personalization
 */

import { describe, it, expect } from 'vitest'
import { AccountabilityStrategy } from '../../../../src/intervention/strategies/AccountabilityStrategy.js'
import { interventionContexts } from '../../../fixtures/intervention-contexts.js'

describe('AccountabilityStrategy', () => {
  const strategy = new AccountabilityStrategy()

  describe('canHandle', () => {
    it('should handle shiny_object trigger', () => {
      expect(strategy.canHandle(interventionContexts.shinyObject)).toBe(true)
    })

    it('should handle planning_procrastination trigger', () => {
      expect(strategy.canHandle(interventionContexts.planningProcrastination)).toBe(true)
    })

    it('should handle research_rabbit_hole trigger', () => {
      expect(strategy.canHandle(interventionContexts.researchRabbitHole)).toBe(true)
    })

    it('should handle context_switch trigger', () => {
      expect(strategy.canHandle(interventionContexts.contextSwitch)).toBe(true)
    })

    it('should handle all contexts (universal strategy)', () => {
      // AccountabilityStrategy works for all contexts
      Object.values(interventionContexts).forEach((context) => {
        expect(strategy.canHandle(context)).toBe(true)
      })
    })
  })

  describe('execute', () => {
    it('should return accountability intervention result', () => {
      const result = strategy.execute(interventionContexts.shinyObject)

      expect(result.type).toBe('accountability')
      expect(result.action).toBe('prompt')
    })

    it('should include message', () => {
      const result = strategy.execute(interventionContexts.shinyObject)

      expect(result.message).toBeDefined()
      expect(result.message.length).toBeGreaterThan(0)
    })

    it('should include accountability metadata', () => {
      const result = strategy.execute(interventionContexts.shinyObject)

      expect(result.metadata?.accountability).toBeDefined()
      expect(result.metadata?.accountability.length).toBeGreaterThan(0)
    })

    it('should include commitment and current activity in message', () => {
      const result = strategy.execute(interventionContexts.shinyObject)

      expect(result.message).toContain('Implement user authentication')
      expect(result.message).toContain('Browsing Hacker News')
    })
  })

  describe('message personalization: tone variations', () => {
    it('should use direct tone with coach formality', () => {
      const result = strategy.execute(interventionContexts.directCoach)

      expect(result.message).toContain("You're off track")
      expect(result.message).toContain("What's your call?")
    })

    it('should use direct tone with friend formality', () => {
      const context = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'direct' as const,
          formality: 'friend' as const,
        },
      }

      const result = strategy.execute(context)

      expect(result.message).toContain('Yo')
      expect(result.message).toContain('Intentional?')
    })

    it('should use direct tone with therapist formality', () => {
      const context = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'direct' as const,
          formality: 'therapist' as const,
        },
      }

      const result = strategy.execute(context)

      expect(result.message).toContain('I notice')
      expect(result.message).toContain('How do you feel')
    })

    it('should use gentle tone with coach formality', () => {
      const context = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'gentle' as const,
          formality: 'coach' as const,
        },
      }

      const result = strategy.execute(context)

      expect(result.message).toContain('Hey there')
      expect(result.message).toContain('Remember')
    })

    it('should use gentle tone with friend formality', () => {
      const result = strategy.execute(interventionContexts.contextSwitch)

      expect(result.message).toContain('Just checking in')
      expect(result.message).toContain('Is this related?')
    })

    it('should use gentle tone with therapist formality', () => {
      const result = strategy.execute(interventionContexts.gentleTherapist)

      expect(result.message).toContain('I see')
      expect(result.message).toContain('How does this connect')
    })

    it('should use teaching tone with coach formality', () => {
      const context = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'teaching' as const,
          formality: 'coach' as const,
        },
      }

      const result = strategy.execute(context)

      expect(result.message).toContain('Context:')
      expect(result.message).toContain('Does this serve your goal?')
    })

    it('should use teaching tone with friend formality', () => {
      const result = strategy.execute(interventionContexts.teachingFriend)

      expect(result.message).toContain('Quick check')
      expect(result.message).toContain('detour')
    })

    it('should use teaching tone with therapist formality', () => {
      const context = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'teaching' as const,
          formality: 'therapist' as const,
        },
      }

      const result = strategy.execute(context)

      expect(result.message).toContain("Let's reflect")
      expect(result.message).toContain('How does')
      expect(result.message).toContain('fit in')
    })

    it('should use curious tone with coach formality', () => {
      const result = strategy.execute(interventionContexts.curiousCoach)

      expect(result.message).toContain('What brought you')
      expect(result.message).toContain('How does this relate')
    })

    it('should use curious tone with friend formality', () => {
      const context = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'curious' as const,
          formality: 'friend' as const,
        },
      }

      const result = strategy.execute(context)

      expect(result.message).toContain('Interesting')
      expect(result.message).toContain('How does that fit')
    })

    it('should use curious tone with therapist formality', () => {
      const context = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'curious' as const,
          formality: 'therapist' as const,
        },
      }

      const result = strategy.execute(context)

      expect(result.message).toContain("I'm curious")
      expect(result.message).toContain('what drew you')
    })
  })

  describe('reflection prompt variations', () => {
    it('should provide coach reflection prompt', () => {
      const result = strategy.execute(interventionContexts.directCoach)

      expect(result.metadata?.accountability).toContain('aligned with your commitment')
      expect(result.metadata?.accountability).toContain('Continue / Refocus')
    })

    it('should provide friend reflection prompt', () => {
      const result = strategy.execute(interventionContexts.contextSwitch)

      expect(result.metadata?.accountability).toContain('What do you want to do')
      expect(result.metadata?.accountability).toContain('Keep going / Get back on track')
    })

    it('should provide therapist reflection prompt', () => {
      const result = strategy.execute(interventionContexts.gentleTherapist)

      expect(result.metadata?.accountability).toContain('What feels right')
      expect(result.metadata?.accountability).toContain('Continue exploring / Return to commitment')
    })
  })

  describe('edge cases', () => {
    it('should handle empty commitment gracefully', () => {
      const result = strategy.execute(interventionContexts.emptyCommitment)

      expect(result.message).toBeDefined()
      expect(result.type).toBe('accountability')
      expect(result.action).toBe('prompt')
    })

    it('should handle very long activity names', () => {
      const result = strategy.execute(interventionContexts.longActivity)

      expect(result.message).toBeDefined()
      expect(result.message).toContain('Fix TypeScript error')
    })

    it('should handle late night context', () => {
      const result = strategy.execute(interventionContexts.lateNight)

      expect(result.message).toBeDefined()
      expect(result.message).toContain('Go to bed')
      // Message contains either commitment or activity based on template
      expect(result.type).toBe('accountability')
      expect(result.action).toBe('prompt')
    })
  })

  describe('comprehensive tone × formality matrix', () => {
    const tones = ['direct', 'gentle', 'teaching', 'curious'] as const
    const formalities = ['coach', 'friend', 'therapist'] as const

    tones.forEach((tone) => {
      formalities.forEach((formality) => {
        it(`should generate unique message for ${tone} + ${formality}`, () => {
          const context = {
            ...interventionContexts.shinyObject,
            userProfile: {
              ...interventionContexts.shinyObject.userProfile,
              tone,
              formality,
            },
          }

          const result = strategy.execute(context)

          expect(result.message).toBeDefined()
          expect(result.message.length).toBeGreaterThan(0)
          expect(result.message).toContain('Implement user authentication')
        })
      })
    })
  })

  describe('consistency', () => {
    it('should return same message for same context', () => {
      const result1 = strategy.execute(interventionContexts.shinyObject)
      const result2 = strategy.execute(interventionContexts.shinyObject)

      expect(result1.message).toBe(result2.message)
      expect(result1.metadata?.accountability).toBe(result2.metadata?.accountability)
    })

    it('should return different messages for different tones', () => {
      const directContext = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'direct' as const,
          formality: 'coach' as const,
        },
      }

      const gentleContext = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'gentle' as const,
          formality: 'coach' as const,
        },
      }

      const directResult = strategy.execute(directContext)
      const gentleResult = strategy.execute(gentleContext)

      expect(directResult.message).not.toBe(gentleResult.message)
    })

    it('should return different messages for different formalities', () => {
      const coachContext = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'direct' as const,
          formality: 'coach' as const,
        },
      }

      const friendContext = {
        ...interventionContexts.shinyObject,
        userProfile: {
          ...interventionContexts.shinyObject.userProfile,
          tone: 'direct' as const,
          formality: 'friend' as const,
        },
      }

      const coachResult = strategy.execute(coachContext)
      const friendResult = strategy.execute(friendContext)

      expect(coachResult.message).not.toBe(friendResult.message)
    })
  })
})
