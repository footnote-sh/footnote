/**
 * Build user profile from walkthrough responses
 */

import type { UserProfile, InterventionStrategy } from '../types/state.js'

export interface WalkthroughResponse {
  name: string
  role: UserProfile['role']

  // Section 1: Work style
  workHours: string
  deepWorkWindows: string[]
  weeklyRhythm?: Record<string, string>

  // Section 2: Procrastination patterns
  patterns: {
    planningInsteadOfDoing: boolean
    researchRabbitHoles: boolean
    toolSetupDopamine: boolean
    meetingAvoidance: boolean
  }

  // Section 3: Intervention style
  primaryIntervention: InterventionStrategy
  fallbackIntervention: InterventionStrategy

  // Section 4: Communication
  tone: UserProfile['communication']['tone']
  formality: UserProfile['communication']['formality']

  // Section 5: Learning
  visibility: UserProfile['learning']['visibility']
  adaptationEnabled: boolean
}

export class ProfileBuilder {
  /**
   * Build complete UserProfile from walkthrough responses
   */
  static fromWalkthrough(response: WalkthroughResponse): UserProfile {
    return {
      name: response.name,
      role: response.role,

      schedule: {
        work_hours: response.workHours,
        deep_work_windows: response.deepWorkWindows,
        weekly_rhythm: response.weeklyRhythm,
      },

      procrastination_patterns: {
        planning_instead_of_doing: response.patterns.planningInsteadOfDoing,
        research_rabbit_holes: response.patterns.researchRabbitHoles,
        tool_setup_dopamine: response.patterns.toolSetupDopamine,
        meeting_avoidance: response.patterns.meetingAvoidance,
      },

      intervention_style: {
        primary: response.primaryIntervention,
        fallback: response.fallbackIntervention,
      },

      communication: {
        tone: response.tone,
        formality: response.formality,
      },

      learning: {
        visibility: response.visibility,
        adaptation_enabled: response.adaptationEnabled,
      },

      behavior_tracking: {
        intervention_history: [],
        effectiveness_scores: {
          hard_block: 0,
          accountability: 0,
          micro_task: 0,
          time_boxed: 0,
        },
        current_strategy: response.primaryIntervention,
        last_adapted: new Date().toISOString(),
      },
    }
  }

  /**
   * Validate walkthrough response completeness
   */
  static validate(response: Partial<WalkthroughResponse>): {
    valid: boolean
    missing: string[]
  } {
    const required = [
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

    const missing: string[] = []

    for (const field of required) {
      if (!(field in response) || response[field as keyof WalkthroughResponse] === undefined) {
        missing.push(field)
      }
    }

    // Validate patterns object
    if (response.patterns) {
      const patternFields = [
        'planningInsteadOfDoing',
        'researchRabbitHoles',
        'toolSetupDopamine',
        'meetingAvoidance',
      ]

      for (const field of patternFields) {
        if (!(field in response.patterns)) {
          missing.push(`patterns.${field}`)
        }
      }
    } else if (!missing.includes('patterns')) {
      missing.push('patterns')
    }

    return {
      valid: missing.length === 0,
      missing,
    }
  }

  /**
   * Merge partial updates into existing profile
   */
  static merge(existing: UserProfile, updates: Partial<WalkthroughResponse>): UserProfile {
    const merged = { ...existing }

    if (updates.name) merged.name = updates.name
    if (updates.role) merged.role = updates.role

    if (updates.workHours || updates.deepWorkWindows || updates.weeklyRhythm) {
      merged.schedule = {
        work_hours: updates.workHours ?? merged.schedule.work_hours,
        deep_work_windows: updates.deepWorkWindows ?? merged.schedule.deep_work_windows,
        weekly_rhythm: updates.weeklyRhythm ?? merged.schedule.weekly_rhythm,
      }
    }

    if (updates.patterns) {
      merged.procrastination_patterns = {
        planning_instead_of_doing:
          updates.patterns.planningInsteadOfDoing ??
          merged.procrastination_patterns.planning_instead_of_doing,
        research_rabbit_holes:
          updates.patterns.researchRabbitHoles ??
          merged.procrastination_patterns.research_rabbit_holes,
        tool_setup_dopamine:
          updates.patterns.toolSetupDopamine ?? merged.procrastination_patterns.tool_setup_dopamine,
        meeting_avoidance:
          updates.patterns.meetingAvoidance ?? merged.procrastination_patterns.meeting_avoidance,
      }
    }

    if (updates.primaryIntervention || updates.fallbackIntervention) {
      merged.intervention_style = {
        primary: updates.primaryIntervention ?? merged.intervention_style.primary,
        fallback: updates.fallbackIntervention ?? merged.intervention_style.fallback,
      }
    }

    if (updates.tone || updates.formality) {
      merged.communication = {
        tone: updates.tone ?? merged.communication.tone,
        formality: updates.formality ?? merged.communication.formality,
      }
    }

    if (updates.visibility !== undefined || updates.adaptationEnabled !== undefined) {
      merged.learning = {
        visibility: updates.visibility ?? merged.learning.visibility,
        adaptation_enabled: updates.adaptationEnabled ?? merged.learning.adaptation_enabled,
      }
    }

    return merged
  }
}
