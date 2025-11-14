/**
 * Types for intervention system
 */

import type { InterventionStrategy } from './state.js'

export interface InterventionContext {
  trigger: 'shiny_object' | 'planning_procrastination' | 'context_switch' | 'research_rabbit_hole'
  currentActivity: string
  commitment: string
  timeOfDay: string
  userProfile: {
    strategy: InterventionStrategy
    tone: 'direct' | 'gentle' | 'teaching' | 'curious'
    formality: 'coach' | 'friend' | 'therapist'
    patterns: Record<string, boolean>
  }
}

export interface InterventionResult {
  type: InterventionStrategy
  message: string
  action: 'block' | 'prompt' | 'suggest' | 'timebox'
  metadata?: {
    timeLimit?: number
    microTasks?: string[]
    accountability?: string
  }
}

export interface StrategyInterface {
  /**
   * Determine if this strategy can handle the given context
   */
  canHandle(context: InterventionContext): boolean

  /**
   * Execute the intervention strategy
   */
  execute(context: InterventionContext): InterventionResult
}
