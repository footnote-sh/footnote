/**
 * Unit tests for ProfileBuilder
 * Priority 1: Tests pure transformation logic without external dependencies
 */

import { describe, it, expect } from 'vitest'
import { ProfileBuilder } from '../../../src/profile/ProfileBuilder.js'
import { walkthroughResponses } from '../../fixtures/walkthrough-responses.js'
import { userProfiles } from '../../fixtures/user-profiles.js'

describe('ProfileBuilder', () => {
  describe('fromWalkthrough', () => {
    it('should create complete UserProfile from valid developer response', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.name).toBe('Alex Chen')
      expect(profile.role).toBe('software engineer')
      expect(profile.schedule.work_hours).toBe('9am-6pm')
      expect(profile.schedule.deep_work_windows).toEqual(['9am-11am', '2pm-4pm'])
      expect(profile.schedule.weekly_rhythm).toEqual({
        monday: 'planning and architecture',
        tuesday: 'deep coding',
        wednesday: 'meetings and reviews',
        thursday: 'deep coding',
        friday: 'cleanup and documentation',
      })
    })

    it('should correctly map procrastination patterns', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.procrastination_patterns.planning_instead_of_doing).toBe(true)
      expect(profile.procrastination_patterns.research_rabbit_holes).toBe(true)
      expect(profile.procrastination_patterns.tool_setup_dopamine).toBe(false)
      expect(profile.procrastination_patterns.meeting_avoidance).toBe(false)
    })

    it('should correctly map intervention style', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.intervention_style.primary).toBe('hard_block')
      expect(profile.intervention_style.fallback).toBe('accountability')
    })

    it('should correctly map communication preferences', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.communication.tone).toBe('direct')
      expect(profile.communication.formality).toBe('coach')
    })

    it('should correctly map learning preferences', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.learning.visibility).toBe('weekly_summaries')
      expect(profile.learning.adaptation_enabled).toBe(true)
    })

    it('should initialize empty intervention history', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.behavior_tracking.intervention_history).toEqual([])
    })

    it('should initialize effectiveness scores to 0', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.behavior_tracking.effectiveness_scores.hard_block).toBe(0)
      expect(profile.behavior_tracking.effectiveness_scores.accountability).toBe(0)
      expect(profile.behavior_tracking.effectiveness_scores.micro_task).toBe(0)
      expect(profile.behavior_tracking.effectiveness_scores.time_boxed).toBe(0)
    })

    it('should set current strategy to primary intervention', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.behavior_tracking.current_strategy).toBe('hard_block')
    })

    it('should set last_adapted timestamp', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      expect(profile.behavior_tracking.last_adapted).toBeDefined()
      expect(typeof profile.behavior_tracking.last_adapted).toBe('string')
      // Should be valid ISO timestamp
      expect(() => new Date(profile.behavior_tracking.last_adapted)).not.toThrow()
    })

    it('should handle minimal valid response', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.minimalValid)

      expect(profile.name).toBe('Min User')
      expect(profile.schedule.weekly_rhythm).toBeUndefined()
      expect(profile.intervention_style.primary).toBe('accountability')
      expect(profile.learning.adaptation_enabled).toBe(false)
    })

    it('should handle designer profile with different preferences', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDesigner)

      expect(profile.name).toBe('Sam Rivera')
      expect(profile.role).toBe('designer')
      expect(profile.communication.tone).toBe('gentle')
      expect(profile.communication.formality).toBe('therapist')
      expect(profile.intervention_style.primary).toBe('accountability')
      expect(profile.learning.visibility).toBe('hidden')
    })

    it('should handle all procrastination patterns enabled', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.allPatterns)

      expect(profile.procrastination_patterns.planning_instead_of_doing).toBe(true)
      expect(profile.procrastination_patterns.research_rabbit_holes).toBe(true)
      expect(profile.procrastination_patterns.tool_setup_dopamine).toBe(true)
      expect(profile.procrastination_patterns.meeting_avoidance).toBe(true)
    })

    it('should handle no procrastination patterns', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.noPatterns)

      expect(profile.procrastination_patterns.planning_instead_of_doing).toBe(false)
      expect(profile.procrastination_patterns.research_rabbit_holes).toBe(false)
      expect(profile.procrastination_patterns.tool_setup_dopamine).toBe(false)
      expect(profile.procrastination_patterns.meeting_avoidance).toBe(false)
    })

    it('should handle night shift work hours', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.nightShift)

      expect(profile.schedule.work_hours).toBe('8pm-4am')
      expect(profile.schedule.deep_work_windows).toEqual(['10pm-2am'])
    })

    it('should handle very long names', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.longName)

      expect(profile.name).toBe(
        'Alexander Maximilian Christopher Wellington-Smythe III, PhD, MBA, Esq.'
      )
    })
  })

  describe('validate', () => {
    it('should return valid for complete response', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.completeDev)

      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])
    })

    it('should return valid for minimal valid response', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.minimalValid)

      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])
    })

    it('should detect missing name', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.missingName)

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('name')
    })

    it('should detect missing patterns object', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.missingPatterns)

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('patterns')
    })

    it('should detect missing pattern fields', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.partialPatterns)

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('patterns.toolSetupDopamine')
      expect(result.missing).toContain('patterns.meetingAvoidance')
    })

    it('should detect multiple missing fields', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.multipleFieldsMissing)

      expect(result.valid).toBe(false)
      expect(result.missing.length).toBeGreaterThan(1)
      expect(result.missing).toContain('role')
      expect(result.missing).toContain('deepWorkWindows')
    })

    it('should detect all missing fields in empty response', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.empty)

      expect(result.valid).toBe(false)
      expect(result.missing.length).toBeGreaterThanOrEqual(10)
      expect(result.missing).toContain('name')
      expect(result.missing).toContain('role')
      expect(result.missing).toContain('patterns')
    })

    it('should validate all required fields are checked', () => {
      const result = ProfileBuilder.validate(walkthroughResponses.empty)

      const expectedFields = [
        'name',
        'role',
        'workHours',
        'deepWorkWindows',
        'patterns',
        'primaryIntervention',
        'fallbackIntervention',
        'tone',
        'formality',
        'visibility',
        'adaptationEnabled',
      ]

      for (const field of expectedFields) {
        expect(result.missing).toContain(field)
      }
    })
  })

  describe('merge', () => {
    it('should preserve existing profile when no updates provided', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, {})

      expect(merged).toEqual(existing)
    })

    it('should update name only', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, { name: 'New Name' })

      expect(merged.name).toBe('New Name')
      expect(merged.role).toBe(existing.role)
      expect(merged.communication).toEqual(existing.communication)
    })

    it('should update role only', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, { role: 'designer' })

      expect(merged.role).toBe('designer')
      expect(merged.name).toBe(existing.name)
    })

    it('should update communication preferences', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, walkthroughResponses.communicationUpdate)

      expect(merged.communication.tone).toBe('gentle')
      expect(merged.communication.formality).toBe('therapist')
      expect(merged.name).toBe(existing.name)
    })

    it('should update intervention strategies', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, walkthroughResponses.interventionUpdate)

      expect(merged.intervention_style.primary).toBe('time_boxed')
      expect(merged.intervention_style.fallback).toBe('micro_task')
      expect(merged.communication).toEqual(existing.communication)
    })

    it('should update procrastination patterns', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, walkthroughResponses.patternsUpdate)

      expect(merged.procrastination_patterns.planning_instead_of_doing).toBe(false)
      expect(merged.procrastination_patterns.research_rabbit_holes).toBe(true)
      expect(merged.procrastination_patterns.tool_setup_dopamine).toBe(false)
      expect(merged.procrastination_patterns.meeting_avoidance).toBe(true)
    })

    it('should update schedule fields', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, walkthroughResponses.scheduleUpdate)

      expect(merged.schedule.work_hours).toBe('10am-7pm')
      expect(merged.schedule.deep_work_windows).toEqual(['10am-12pm', '3pm-6pm'])
      expect(merged.schedule.weekly_rhythm).toEqual({
        monday: 'coding',
        friday: 'planning',
      })
    })

    it('should update partial schedule fields', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, { workHours: '8am-4pm' })

      expect(merged.schedule.work_hours).toBe('8am-4pm')
      expect(merged.schedule.deep_work_windows).toEqual(existing.schedule.deep_work_windows)
    })

    it('should update learning preferences', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, {
        visibility: 'hidden',
        adaptationEnabled: false,
      })

      expect(merged.learning.visibility).toBe('hidden')
      expect(merged.learning.adaptation_enabled).toBe(false)
    })

    it('should not modify original profile object', () => {
      const existing = userProfiles.directCoach
      const originalName = existing.name

      ProfileBuilder.merge(existing, { name: 'Different Name' })

      expect(existing.name).toBe(originalName)
    })

    it('should handle multiple simultaneous updates', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, {
        name: 'Updated Name',
        tone: 'gentle',
        primaryIntervention: 'micro_task',
        adaptationEnabled: false,
      })

      expect(merged.name).toBe('Updated Name')
      expect(merged.communication.tone).toBe('gentle')
      expect(merged.intervention_style.primary).toBe('micro_task')
      expect(merged.learning.adaptation_enabled).toBe(false)
      // Unchanged fields should be preserved
      expect(merged.role).toBe(existing.role)
      expect(merged.schedule).toEqual(existing.schedule)
    })

    it('should preserve behavior tracking data', () => {
      const existing = userProfiles.withHistory
      const merged = ProfileBuilder.merge(existing, { name: 'Updated' })

      expect(merged.behavior_tracking.intervention_history).toEqual(
        existing.behavior_tracking.intervention_history
      )
      expect(merged.behavior_tracking.effectiveness_scores).toEqual(
        existing.behavior_tracking.effectiveness_scores
      )
    })

    it('should handle partial pattern updates', () => {
      const existing = userProfiles.directCoach
      const merged = ProfileBuilder.merge(existing, {
        patterns: {
          planningInsteadOfDoing: false,
          researchRabbitHoles: true,
          toolSetupDopamine: false,
          meetingAvoidance: true,
        },
      })

      expect(merged.procrastination_patterns.planning_instead_of_doing).toBe(false)
      expect(merged.procrastination_patterns.research_rabbit_holes).toBe(true)
      expect(merged.procrastination_patterns.tool_setup_dopamine).toBe(false)
      expect(merged.procrastination_patterns.meeting_avoidance).toBe(true)
    })
  })

  describe('type safety', () => {
    it('should create profile with all required types', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.completeDev)

      // These assertions verify TypeScript types are correct
      expect(typeof profile.name).toBe('string')
      expect(typeof profile.role).toBe('string')
      expect(typeof profile.schedule.work_hours).toBe('string')
      expect(Array.isArray(profile.schedule.deep_work_windows)).toBe(true)
      expect(typeof profile.communication.tone).toBe('string')
      expect(typeof profile.communication.formality).toBe('string')
      expect(typeof profile.learning.adaptation_enabled).toBe('boolean')
      expect(Array.isArray(profile.behavior_tracking.intervention_history)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined weekly_rhythm gracefully', () => {
      const profile = ProfileBuilder.fromWalkthrough(walkthroughResponses.minimalValid)

      expect(profile.schedule.weekly_rhythm).toBeUndefined()
    })

    it('should handle all tone/formality combinations', () => {
      const tones = ['direct', 'gentle', 'teaching', 'curious'] as const
      const formalities = ['coach', 'friend', 'therapist'] as const

      for (const tone of tones) {
        for (const formality of formalities) {
          const response = { ...walkthroughResponses.minimalValid, tone, formality }
          const profile = ProfileBuilder.fromWalkthrough(response)

          expect(profile.communication.tone).toBe(tone)
          expect(profile.communication.formality).toBe(formality)
        }
      }
    })

    it('should handle all intervention strategy combinations', () => {
      const strategies = ['hard_block', 'accountability', 'micro_task', 'time_boxed'] as const

      for (const primary of strategies) {
        for (const fallback of strategies) {
          const response = {
            ...walkthroughResponses.minimalValid,
            primaryIntervention: primary,
            fallbackIntervention: fallback,
          }
          const profile = ProfileBuilder.fromWalkthrough(response)

          expect(profile.intervention_style.primary).toBe(primary)
          expect(profile.intervention_style.fallback).toBe(fallback)
          expect(profile.behavior_tracking.current_strategy).toBe(primary)
        }
      }
    })
  })
})
