/**
 * Fixture: Sample UserProfile objects for testing
 */

import type { UserProfile } from '../../src/types/state.js'

/**
 * Direct coach profile - prefers hard accountability
 */
export const directCoachProfile: UserProfile = {
  name: 'Alex',
  role: 'software engineer',

  schedule: {
    work_hours: '9am-5pm',
    deep_work_windows: ['9am-11am', '2pm-4pm'],
    weekly_rhythm: {
      monday: 'coding day',
      wednesday: 'meeting day',
      friday: 'planning day',
    },
  },

  procrastination_patterns: {
    planning_instead_of_doing: true,
    research_rabbit_holes: true,
    tool_setup_dopamine: false,
    meeting_avoidance: false,
  },

  intervention_style: {
    primary: 'hard_block',
    fallback: 'accountability',
  },

  communication: {
    tone: 'direct',
    formality: 'coach',
  },

  learning: {
    visibility: 'weekly_summaries',
    adaptation_enabled: true,
  },

  behavior_tracking: {
    intervention_history: [],
    effectiveness_scores: {
      hard_block: 0,
      accountability: 0,
      micro_task: 0,
      time_boxed: 0,
    },
    current_strategy: 'hard_block',
    last_adapted: '2024-01-01T00:00:00.000Z',
  },
}

/**
 * Gentle therapist profile - prefers soft reminders
 */
export const gentleTherapistProfile: UserProfile = {
  name: 'Sam',
  role: 'designer',

  schedule: {
    work_hours: '10am-6pm',
    deep_work_windows: ['10am-12pm'],
  },

  procrastination_patterns: {
    planning_instead_of_doing: false,
    research_rabbit_holes: true,
    tool_setup_dopamine: true,
    meeting_avoidance: true,
  },

  intervention_style: {
    primary: 'accountability',
    fallback: 'micro_task',
  },

  communication: {
    tone: 'gentle',
    formality: 'therapist',
  },

  learning: {
    visibility: 'hidden',
    adaptation_enabled: false,
  },

  behavior_tracking: {
    intervention_history: [],
    effectiveness_scores: {
      hard_block: 0,
      accountability: 0,
      micro_task: 0,
      time_boxed: 0,
    },
    current_strategy: 'accountability',
    last_adapted: '2024-01-01T00:00:00.000Z',
  },
}

/**
 * Teaching friend profile - balanced approach
 */
export const teachingFriendProfile: UserProfile = {
  name: 'Jordan',
  role: 'product manager',

  schedule: {
    work_hours: '8am-4pm',
    deep_work_windows: ['8am-10am', '1pm-3pm'],
    weekly_rhythm: {
      monday: 'planning',
      tuesday: 'execution',
      wednesday: 'meetings',
      thursday: 'execution',
      friday: 'review',
    },
  },

  procrastination_patterns: {
    planning_instead_of_doing: true,
    research_rabbit_holes: false,
    tool_setup_dopamine: true,
    meeting_avoidance: false,
  },

  intervention_style: {
    primary: 'micro_task',
    fallback: 'time_boxed',
  },

  communication: {
    tone: 'teaching',
    formality: 'friend',
  },

  learning: {
    visibility: 'in_the_moment',
    adaptation_enabled: true,
  },

  behavior_tracking: {
    intervention_history: [],
    effectiveness_scores: {
      hard_block: 0,
      accountability: 0,
      micro_task: 0,
      time_boxed: 0,
    },
    current_strategy: 'micro_task',
    last_adapted: '2024-01-01T00:00:00.000Z',
  },
}

/**
 * Curious coach profile - explores patterns
 */
export const curiousCoachProfile: UserProfile = {
  name: 'Taylor',
  role: 'researcher',

  schedule: {
    work_hours: '11am-7pm',
    deep_work_windows: ['2pm-5pm'],
  },

  procrastination_patterns: {
    planning_instead_of_doing: false,
    research_rabbit_holes: true,
    tool_setup_dopamine: false,
    meeting_avoidance: true,
  },

  intervention_style: {
    primary: 'time_boxed',
    fallback: 'accountability',
  },

  communication: {
    tone: 'curious',
    formality: 'coach',
  },

  learning: {
    visibility: 'weekly_summaries',
    adaptation_enabled: true,
  },

  behavior_tracking: {
    intervention_history: [],
    effectiveness_scores: {
      hard_block: 0,
      accountability: 0,
      micro_task: 0,
      time_boxed: 0,
    },
    current_strategy: 'time_boxed',
    last_adapted: '2024-01-01T00:00:00.000Z',
  },
}

/**
 * Profile with learning system populated (has history)
 */
export const profileWithHistory: UserProfile = {
  ...directCoachProfile,
  name: 'Chris',
  behavior_tracking: {
    intervention_history: [
      {
        timestamp: '2024-01-01T09:00:00.000Z',
        trigger: 'shiny_object',
        style_used: 'hard_block',
        user_response: 'complied',
        time_to_refocus: 10,
      },
      {
        timestamp: '2024-01-01T10:00:00.000Z',
        trigger: 'research_rabbit_hole',
        style_used: 'hard_block',
        user_response: 'complied',
        time_to_refocus: 15,
      },
      {
        timestamp: '2024-01-01T11:00:00.000Z',
        trigger: 'planning_procrastination',
        style_used: 'hard_block',
        user_response: 'overrode',
        time_to_refocus: 120,
      },
      {
        timestamp: '2024-01-01T14:00:00.000Z',
        trigger: 'context_switch',
        style_used: 'accountability',
        user_response: 'complied',
        time_to_refocus: 5,
      },
      {
        timestamp: '2024-01-01T15:00:00.000Z',
        trigger: 'shiny_object',
        style_used: 'accountability',
        user_response: 'complied',
        time_to_refocus: 8,
      },
    ],
    effectiveness_scores: {
      hard_block: 0.6,
      accountability: 0.9,
      micro_task: 0.5,
      time_boxed: 0.4,
    },
    current_strategy: 'accountability',
    last_adapted: '2024-01-01T12:00:00.000Z',
  },
}

/**
 * Minimal valid profile (for testing defaults)
 */
export const minimalProfile: UserProfile = {
  name: 'Min',
  role: 'developer',

  schedule: {
    work_hours: '9am-5pm',
    deep_work_windows: ['9am-11am'],
  },

  procrastination_patterns: {
    planning_instead_of_doing: false,
    research_rabbit_holes: false,
    tool_setup_dopamine: false,
    meeting_avoidance: false,
  },

  intervention_style: {
    primary: 'accountability',
    fallback: 'micro_task',
  },

  communication: {
    tone: 'direct',
    formality: 'friend',
  },

  learning: {
    visibility: 'hidden',
    adaptation_enabled: false,
  },

  behavior_tracking: {
    intervention_history: [],
    effectiveness_scores: {
      hard_block: 0,
      accountability: 0,
      micro_task: 0,
      time_boxed: 0,
    },
    current_strategy: 'accountability',
    last_adapted: new Date().toISOString(),
  },
}

/**
 * Collection of all fixtures for easy import
 */
export const userProfiles = {
  directCoach: directCoachProfile,
  gentleTherapist: gentleTherapistProfile,
  teachingFriend: teachingFriendProfile,
  curiousCoach: curiousCoachProfile,
  withHistory: profileWithHistory,
  minimal: minimalProfile,
}
