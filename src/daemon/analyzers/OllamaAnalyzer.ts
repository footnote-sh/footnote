/**
 * Ollama analyzer for local LLMs via HTTP
 */

import axios, { type AxiosInstance } from 'axios'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'
import { BaseAnalyzer } from './BaseAnalyzer.js'

interface OllamaResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

export class OllamaAnalyzer extends BaseAnalyzer {
  private client: AxiosInstance
  private readonly baseUrl: string

  constructor(modelName: string = 'llama3.1', baseUrl: string = 'http://localhost:11434') {
    super(modelName)
    this.baseUrl = process.env.OLLAMA_BASE_URL || baseUrl
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  getProvider(): string {
    return 'Ollama'
  }

  isConfigured(): boolean {
    // Ollama doesn't require API keys, just check if server is accessible
    return true
  }

  /**
   * Check if Ollama server is running and model is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags', { timeout: 5000 })
      const models = response.data.models || []
      return models.some((m: { name: string }) => m.name.includes(this.modelName))
    } catch {
      return false
    }
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    return this.withRetry(async () => {
      const prompt = this.buildPrompt(context)

      const response = await this.client.post<OllamaResponse>('/api/chat', {
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content:
              'You are a productivity assistant that helps identify when users are getting distracted from their commitments. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        options: {
          temperature: 0.2, // Lower temperature for more consistent analysis
          num_predict: 1024,
        },
        format: 'json', // Request JSON format
      })

      const content = response.data.message?.content
      if (!content) {
        throw new Error('No response content from Ollama')
      }

      return this.parseResponse(content)
    })
  }

  /**
   * Pull a model if not available
   */
  async pullModel(): Promise<void> {
    await this.client.post('/api/pull', {
      model: this.modelName,
      stream: false,
    })
  }
}
