/**
 * Google Gemini analyzer using @google/generative-ai
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'
import { BaseAnalyzer } from './BaseAnalyzer.js'

export class GeminiAnalyzer extends BaseAnalyzer {
  private client: GoogleGenerativeAI | null = null
  private readonly apiKey: string | undefined

  constructor(modelName: string = 'gemini-2.0-flash-exp') {
    super(modelName)
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  }

  getProvider(): string {
    return 'Gemini'
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set')
      }
      this.client = new GoogleGenerativeAI(this.apiKey)
    }
    return this.client
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    return this.withRetry(async () => {
      const client = this.getClient()
      const model = client.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.2, // Lower temperature for more consistent analysis
          maxOutputTokens: 1024,
          responseMimeType: 'application/json', // Force JSON response
        },
      })

      const prompt = this.buildPrompt(context)
      const systemPrompt =
        'You are a productivity assistant that helps identify when users are getting distracted from their commitments.'

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + prompt }],
          },
        ],
      })

      const response = result.response
      const content = response.text()

      if (!content) {
        throw new Error('No response content from Gemini')
      }

      return this.parseResponse(content)
    })
  }
}
