/**
 * Check focus alignment endpoint (v2 with intervention engine)
 * Analyzes if an AI coding request aligns with daily commitment
 * Uses personalized intervention engine for responses
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { StateManager } from '../../../state/StateManager.js'
import type { CommitmentStore } from '../../../state/CommitmentStore.js'
import type { HookRequest, HookResponse } from '../../../types/hook.js'
import type { AnalysisResult } from '../../../types/analysis.js'
import { BaseAnalyzer } from '../../analyzers/BaseAnalyzer.js'
import { InterventionMiddleware } from '../middleware/intervention.js'

/**
 * Mock analyzer for development (replace with real analyzer)
 * In production, this should be replaced with Claude/OpenAI analyzer
 */
class MockAnalyzer extends BaseAnalyzer {
  constructor() {
    super('mock-analyzer')
  }

  async analyze(context: any): Promise<AnalysisResult> {
    // Simple keyword-based analysis for testing
    const { commitment, request } = context
    const commitmentLower = commitment.toLowerCase()
    const requestLower = request.toLowerCase()

    // Extract key terms from commitment
    const commitmentWords = commitmentLower.split(/\s+/).filter((w: string) => w.length > 3)
    const hasOverlap = commitmentWords.some((word: string) => requestLower.includes(word))

    if (hasOverlap) {
      return {
        aligned: true,
        severity: 'LOW',
        type: 'aligned',
        reasoning: 'Request appears to align with commitment',
        confidence: 0.8,
      }
    }

    // Check for common distraction patterns
    if (
      requestLower.includes('refactor') ||
      requestLower.includes('optimize') ||
      requestLower.includes('clean up')
    ) {
      return {
        aligned: false,
        severity: 'MEDIUM',
        type: 'productive_procrastination',
        reasoning: 'This looks like productive procrastination - refactoring instead of building',
        confidence: 0.7,
      }
    }

    if (requestLower.includes('research') || requestLower.includes('explore')) {
      return {
        aligned: false,
        severity: 'MEDIUM',
        type: 'productive_procrastination',
        reasoning: 'Research can be a distraction - are you avoiding the main task?',
        confidence: 0.75,
      }
    }

    // Default to context switch
    return {
      aligned: false,
      severity: 'HIGH',
      type: 'shiny_object',
      reasoning: 'This appears to be a completely different task',
      confidence: 0.6,
    }
  }

  isConfigured(): boolean {
    return true
  }

  getProvider(): string {
    return 'Mock'
  }
}

/**
 * Check focus route handler factory (v2 with intervention engine)
 */
export function checkFocusRouteV2(stateManager: StateManager, commitmentStore: CommitmentStore) {
  // Create intervention middleware
  const interventionMiddleware = new InterventionMiddleware(stateManager)

  return async (
    request: FastifyRequest<{ Body: HookRequest }>,
    reply: FastifyReply
  ): Promise<HookResponse> => {
    const { request: userRequest, context, source } = request.body

    // Validate request
    if (!userRequest || typeof userRequest !== 'string') {
      reply.code(400)
      throw new Error('Missing or invalid "request" field')
    }

    // Get today's commitment
    const commitment = commitmentStore.getToday()

    if (!commitment) {
      // No commitment set - warn but allow
      return {
        action: 'warn',
        severity: 'MEDIUM',
        message: "You haven't set a commitment for today. Consider setting one first.",
      }
    }

    // Log the check
    request.log.info(
      {
        source,
        commitment: commitment.mainThought,
        request: userRequest,
        context,
      },
      'Checking focus alignment (v2 with intervention engine)'
    )

    try {
      // Create analyzer (in production, use real analyzer based on config)
      const analyzer = new MockAnalyzer()

      // Analyze the request
      const analysisResult = await analyzer.analyze({
        commitment: commitment.mainThought,
        request: userRequest,
        context: {
          current_file: context.current_file,
          git_branch: context.git_branch,
          recent_commits: context.recent_commits,
        },
      })

      // Apply personalized intervention
      const response = interventionMiddleware.applyIntervention(
        analysisResult,
        commitment.mainThought,
        userRequest
      )

      // Log result
      request.log.info(
        {
          aligned: analysisResult.aligned,
          type: analysisResult.type,
          severity: analysisResult.severity,
          action: response.action,
          intervention_type: response.intervention
            ? interventionMiddleware['profileStore'].get()?.behavior_tracking.current_strategy
            : null,
        },
        'Focus check completed (v2)'
      )

      return response
    } catch (error) {
      // On analysis failure, log and allow (fail open)
      request.log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          commitment: commitment.mainThought,
          request: userRequest,
        },
        'Analysis failed (v2)'
      )

      return {
        action: 'allow',
        severity: 'LOW',
        message: 'Analysis failed, allowing request',
      }
    }
  }
}

/**
 * Export for backward compatibility
 */
export const checkFocusRoute = checkFocusRouteV2
