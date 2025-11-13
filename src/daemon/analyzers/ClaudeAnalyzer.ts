/**
 * Claude (Anthropic) analyzer using @anthropic-ai/sdk
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'
import { BaseAnalyzer } from './BaseAnalyzer.js'

export class ClaudeAnalyzer extends BaseAnalyzer {
  private client: Anthropic | null = null
  private readonly apiKey: string | undefined

  constructor(modelName: string = 'claude-3-5-sonnet-20241022') {
    super(modelName)
    this.apiKey = process.env.ANTHROPIC_API_KEY
  }

  getProvider(): string {
    return 'Claude'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable not set')
      }
      this.client = new Anthropic({ apiKey: this.apiKey })
    }
    return this.client
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    return this.withRetry(async () => {
      const client = this.getClient()
      const prompt = this.buildPrompt(context)

      const response = await client.messages.create({
        model: this.modelName,
        max_tokens: 1024,
        temperature: 0.2, // Lower temperature for more consistent analysis
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      // Extract text content
      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      return this.parseResponse(content.text)
    })
  }
}
