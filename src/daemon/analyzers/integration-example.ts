/**
 * Integration example showing how analyzers work with the Footnote daemon
 *
 * This demonstrates the full flow:
 * 1. User sets daily commitment
 * 2. Claude Code makes a request
 * 3. Analyzer checks if request aligns
 * 4. System intervenes if needed
 */

import { AnalyzerFactory } from './AnalyzerFactory.js'
import type { AnalysisContext, AnalysisResult } from '../../types/analysis.js'

// Simulated daemon state
interface DaemonState {
  dailyCommitment: string
  provider?: 'claude' | 'openai' | 'gemini' | 'ollama'
  interventionThreshold: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Check if a coding request aligns with user's commitment
 */
async function checkAlignment(
  request: string,
  context: AnalysisContext['context'],
  state: DaemonState
): Promise<{ shouldIntervene: boolean; result: AnalysisResult }> {
  // Get or create analyzer
  const analyzer = state.provider
    ? AnalyzerFactory.create({ provider: state.provider })
    : AnalyzerFactory.createAuto()

  // Run analysis
  const result = await analyzer.analyze({
    commitment: state.dailyCommitment,
    request,
    context,
  })

  // Determine if we should intervene
  const severityLevels = { LOW: 1, MEDIUM: 2, HIGH: 3 }
  const shouldIntervene =
    !result.aligned &&
    severityLevels[result.severity] >= severityLevels[state.interventionThreshold]

  return { shouldIntervene, result }
}

/**
 * Generate intervention message for user
 */
function generateInterventionMessage(result: AnalysisResult, commitment: string): string {
  const emoji = {
    shiny_object: '✨',
    context_switch: '🔄',
    enhancement: '➕',
    productive_procrastination: '📚',
    aligned: '✅',
  }

  const messages = {
    shiny_object: [
      `${emoji.shiny_object} Whoa there! That's a completely different direction.`,
      `You committed to: "${commitment}"`,
      `This looks like a shiny new object that might derail you.`,
    ],
    context_switch: [
      `${emoji.context_switch} Hold up - context switch detected.`,
      `You committed to: "${commitment}"`,
      `This is related but might take you off track.`,
    ],
    enhancement: [
      `${emoji.enhancement} Nice idea, but let's stay focused.`,
      `You committed to: "${commitment}"`,
      `This enhancement can come after the core work is done.`,
    ],
    productive_procrastination: [
      `${emoji.productive_procrastination} I see what you're doing...`,
      `You committed to: "${commitment}"`,
      `Research is great, but it can be a sneaky form of procrastination.`,
    ],
  }

  const lines =
    result.type !== 'aligned'
      ? messages[result.type]
      : [`${emoji.aligned} Great! This aligns with your commitment.`]

  return [
    ...lines,
    '',
    `Analysis: ${result.reasoning}`,
    `Confidence: ${(result.confidence * 100).toFixed(0)}%`,
  ].join('\n')
}

/**
 * Example integration flow
 */
async function demonstrateFlow() {
  // User's daily commitment (set via `footnote commit`)
  const state: DaemonState = {
    dailyCommitment: 'Build user authentication system with JWT tokens',
    interventionThreshold: 'MEDIUM',
  }

  console.log(`Daily Commitment: "${state.dailyCommitment}"`)
  console.log(`Intervention Threshold: ${state.interventionThreshold}`)
  console.log(`Available Providers: ${AnalyzerFactory.getAvailableProviders().join(', ')}`)
  console.log()

  // Simulate different types of requests
  const requests = [
    {
      description: 'Aligned request',
      request: 'Implement JWT token generation with RS256 signing',
      context: { current_file: 'src/auth/jwt.ts', git_branch: 'feature/auth' },
    },
    {
      description: 'Shiny object',
      request: "Let's switch to using blockchain for authentication instead",
      context: { current_file: 'src/auth/jwt.ts', git_branch: 'feature/auth' },
    },
    {
      description: 'Productive procrastination',
      request: 'First, let me research all the different JWT libraries and compare them',
      context: { current_file: 'src/auth/jwt.ts', git_branch: 'feature/auth' },
    },
    {
      description: 'Enhancement',
      request: 'Add rate limiting to prevent brute force attacks',
      context: { current_file: 'src/auth/login.ts', git_branch: 'feature/auth' },
    },
  ]

  for (const { description, request, context } of requests) {
    console.log('─'.repeat(80))
    console.log(`\n${description.toUpperCase()}: "${request}"\n`)

    try {
      const { shouldIntervene, result } = await checkAlignment(request, context, state)

      if (shouldIntervene) {
        console.log('🛑 INTERVENTION TRIGGERED\n')
        console.log(generateInterventionMessage(result, state.dailyCommitment))
        console.log('\nWould you like to:')
        console.log('  1. Continue anyway')
        console.log('  2. Get back on track')
        console.log('  3. Update commitment')
      } else {
        console.log('✅ Request allowed - aligns with commitment')
        console.log(`Reasoning: ${result.reasoning}`)
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error)
    }

    console.log()
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateFlow().catch(console.error)
}

export { checkAlignment, generateInterventionMessage }
