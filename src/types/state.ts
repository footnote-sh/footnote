/**
 * State management types for Footnote CLI
 */

export interface DailyCommitment {
  date: string // ISO date string
  mainThought: string
  footnotes: string[]
  createdAt: string // ISO timestamp
  completedAt?: string // ISO timestamp
}

export interface UserProfile {
  // Basic info
  name: string
  role: 'developer' | 'founder' | 'product-manager' | 'other'

  // Work style (Section 1)
  schedule: {
    work_hours: string
    deep_work_windows: string[]
    weekly_rhythm?: Record<string, string>
  }

  // Procrastination patterns (Section 2)
  procrastination_patterns: {
    planning_instead_of_doing: boolean
    research_rabbit_holes: boolean
    tool_setup_dopamine: boolean
    meeting_avoidance: boolean
  }

  // Intervention style (Section 3)
  intervention_style: {
    primary: InterventionStrategy
    fallback: InterventionStrategy
  }

  // Communication preferences (Section 4)
  communication: {
    tone: 'direct' | 'gentle' | 'teaching' | 'curious'
    formality: 'coach' | 'friend' | 'therapist'
  }

  // Learning preferences (Section 5)
  learning: {
    visibility: 'invisible' | 'optional' | 'explicit'
    adaptation_enabled: boolean
  }

  // Adaptive learning data (not user-facing)
  behavior_tracking: BehaviorTracking
}

export type InterventionStrategy = 'hard_block' | 'accountability' | 'micro_task' | 'time_boxed'

export interface BehaviorTracking {
  intervention_history: InterventionRecord[]
  effectiveness_scores: Record<InterventionStrategy, number>
  current_strategy: InterventionStrategy
  last_adapted: string // ISO timestamp
}

export interface InterventionRecord {
  timestamp: string // ISO timestamp
  trigger: 'shiny_object' | 'planning_procrastination' | 'context_switch' | 'research_rabbit_hole'
  style_used: InterventionStrategy
  user_response: 'complied' | 'overrode' | 'ignored'
  time_to_refocus: number // seconds
}

export interface ActivityRecord {
  timestamp: string // ISO timestamp
  app: string
  window_title: string
  url?: string
  duration: number // seconds

  // Analysis
  category: 'coding' | 'planning' | 'research' | 'communication' | 'other'
  alignment: 'on_track' | 'off_track' | 'productive_procrastination'
  commitment: string // Today's main thought
}

export interface StateConfig {
  version: string
  profile?: UserProfile
  commitments: Record<string, DailyCommitment> // date -> commitment
  current_commitment?: DailyCommitment
  onboarding_completed: boolean
  daemon_enabled: boolean
}
