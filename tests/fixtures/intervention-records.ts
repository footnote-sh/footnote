/**
 * Fixture: Sample InterventionRecord arrays for testing effectiveness calculations
 */

import type { InterventionRecord } from '../../src/types/state.js'

/**
 * Perfect compliance: User always complies, refocuses quickly
 */
export const perfectComplianceHistory: InterventionRecord[] = [
  {
    timestamp: '2024-01-01T09:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'hard_block',
    user_response: 'complied',
    time_to_refocus: 5,
  },
  {
    timestamp: '2024-01-01T10:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'hard_block',
    user_response: 'complied',
    time_to_refocus: 8,
  },
  {
    timestamp: '2024-01-01T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'hard_block',
    user_response: 'complied',
    time_to_refocus: 10,
  },
  {
    timestamp: '2024-01-01T14:00:00.000Z',
    trigger: 'context_switch',
    style_used: 'hard_block',
    user_response: 'complied',
    time_to_refocus: 3,
  },
  {
    timestamp: '2024-01-01T15:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'hard_block',
    user_response: 'complied',
    time_to_refocus: 7,
  },
]

/**
 * Complete rejection: User always overrides or ignores
 */
export const completeRejectionHistory: InterventionRecord[] = [
  {
    timestamp: '2024-01-01T09:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'accountability',
    user_response: 'overrode',
    time_to_refocus: 180,
  },
  {
    timestamp: '2024-01-01T10:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'accountability',
    user_response: 'ignored',
    time_to_refocus: 240,
  },
  {
    timestamp: '2024-01-01T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'accountability',
    user_response: 'overrode',
    time_to_refocus: 150,
  },
  {
    timestamp: '2024-01-01T14:00:00.000Z',
    trigger: 'context_switch',
    style_used: 'accountability',
    user_response: 'ignored',
    time_to_refocus: 200,
  },
  {
    timestamp: '2024-01-01T15:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'accountability',
    user_response: 'overrode',
    time_to_refocus: 120,
  },
]

/**
 * Mixed results: Some compliance, some rejection
 */
export const mixedResultsHistory: InterventionRecord[] = [
  {
    timestamp: '2024-01-01T09:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'micro_task',
    user_response: 'complied',
    time_to_refocus: 15,
  },
  {
    timestamp: '2024-01-01T10:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'micro_task',
    user_response: 'overrode',
    time_to_refocus: 90,
  },
  {
    timestamp: '2024-01-01T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'micro_task',
    user_response: 'complied',
    time_to_refocus: 20,
  },
  {
    timestamp: '2024-01-01T14:00:00.000Z',
    trigger: 'context_switch',
    style_used: 'micro_task',
    user_response: 'ignored',
    time_to_refocus: 60,
  },
  {
    timestamp: '2024-01-01T15:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'micro_task',
    user_response: 'complied',
    time_to_refocus: 12,
  },
  {
    timestamp: '2024-01-01T16:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'micro_task',
    user_response: 'complied',
    time_to_refocus: 18,
  },
]

/**
 * Improving trend: Performance gets better over time
 */
export const improvingTrendHistory: InterventionRecord[] = [
  // Older half: poor performance
  {
    timestamp: '2024-01-01T09:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'time_boxed',
    user_response: 'overrode',
    time_to_refocus: 120,
  },
  {
    timestamp: '2024-01-01T10:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'time_boxed',
    user_response: 'ignored',
    time_to_refocus: 180,
  },
  {
    timestamp: '2024-01-01T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'time_boxed',
    user_response: 'overrode',
    time_to_refocus: 150,
  },
  {
    timestamp: '2024-01-01T14:00:00.000Z',
    trigger: 'context_switch',
    style_used: 'time_boxed',
    user_response: 'complied',
    time_to_refocus: 60,
  },
  {
    timestamp: '2024-01-01T15:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'time_boxed',
    user_response: 'ignored',
    time_to_refocus: 90,
  },
  // Recent half: good performance
  {
    timestamp: '2024-01-02T09:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'time_boxed',
    user_response: 'complied',
    time_to_refocus: 10,
  },
  {
    timestamp: '2024-01-02T10:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'time_boxed',
    user_response: 'complied',
    time_to_refocus: 15,
  },
  {
    timestamp: '2024-01-02T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'time_boxed',
    user_response: 'complied',
    time_to_refocus: 12,
  },
  {
    timestamp: '2024-01-02T14:00:00.000Z',
    trigger: 'context_switch',
    style_used: 'time_boxed',
    user_response: 'complied',
    time_to_refocus: 8,
  },
  {
    timestamp: '2024-01-02T15:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'time_boxed',
    user_response: 'complied',
    time_to_refocus: 5,
  },
]

/**
 * Declining trend: Performance gets worse over time
 */
export const decliningTrendHistory: InterventionRecord[] = [
  // Older half: good performance
  {
    timestamp: '2024-01-01T09:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'accountability',
    user_response: 'complied',
    time_to_refocus: 10,
  },
  {
    timestamp: '2024-01-01T10:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'accountability',
    user_response: 'complied',
    time_to_refocus: 15,
  },
  {
    timestamp: '2024-01-01T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'accountability',
    user_response: 'complied',
    time_to_refocus: 12,
  },
  {
    timestamp: '2024-01-01T14:00:00.000Z',
    trigger: 'context_switch',
    style_used: 'accountability',
    user_response: 'complied',
    time_to_refocus: 8,
  },
  {
    timestamp: '2024-01-01T15:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'accountability',
    user_response: 'complied',
    time_to_refocus: 5,
  },
  // Recent half: poor performance
  {
    timestamp: '2024-01-02T09:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'accountability',
    user_response: 'overrode',
    time_to_refocus: 120,
  },
  {
    timestamp: '2024-01-02T10:00:00.000Z',
    trigger: 'research_rabbit_hole',
    style_used: 'accountability',
    user_response: 'ignored',
    time_to_refocus: 180,
  },
  {
    timestamp: '2024-01-02T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'accountability',
    user_response: 'overrode',
    time_to_refocus: 150,
  },
  {
    timestamp: '2024-01-02T14:00:00.000Z',
    trigger: 'context_switch',
    style_used: 'accountability',
    user_response: 'ignored',
    time_to_refocus: 90,
  },
  {
    timestamp: '2024-01-02T15:00:00.000Z',
    trigger: 'shiny_object',
    style_used: 'accountability',
    user_response: 'overrode',
    time_to_refocus: 100,
  },
]

/**
 * Empty history: No interventions yet
 */
export const emptyHistory: InterventionRecord[] = []

/**
 * Minimal history: Only 3 records (not enough for trends)
 */
export const minimalHistory: InterventionRecord[] = [
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
    user_response: 'overrode',
    time_to_refocus: 60,
  },
  {
    timestamp: '2024-01-01T11:00:00.000Z',
    trigger: 'planning_procrastination',
    style_used: 'hard_block',
    user_response: 'complied',
    time_to_refocus: 15,
  },
]

/**
 * Multiple strategies: Compare effectiveness across strategies
 */
export const multipleStrategiesHistory = {
  hard_block: [
    {
      timestamp: '2024-01-01T09:00:00.000Z',
      trigger: 'shiny_object',
      style_used: 'hard_block' as const,
      user_response: 'complied' as const,
      time_to_refocus: 5,
    },
    {
      timestamp: '2024-01-01T10:00:00.000Z',
      trigger: 'research_rabbit_hole',
      style_used: 'hard_block' as const,
      user_response: 'complied' as const,
      time_to_refocus: 8,
    },
    {
      timestamp: '2024-01-01T11:00:00.000Z',
      trigger: 'planning_procrastination',
      style_used: 'hard_block' as const,
      user_response: 'overrode' as const,
      time_to_refocus: 120,
    },
  ],
  accountability: [
    {
      timestamp: '2024-01-01T14:00:00.000Z',
      trigger: 'context_switch',
      style_used: 'accountability' as const,
      user_response: 'complied' as const,
      time_to_refocus: 10,
    },
    {
      timestamp: '2024-01-01T15:00:00.000Z',
      trigger: 'shiny_object',
      style_used: 'accountability' as const,
      user_response: 'complied' as const,
      time_to_refocus: 12,
    },
    {
      timestamp: '2024-01-01T16:00:00.000Z',
      trigger: 'research_rabbit_hole',
      style_used: 'accountability' as const,
      user_response: 'complied' as const,
      time_to_refocus: 15,
    },
    {
      timestamp: '2024-01-01T17:00:00.000Z',
      trigger: 'planning_procrastination',
      style_used: 'accountability' as const,
      user_response: 'complied' as const,
      time_to_refocus: 8,
    },
  ],
  micro_task: [
    {
      timestamp: '2024-01-02T09:00:00.000Z',
      trigger: 'shiny_object',
      style_used: 'micro_task' as const,
      user_response: 'overrode' as const,
      time_to_refocus: 90,
    },
    {
      timestamp: '2024-01-02T10:00:00.000Z',
      trigger: 'research_rabbit_hole',
      style_used: 'micro_task' as const,
      user_response: 'ignored' as const,
      time_to_refocus: 120,
    },
  ],
  time_boxed: [
    {
      timestamp: '2024-01-02T14:00:00.000Z',
      trigger: 'context_switch',
      style_used: 'time_boxed' as const,
      user_response: 'complied' as const,
      time_to_refocus: 20,
    },
    {
      timestamp: '2024-01-02T15:00:00.000Z',
      trigger: 'shiny_object',
      style_used: 'time_boxed' as const,
      user_response: 'complied' as const,
      time_to_refocus: 25,
    },
    {
      timestamp: '2024-01-02T16:00:00.000Z',
      trigger: 'research_rabbit_hole',
      style_used: 'time_boxed' as const,
      user_response: 'overrode' as const,
      time_to_refocus: 60,
    },
  ],
}

/**
 * Collection of all intervention record fixtures
 */
export const interventionRecords = {
  perfectCompliance: perfectComplianceHistory,
  completeRejection: completeRejectionHistory,
  mixedResults: mixedResultsHistory,
  improvingTrend: improvingTrendHistory,
  decliningTrend: decliningTrendHistory,
  empty: emptyHistory,
  minimal: minimalHistory,
  multipleStrategies: multipleStrategiesHistory,
}
