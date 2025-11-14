/**
 * Example usage of the Footnote analyzers
 *
 * Run with: tsx src/daemon/analyzers/example.ts
 */

import { AnalyzerFactory } from './AnalyzerFactory.js'
import type { AnalysisContext } from '../../types/analysis.js'

async function main() {
  // Example 1: Auto-select analyzer based on available API keys
  console.log('Available providers:', AnalyzerFactory.getAvailableProviders())

  try {
    const analyzer = AnalyzerFactory.createAuto()
    console.log(`\nUsing ${analyzer.getProvider()} analyzer\n`)

    // Example analysis contexts
    const examples: AnalysisContext[] = [
      {
        commitment: 'Build the user authentication system',
        request: 'Implement JWT token generation and validation',
        context: {
          current_file: 'src/auth/tokens.ts',
          git_branch: 'feature/auth',
        },
      },
      {
        commitment: 'Build the user authentication system',
        request: "Let's refactor the entire database schema to use GraphQL",
        context: {
          current_file: 'src/auth/login.ts',
          git_branch: 'feature/auth',
        },
      },
      {
        commitment: 'Fix the checkout flow bug',
        request: 'First, let me research the best state management patterns',
        context: {
          current_file: 'src/checkout/cart.tsx',
          git_branch: 'bugfix/checkout',
        },
      },
      {
        commitment: 'Add pagination to user list',
        request: 'Also add sorting and filtering capabilities',
        context: {
          current_file: 'src/components/UserList.tsx',
          git_branch: 'feature/pagination',
        },
      },
    ]

    // Run analysis on each example
    for (const [index, context] of examples.entries()) {
      console.log(`\n--- Example ${index + 1} ---`)
      console.log(`Commitment: "${context.commitment}"`)
      console.log(`Request: "${context.request}"`)

      try {
        const result = await analyzer.analyze(context)
        console.log('\nAnalysis Result:')
        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        console.error('Analysis failed:', error)
      }
    }
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    console.error('\nPlease set one of these environment variables:')
    console.error('  - ANTHROPIC_API_KEY (for Claude)')
    console.error('  - OPENAI_API_KEY (for GPT-4)')
    console.error('  - GEMINI_API_KEY or GOOGLE_API_KEY (for Gemini)')
    console.error('  - Or run Ollama locally (http://localhost:11434)')
  }
}

main()
