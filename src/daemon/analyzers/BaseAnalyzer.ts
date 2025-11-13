/**
 * Abstract base class for AI semantic analyzers
 */

import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'

export abstract class BaseAnalyzer {
  protected readonly modelName: string
  protected readonly maxRetries: number = 3
  protected readonly timeout: number = 30000 // 30s

  constructor(modelName: string) {
    this.modelName = modelName
  }

  /**
   * Analyze if a request aligns with the user's commitment
   */
  abstract analyze(context: AnalysisContext): Promise<AnalysisResult>

  /**
   * Check if the analyzer is properly configured
   */
  abstract isConfigured(): boolean

  /**
   * Get the provider name (e.g., "Claude", "OpenAI")
   */
  abstract getProvider(): string

  /**
   * Generate the analysis prompt
   */
  protected buildPrompt(context: AnalysisContext): string {
    const { commitment, request, context: ctx } = context

    let prompt = `Analyze if this coding request aligns with the user's daily commitment.

Daily commitment: ${commitment}
User request: ${request}`

    if (ctx) {
      prompt += '\nContext:'
      if (ctx.current_file) {
        prompt += `\n- Current file: ${ctx.current_file}`
      }
      if (ctx.git_branch) {
        prompt += `\n- Git branch: ${ctx.git_branch}`
      }
      if (ctx.recent_commits && ctx.recent_commits.length > 0) {
        prompt += `\n- Recent commits: ${ctx.recent_commits.join(', ')}`
      }
    }

    prompt += `

Respond in JSON:
{
  "aligned": true/false,
  "severity": "LOW/MEDIUM/HIGH",
  "type": "aligned/shiny_object/context_switch/enhancement/productive_procrastination",
  "reasoning": "Brief explanation",
  "confidence": 0.0-1.0
}`

    return prompt
  }

  /**
   * Parse and validate the AI response
   */
  protected parseResponse(response: string): AnalysisResult {
    try {
      // Extract JSON from response (in case of markdown code blocks)
      const jsonMatch =
        response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)

      // Validate required fields
      if (
        typeof parsed.aligned !== 'boolean' ||
        !['LOW', 'MEDIUM', 'HIGH'].includes(parsed.severity) ||
        ![
          'aligned',
          'shiny_object',
          'context_switch',
          'enhancement',
          'productive_procrastination',
        ].includes(parsed.type) ||
        typeof parsed.reasoning !== 'string' ||
        typeof parsed.confidence !== 'number'
      ) {
        throw new Error('Invalid response structure')
      }

      // Ensure confidence is in valid range
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence))

      return parsed as AnalysisResult
    } catch (error) {
      // Fallback to safe default on parse failure
      return {
        aligned: false,
        severity: 'HIGH',
        type: 'context_switch',
        reasoning: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0.3,
      }
    }
  }

  /**
   * Handle API errors and retries
   */
  protected async withRetry<T>(operation: () => Promise<T>, attemptNumber: number = 1): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (attemptNumber >= this.maxRetries) {
        throw error
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attemptNumber - 1), 10000)
      await new Promise((resolve) => setTimeout(resolve, delay))

      return this.withRetry(operation, attemptNumber + 1)
    }
  }
}
