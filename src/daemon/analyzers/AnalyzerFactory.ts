/**
 * Factory for creating AI analyzers
 */

import { BaseAnalyzer } from './BaseAnalyzer.js'
import { AnthropicAnalyzer } from './AnthropicAnalyzer.js'
import { OpenAIAnalyzer } from './OpenAIAnalyzer.js'
import { GeminiAnalyzer } from './GeminiAnalyzer.js'

export type AnalyzerProvider = 'claude' | 'openai' | 'gemini'

export interface AnalyzerConfig {
  provider: AnalyzerProvider
  modelName?: string
}

/**
 * Factory for creating AI analyzers based on provider
 */
export class AnalyzerFactory {
  /**
   * Create an analyzer instance
   */
  static create(config: AnalyzerConfig): BaseAnalyzer {
    const { provider, modelName } = config

    switch (provider) {
      case 'claude':
        return new AnthropicAnalyzer(undefined, modelName)

      case 'openai':
        return new OpenAIAnalyzer(modelName)

      case 'gemini':
        return new GeminiAnalyzer(modelName)

      default:
        throw new Error(`Unknown analyzer provider: ${provider}`)
    }
  }

  /**
   * Create an analyzer with automatic provider selection
   * Tries providers in order based on available API keys
   */
  static createAuto(preferredProvider?: AnalyzerProvider): BaseAnalyzer {
    // If a preferred provider is specified, try it first
    if (preferredProvider) {
      const analyzer = this.create({ provider: preferredProvider })
      if (analyzer.isConfigured()) {
        return analyzer
      }
    }

    // Try providers in order of preference
    const providers: AnalyzerProvider[] = ['claude', 'openai', 'gemini']

    for (const provider of providers) {
      if (provider === preferredProvider) continue // Already tried

      try {
        const analyzer = this.create({ provider })
        if (analyzer.isConfigured()) {
          return analyzer
        }
      } catch {
        // Continue to next provider
      }
    }

    throw new Error(
      'No AI analyzer configured. Please set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY environment variable.'
    )
  }

  /**
   * Get list of available providers (configured with API keys)
   */
  static getAvailableProviders(): AnalyzerProvider[] {
    const providers: AnalyzerProvider[] = []

    const configs: AnalyzerConfig[] = [
      { provider: 'claude' },
      { provider: 'openai' },
      { provider: 'gemini' },
    ]

    for (const config of configs) {
      try {
        const analyzer = this.create(config)
        if (analyzer.isConfigured()) {
          providers.push(config.provider)
        }
      } catch {
        // Provider not available
      }
    }

    return providers
  }

  /**
   * Get recommended default models for each provider
   */
  static getDefaultModel(provider: AnalyzerProvider): string {
    switch (provider) {
      case 'claude':
        return 'claude-3-5-sonnet-20241022'
      case 'openai':
        return 'gpt-4o'
      case 'gemini':
        return 'gemini-2.0-flash-exp'
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }
}
