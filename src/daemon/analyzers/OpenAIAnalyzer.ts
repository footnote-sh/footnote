/**
 * OpenAI analyzer using openai package
 */

import OpenAI from 'openai'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'
import { BaseAnalyzer } from './BaseAnalyzer.js'

export class OpenAIAnalyzer extends BaseAnalyzer {
  private client: OpenAI | null = null
  private readonly apiKey: string | undefined

  constructor(modelName: string = 'gpt-4o') {
    super(modelName)
    this.apiKey = process.env.OPENAI_API_KEY
  }

  getProvider(): string {
    return 'OpenAI'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  private getClient(): OpenAI {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY environment variable not set')
      }
      this.client = new OpenAI({ apiKey: this.apiKey })
    }
    return this.client
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    return this.withRetry(async () => {
      const client = this.getClient()
      const prompt = this.buildPrompt(context)

      const response = await client.chat.completions.create({
        model: this.modelName,
        max_tokens: 1024,
        temperature: 0.2, // Lower temperature for more consistent analysis
        messages: [
          {
            role: 'system',
            content:
              'You are a productivity assistant that helps identify when users are getting distracted from their commitments.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' }, // Force JSON response
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      return this.parseResponse(content)
    })
  }
}
