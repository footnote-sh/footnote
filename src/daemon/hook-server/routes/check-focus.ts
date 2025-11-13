/**
 * Check focus alignment endpoint
 * Analyzes if an AI coding request aligns with daily commitment
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { StateManager } from '../../../state/StateManager.js'
import type { CommitmentStore } from '../../../state/CommitmentStore.js'
import type {
  HookRequest,
  HookResponse,
  Intervention,
  InterventionOption,
} from '../../../types/hook.js'
import type { AnalysisResult } from '../../../types/analysis.js'
import { BaseAnalyzer } from '../../analyzers/BaseAnalyzer.js'

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
    const commitmentWords = commitmentLower.split(/\s+/).filter((w) => w.length > 3)
    const hasOverlap = commitmentWords.some((word) => requestLower.includes(word))

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
 * Build intervention message from analysis result
 */
function buildIntervention(
  analysis: AnalysisResult,
  commitment: string,
  request: string
): Intervention {
  const interventionMessages: Record<string, string> = {
    shiny_object: 'This looks like a shiny new object. Is this really what you committed to today?',
    context_switch: "You're switching context from your main commitment. Is this intentional?",
    productive_procrastination:
      'This might be productive procrastination. Are you avoiding the main task?',
    enhancement: "This is an enhancement to your main task. Consider if it's necessary right now.",
  }

  const options: InterventionOption[] = [
    {
      id: 'refocus',
      label: 'Refocus',
      description: 'Get back to your commitment',
      action: 'refocus',
    },
    {
      id: 'capture',
      label: 'Capture & Continue',
      description: 'Save this thought and stay focused',
      action: 'capture',
    },
    {
      id: 'find_fun',
      label: 'Find the Fun',
      description: 'Make your commitment more engaging',
      action: 'find_fun',
    },
    {
      id: 'override',
      label: 'Override',
      description: "I know what I'm doing",
      action: 'override',
    },
  ]

  return {
    title: interventionMessages[analysis.type] || 'Focus check',
    commitment,
    request,
    reasoning: analysis.reasoning,
    options,
  }
}

/**
 * Convert analysis result to hook response
 */
function buildHookResponse(
  analysis: AnalysisResult,
  commitment: string,
  request: string
): HookResponse {
  // If aligned, allow without intervention
  if (analysis.aligned) {
    return {
      action: 'allow',
      severity: 'LOW',
      type: 'aligned',
      message: 'This aligns with your commitment. Go ahead!',
    }
  }

  // Determine action based on severity
  let action: 'allow' | 'warn' | 'block' = 'warn'
  if (analysis.severity === 'HIGH') {
    action = 'block'
  } else if (analysis.severity === 'LOW') {
    action = 'allow'
  }

  // Build intervention
  const intervention = buildIntervention(analysis, commitment, request)

  return {
    action,
    severity: analysis.severity,
    type: analysis.type,
    message: intervention.title,
    intervention,
  }
}

/**
 * Check focus route handler factory
 */
export function checkFocusRoute(stateManager: StateManager, commitmentStore: CommitmentStore) {
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
      'Checking focus alignment'
    )

    try {
      // Create analyzer (in production, use real analyzer)
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

      // Build response
      const response = buildHookResponse(analysisResult, commitment.mainThought, userRequest)

      // Log result
      request.log.info(
        {
          aligned: analysisResult.aligned,
          type: analysisResult.type,
          severity: analysisResult.severity,
          action: response.action,
        },
        'Focus check completed'
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
        'Analysis failed'
      )

      return {
        action: 'allow',
        severity: 'LOW',
        message: 'Analysis failed, allowing request',
      }
    }
  }
}
