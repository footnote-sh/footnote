/**
 * Fixture: Sample WalkthroughResponse objects for testing ProfileBuilder
 */

import type { WalkthroughResponse } from '../../src/profile/ProfileBuilder.js'

/**
 * Complete valid walkthrough response - developer profile
 */
export const completeDevResponse: WalkthroughResponse = {
  name: 'Alex Chen',
  role: 'software engineer',

  // Section 1: Work style
  workHours: '9am-6pm',
  deepWorkWindows: ['9am-11am', '2pm-4pm'],
  weeklyRhythm: {
    monday: 'planning and architecture',
    tuesday: 'deep coding',
    wednesday: 'meetings and reviews',
    thursday: 'deep coding',
    friday: 'cleanup and documentation',
  },

  // Section 2: Procrastination patterns
  patterns: {
    planningInsteadOfDoing: true,
    researchRabbitHoles: true,
    toolSetupDopamine: false,
    meetingAvoidance: false,
  },

  // Section 3: Intervention style
  primaryIntervention: 'hard_block',
  fallbackIntervention: 'accountability',

  // Section 4: Communication
  tone: 'direct',
  formality: 'coach',

  // Section 5: Learning
  visibility: 'weekly_summaries',
  adaptationEnabled: true,
}

/**
 * Complete valid walkthrough response - designer profile
 */
export const completeDesignerResponse: WalkthroughResponse = {
  name: 'Sam Rivera',
  role: 'designer',

  workHours: '10am-7pm',
  deepWorkWindows: ['10am-12pm', '3pm-5pm'],

  patterns: {
    planningInsteadOfDoing: false,
    researchRabbitHoles: true,
    toolSetupDopamine: true,
    meetingAvoidance: true,
  },

  primaryIntervention: 'accountability',
  fallbackIntervention: 'micro_task',

  tone: 'gentle',
  formality: 'therapist',

  visibility: 'hidden',
  adaptationEnabled: false,
}

/**
 * Complete valid walkthrough response - product manager
 */
export const completeProductResponse: WalkthroughResponse = {
  name: 'Jordan Lee',
  role: 'product manager',

  workHours: '8am-5pm',
  deepWorkWindows: ['8am-10am', '1pm-3pm'],
  weeklyRhythm: {
    monday: 'strategy and planning',
    tuesday: 'execution',
    wednesday: 'stakeholder meetings',
    thursday: 'execution',
    friday: 'retrospectives',
  },

  patterns: {
    planningInsteadOfDoing: true,
    researchRabbitHoles: false,
    toolSetupDopamine: true,
    meetingAvoidance: false,
  },

  primaryIntervention: 'micro_task',
  fallbackIntervention: 'time_boxed',

  tone: 'teaching',
  formality: 'friend',

  visibility: 'in_the_moment',
  adaptationEnabled: true,
}

/**
 * Complete valid walkthrough response - researcher
 */
export const completeResearcherResponse: WalkthroughResponse = {
  name: 'Taylor Quinn',
  role: 'researcher',

  workHours: '11am-8pm',
  deepWorkWindows: ['2pm-6pm'],

  patterns: {
    planningInsteadOfDoing: false,
    researchRabbitHoles: true,
    toolSetupDopamine: false,
    meetingAvoidance: true,
  },

  primaryIntervention: 'time_boxed',
  fallbackIntervention: 'accountability',

  tone: 'curious',
  formality: 'coach',

  visibility: 'weekly_summaries',
  adaptationEnabled: true,
}

/**
 * Minimal valid response (required fields only)
 */
export const minimalValidResponse: WalkthroughResponse = {
  name: 'Min User',
  role: 'developer',

  workHours: '9am-5pm',
  deepWorkWindows: ['9am-11am'],

  patterns: {
    planningInsteadOfDoing: false,
    researchRabbitHoles: false,
    toolSetupDopamine: false,
    meetingAvoidance: false,
  },

  primaryIntervention: 'accountability',
  fallbackIntervention: 'micro_task',

  tone: 'direct',
  formality: 'friend',

  visibility: 'hidden',
  adaptationEnabled: false,
}

/**
 * Incomplete response: Missing name
 */
export const missingNameResponse: Partial<WalkthroughResponse> = {
  role: 'developer',
  workHours: '9am-5pm',
  deepWorkWindows: ['9am-11am'],
  patterns: {
    planningInsteadOfDoing: false,
    researchRabbitHoles: false,
    toolSetupDopamine: false,
    meetingAvoidance: false,
  },
  primaryIntervention: 'accountability',
  fallbackIntervention: 'micro_task',
  tone: 'direct',
  formality: 'friend',
  visibility: 'hidden',
  adaptationEnabled: false,
}

/**
 * Incomplete response: Missing patterns
 */
export const missingPatternsResponse: Partial<WalkthroughResponse> = {
  name: 'Test User',
  role: 'developer',
  workHours: '9am-5pm',
  deepWorkWindows: ['9am-11am'],
  primaryIntervention: 'accountability',
  fallbackIntervention: 'micro_task',
  tone: 'direct',
  formality: 'friend',
  visibility: 'hidden',
  adaptationEnabled: false,
}

/**
 * Incomplete response: Partial patterns object
 */
export const partialPatternsResponse: Partial<WalkthroughResponse> = {
  name: 'Test User',
  role: 'developer',
  workHours: '9am-5pm',
  deepWorkWindows: ['9am-11am'],
  patterns: {
    planningInsteadOfDoing: true,
    researchRabbitHoles: false,
    // Missing: toolSetupDopamine, meetingAvoidance
  } as any,
  primaryIntervention: 'accountability',
  fallbackIntervention: 'micro_task',
  tone: 'direct',
  formality: 'friend',
  visibility: 'hidden',
  adaptationEnabled: false,
}

/**
 * Incomplete response: Missing multiple fields
 */
export const multipleFieldsMissingResponse: Partial<WalkthroughResponse> = {
  name: 'Test User',
  workHours: '9am-5pm',
  // Missing: role, deepWorkWindows, patterns, interventions, communication, learning
}

/**
 * Empty response
 */
export const emptyResponse: Partial<WalkthroughResponse> = {}

/**
 * Partial update: Only update communication preferences
 */
export const communicationUpdateOnly: Partial<WalkthroughResponse> = {
  tone: 'gentle',
  formality: 'therapist',
}

/**
 * Partial update: Only update intervention strategies
 */
export const interventionUpdateOnly: Partial<WalkthroughResponse> = {
  primaryIntervention: 'time_boxed',
  fallbackIntervention: 'micro_task',
}

/**
 * Partial update: Only update patterns
 */
export const patternsUpdateOnly: Partial<WalkthroughResponse> = {
  patterns: {
    planningInsteadOfDoing: false,
    researchRabbitHoles: true,
    toolSetupDopamine: false,
    meetingAvoidance: true,
  },
}

/**
 * Partial update: Only update schedule
 */
export const scheduleUpdateOnly: Partial<WalkthroughResponse> = {
  workHours: '10am-7pm',
  deepWorkWindows: ['10am-12pm', '3pm-6pm'],
  weeklyRhythm: {
    monday: 'coding',
    friday: 'planning',
  },
}

/**
 * Edge case: Very long name
 */
export const longNameResponse: WalkthroughResponse = {
  ...minimalValidResponse,
  name: 'Alexander Maximilian Christopher Wellington-Smythe III, PhD, MBA, Esq.',
}

/**
 * Edge case: Non-standard work hours
 */
export const nightShiftResponse: WalkthroughResponse = {
  ...minimalValidResponse,
  name: 'Night Owl',
  workHours: '8pm-4am',
  deepWorkWindows: ['10pm-2am'],
}

/**
 * Edge case: All procrastination patterns enabled
 */
export const allPatternsResponse: WalkthroughResponse = {
  ...minimalValidResponse,
  name: 'Pattern User',
  patterns: {
    planningInsteadOfDoing: true,
    researchRabbitHoles: true,
    toolSetupDopamine: true,
    meetingAvoidance: true,
  },
}

/**
 * Edge case: No procrastination patterns
 */
export const noPatternsResponse: WalkthroughResponse = {
  ...minimalValidResponse,
  name: 'No Patterns User',
  patterns: {
    planningInsteadOfDoing: false,
    researchRabbitHoles: false,
    toolSetupDopamine: false,
    meetingAvoidance: false,
  },
}

/**
 * Collection of all walkthrough response fixtures
 */
export const walkthroughResponses = {
  completeDev: completeDevResponse,
  completeDesigner: completeDesignerResponse,
  completeProduct: completeProductResponse,
  completeResearcher: completeResearcherResponse,
  minimalValid: minimalValidResponse,
  missingName: missingNameResponse,
  missingPatterns: missingPatternsResponse,
  partialPatterns: partialPatternsResponse,
  multipleFieldsMissing: multipleFieldsMissingResponse,
  empty: emptyResponse,
  communicationUpdate: communicationUpdateOnly,
  interventionUpdate: interventionUpdateOnly,
  patternsUpdate: patternsUpdateOnly,
  scheduleUpdate: scheduleUpdateOnly,
  longName: longNameResponse,
  nightShift: nightShiftResponse,
  allPatterns: allPatternsResponse,
  noPatterns: noPatternsResponse,
}
