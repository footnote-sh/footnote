/**
 * Capture footnote endpoint
 * Saves a thought/idea as a footnote to today's commitment
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { StateManager } from '../../../state/StateManager.js'
import type { CommitmentStore } from '../../../state/CommitmentStore.js'
import type { CaptureRequest, CaptureResponse } from '../../../types/hook.js'

/**
 * Validate and sanitize footnote content
 */
function sanitizeFootnote(thought: string): string {
  // Trim whitespace
  let sanitized = thought.trim()

  // Limit length (e.g., 500 characters)
  const MAX_LENGTH = 500
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '...'
  }

  // Remove potentially problematic characters
  // Keep alphanumeric, spaces, and common punctuation
  sanitized = sanitized.replace(/[^\w\s\-.,!?'"()[\]{}:;@#$%&*+=/<>]/g, '')

  return sanitized
}

/**
 * Format footnote with timestamp and optional context
 */
function formatFootnote(thought: string, context?: CaptureRequest['context']): string {
  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  let footnote = `[${timestamp}] ${thought}`

  // Add context if available
  if (context) {
    const contextParts: string[] = []

    if (context.current_file) {
      contextParts.push(`file: ${context.current_file}`)
    }

    if (context.git_branch) {
      contextParts.push(`branch: ${context.git_branch}`)
    }

    if (contextParts.length > 0) {
      footnote += ` (${contextParts.join(', ')})`
    }
  }

  return footnote
}

/**
 * Capture route handler factory
 */
export function captureRoute(stateManager: StateManager, commitmentStore: CommitmentStore) {
  return async (
    request: FastifyRequest<{ Body: CaptureRequest }>,
    reply: FastifyReply
  ): Promise<CaptureResponse> => {
    const { thought, context } = request.body

    // Validate request
    if (!thought || typeof thought !== 'string') {
      reply.code(400)
      throw new Error('Missing or invalid "thought" field')
    }

    if (thought.trim().length === 0) {
      reply.code(400)
      throw new Error('Thought cannot be empty')
    }

    // Sanitize the thought
    const sanitized = sanitizeFootnote(thought)

    if (sanitized.length === 0) {
      reply.code(400)
      throw new Error('Thought contains no valid content')
    }

    // Check if there's a commitment for today
    const commitment = commitmentStore.getToday()

    if (!commitment) {
      // No commitment set - can't capture without one
      reply.code(409) // Conflict
      return {
        captured: false,
        message: 'No commitment set for today. Please set a commitment before capturing footnotes.',
      }
    }

    // Format footnote with timestamp and context
    const footnote = formatFootnote(sanitized, context)

    // Log the capture attempt
    request.log.info(
      {
        commitment: commitment.mainThought,
        footnote,
        context,
      },
      'Capturing footnote'
    )

    try {
      // Add footnote to today's commitment
      const updated = commitmentStore.addFootnote(footnote)

      if (!updated) {
        throw new Error('Failed to add footnote to commitment')
      }

      // Log success
      request.log.info(
        {
          commitment: commitment.mainThought,
          footnoteCount: updated.footnotes.length,
        },
        'Footnote captured successfully'
      )

      return {
        captured: true,
        message: `Footnote captured! You now have ${updated.footnotes.length} footnote${updated.footnotes.length !== 1 ? 's' : ''} for today.`,
      }
    } catch (error) {
      // Log error
      request.log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          thought,
          context,
        },
        'Failed to capture footnote'
      )

      // Return error response
      reply.code(500)
      return {
        captured: false,
        message: 'Failed to capture footnote. Please try again.',
      }
    }
  }
}
