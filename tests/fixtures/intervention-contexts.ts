/**
 * Fixture: Sample InterventionContext objects for testing
 */

import type { InterventionContext } from '../../src/types/intervention.js'

/**
 * Shiny object distraction during deep work
 */
export const shinyObjectContext: InterventionContext = {
  trigger: 'shiny_object',
  currentActivity: 'Browsing Hacker News',
  commitment: 'Implement user authentication',
  timeOfDay: '10:30am',
  userProfile: {
    strategy: 'hard_block',
    tone: 'direct',
    formality: 'coach',
    patterns: {
      planning_instead_of_doing: true,
      research_rabbit_holes: true,
      tool_setup_dopamine: false,
      meeting_avoidance: false,
    },
  },
}

/**
 * Planning procrastination - making lists instead of doing
 */
export const planningProcrastinationContext: InterventionContext = {
  trigger: 'planning_procrastination',
  currentActivity: 'Creating detailed project roadmap in Notion',
  commitment: 'Write first draft of blog post',
  timeOfDay: '2:15pm',
  userProfile: {
    strategy: 'micro_task',
    tone: 'teaching',
    formality: 'friend',
    patterns: {
      planning_instead_of_doing: true,
      research_rabbit_holes: false,
      tool_setup_dopamine: true,
      meeting_avoidance: false,
    },
  },
}

/**
 * Research rabbit hole - endless documentation reading
 */
export const researchRabbitHoleContext: InterventionContext = {
  trigger: 'research_rabbit_hole',
  currentActivity: 'Reading React documentation for the 5th time',
  commitment: 'Build product feature prototype',
  timeOfDay: '11:00am',
  userProfile: {
    strategy: 'time_boxed',
    tone: 'curious',
    formality: 'therapist',
    patterns: {
      planning_instead_of_doing: false,
      research_rabbit_holes: true,
      tool_setup_dopamine: false,
      meeting_avoidance: true,
    },
  },
}

/**
 * Context switch - jumping between tasks
 */
export const contextSwitchContext: InterventionContext = {
  trigger: 'context_switch',
  currentActivity: 'Checking Slack messages',
  commitment: 'Finish quarterly report',
  timeOfDay: '3:45pm',
  userProfile: {
    strategy: 'accountability',
    tone: 'gentle',
    formality: 'friend',
    patterns: {
      planning_instead_of_doing: false,
      research_rabbit_holes: false,
      tool_setup_dopamine: false,
      meeting_avoidance: false,
    },
  },
}

/**
 * Gentle therapist profile context
 */
export const gentleTherapistContext: InterventionContext = {
  trigger: 'shiny_object',
  currentActivity: 'Exploring new design tool',
  commitment: 'Complete client mockups',
  timeOfDay: '1:00pm',
  userProfile: {
    strategy: 'accountability',
    tone: 'gentle',
    formality: 'therapist',
    patterns: {
      planning_instead_of_doing: false,
      research_rabbit_holes: true,
      tool_setup_dopamine: true,
      meeting_avoidance: true,
    },
  },
}

/**
 * Direct coach profile context
 */
export const directCoachContext: InterventionContext = {
  trigger: 'planning_procrastination',
  currentActivity: 'Reorganizing task management system',
  commitment: 'Deploy bug fixes to production',
  timeOfDay: '9:15am',
  userProfile: {
    strategy: 'hard_block',
    tone: 'direct',
    formality: 'coach',
    patterns: {
      planning_instead_of_doing: true,
      research_rabbit_holes: false,
      tool_setup_dopamine: false,
      meeting_avoidance: false,
    },
  },
}

/**
 * Teaching friend profile context
 */
export const teachingFriendContext: InterventionContext = {
  trigger: 'context_switch',
  currentActivity: 'Responding to emails',
  commitment: 'Write product requirements document',
  timeOfDay: '2:30pm',
  userProfile: {
    strategy: 'micro_task',
    tone: 'teaching',
    formality: 'friend',
    patterns: {
      planning_instead_of_doing: true,
      research_rabbit_holes: false,
      tool_setup_dopamine: true,
      meeting_avoidance: false,
    },
  },
}

/**
 * Curious coach profile context
 */
export const curiousCoachContext: InterventionContext = {
  trigger: 'research_rabbit_hole',
  currentActivity: 'Reading academic papers on distributed systems',
  commitment: 'Write research summary for team',
  timeOfDay: '3:00pm',
  userProfile: {
    strategy: 'time_boxed',
    tone: 'curious',
    formality: 'coach',
    patterns: {
      planning_instead_of_doing: false,
      research_rabbit_holes: true,
      tool_setup_dopamine: false,
      meeting_avoidance: true,
    },
  },
}

/**
 * Edge case: Empty commitment (user didn't set one)
 */
export const emptyCommitmentContext: InterventionContext = {
  trigger: 'shiny_object',
  currentActivity: 'Browsing social media',
  commitment: '',
  timeOfDay: '11:30am',
  userProfile: {
    strategy: 'accountability',
    tone: 'direct',
    formality: 'friend',
    patterns: {
      planning_instead_of_doing: false,
      research_rabbit_holes: false,
      tool_setup_dopamine: false,
      meeting_avoidance: false,
    },
  },
}

/**
 * Edge case: Very long activity name
 */
export const longActivityContext: InterventionContext = {
  trigger: 'research_rabbit_hole',
  currentActivity:
    'Reading through the entire TypeScript documentation, exploring advanced type patterns, and investigating compiler optimization techniques for large-scale applications',
  commitment: 'Fix TypeScript error in authentication module',
  timeOfDay: '4:00pm',
  userProfile: {
    strategy: 'time_boxed',
    tone: 'teaching',
    formality: 'coach',
    patterns: {
      planning_instead_of_doing: false,
      research_rabbit_holes: true,
      tool_setup_dopamine: false,
      meeting_avoidance: false,
    },
  },
}

/**
 * Edge case: Late night distraction
 */
export const lateNightContext: InterventionContext = {
  trigger: 'shiny_object',
  currentActivity: 'Exploring new VS Code extensions',
  commitment: 'Go to bed',
  timeOfDay: '11:45pm',
  userProfile: {
    strategy: 'hard_block',
    tone: 'direct',
    formality: 'friend',
    patterns: {
      planning_instead_of_doing: false,
      research_rabbit_holes: false,
      tool_setup_dopamine: true,
      meeting_avoidance: false,
    },
  },
}

/**
 * Collection of all context fixtures
 */
export const interventionContexts = {
  shinyObject: shinyObjectContext,
  planningProcrastination: planningProcrastinationContext,
  researchRabbitHole: researchRabbitHoleContext,
  contextSwitch: contextSwitchContext,
  gentleTherapist: gentleTherapistContext,
  directCoach: directCoachContext,
  teachingFriend: teachingFriendContext,
  curiousCoach: curiousCoachContext,
  emptyCommitment: emptyCommitmentContext,
  longActivity: longActivityContext,
  lateNight: lateNightContext,
}
