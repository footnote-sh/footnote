/**
 * Anthropic Claude analyzer implementation
 */

import Anthropic from '@anthropic-ai/sdk'
import { BaseAnalyzer } from './BaseAnalyzer.js'
import { buildSystemPrompt, buildAnalysisPrompt } from '../analysis/prompt-templates.js'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'

export class AnthropicAnalyzer extends BaseAnalyzer {
  private client: Anthropic | null = null
  private readonly apiKey: string | undefined

  constructor(apiKey?: string, model: string = 'claude-3-5-sonnet-20241022') {
    super(model)
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY
  }

  getProvider(): string {
    return 'Anthropic'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('Anthropic API key not configured')
      }
      this.client = new Anthropic({ apiKey: this.apiKey })
    }
    return this.client
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    return this.withRetry(async () => {
      const client = this.getClient()

      const systemPrompt = buildSystemPrompt()
      const userPrompt = buildAnalysisPrompt(context)

      const response = await client.messages.create({
        model: this.modelName,
        max_tokens: 1024,
        temperature: 0.3, // Lower temperature for more consistent analysis
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      })

      // Extract text from response
      const textContent = response.content.find((block) => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response')
      }

      return this.parseResponse(textContent.text)
    })
  }
}
