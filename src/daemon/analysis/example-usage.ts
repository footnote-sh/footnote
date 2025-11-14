/**
 * Example usage of AlignmentAnalyzer
 * This demonstrates how to integrate the analyzer into the hook server
 */

import { AlignmentAnalyzer } from './AlignmentAnalyzer.js'
import { CommitmentStore } from '../../state/CommitmentStore.js'
import { StateManager } from '../../state/StateManager.js'
import type { HookRequest } from '../../types/hook.js'

async function exampleUsage() {
  // Initialize state management
  const stateManager = new StateManager()
  const commitmentStore = new CommitmentStore(stateManager)

  // Set today's commitment
  commitmentStore.setMainThought('Build semantic alignment detection for Footnote')

  // Create analyzer
  const analyzer = new AlignmentAnalyzer({
    commitmentStore,
    preferredAnalyzer: 'claude', // or 'openai', 'gemini'
  })

  // Example 1: Aligned request
  const alignedRequest: HookRequest = {
    request: 'Create AlignmentAnalyzer.ts with semantic detection logic',
    context: {
      current_file: 'src/daemon/analysis/AlignmentAnalyzer.ts',
      git_branch: 'feature/alignment-detection',
      working_directory: '/Users/bb16/code/footnote',
    },
    source: 'claude-code',
  }

  console.log('Example 1: Aligned Request')
  const response1 = await analyzer.analyze(alignedRequest)
  console.log(response1)
  console.log()

  // Example 2: Shiny object request
  const shinyObjectRequest: HookRequest = {
    request: 'Add blockchain integration and NFT minting to the CLI',
    context: {
      current_file: 'src/cli/index.ts',
      git_branch: 'feature/alignment-detection',
      working_directory: '/Users/bb16/code/footnote',
    },
    source: 'claude-code',
  }

  console.log('Example 2: Shiny Object Request')
  const response2 = await analyzer.analyze(shinyObjectRequest)
  console.log(response2)
  console.log()

  // Example 3: Context switch request
  const contextSwitchRequest: HookRequest = {
    request: 'Update the README with better documentation',
    context: {
      current_file: 'README.md',
      git_branch: 'feature/alignment-detection',
      working_directory: '/Users/bb16/code/footnote',
    },
    source: 'claude-code',
  }

  console.log('Example 3: Context Switch Request')
  const response3 = await analyzer.analyze(contextSwitchRequest)
  console.log(response3)
  console.log()

  // Example 4: Handle intervention response (capture)
  if (response2.intervention) {
    console.log('Example 4: Capturing shiny object as footnote')
    const captureResult = await analyzer.handleInterventionResponse('capture', {
      commitment: 'Build semantic alignment detection for Footnote',
      request: 'Add blockchain integration and NFT minting to the CLI',
    })
    console.log(captureResult)
    console.log()

    // Check footnotes
    const commitment = commitmentStore.getToday()
    console.log('Current footnotes:', commitment?.footnotes)
  }
}

// Integration with Hook Server
export function setupAlignmentAnalyzer(
  commitmentStore: CommitmentStore,
  preferredAnalyzer?: 'claude' | 'openai' | 'gemini'
) {
  return new AlignmentAnalyzer({
    commitmentStore,
    preferredAnalyzer,
  })
}

// Example hook server endpoint
export async function handleCheckFocusRequest(request: HookRequest, analyzer: AlignmentAnalyzer) {
  try {
    const response = await analyzer.analyze(request)

    // If intervention is needed, prompt user
    if (response.intervention) {
      // In a real implementation, this would be sent to the client
      // and the user would select an option
      console.log('Intervention needed:', response.intervention.title)
      console.log('Options:', response.intervention.options)

      // Simulate user choosing to capture
      const interventionResponse = await analyzer.handleInterventionResponse('capture', {
        commitment: response.intervention.commitment,
        request: response.intervention.request,
      })

      return {
        ...response,
        interventionResponse,
      }
    }

    return response
  } catch (error) {
    console.error('Analysis error:', error)
    // Fail open - allow the request
    return {
      action: 'allow' as const,
      severity: 'LOW' as const,
      type: 'aligned' as const,
      message: 'Analysis unavailable - proceeding',
    }
  }
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch(console.error)
}
