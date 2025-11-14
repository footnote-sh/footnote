/**
 * Track activity route - receives PostToolUse hooks from Claude Code
 * Tracks files being worked on to provide context for alignment detection
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { WorkContextTracker } from '../../context/WorkContextTracker.js'

interface HookPayload {
  tool_name?: string
  tool_input?: {
    file_path?: string
    command?: string
    description?: string
  }
  tool_output?: any
  context?: {
    working_directory?: string
  }
}

/**
 * POST /track-activity
 * Receives PostToolUse hooks from Claude Code to track what user is working on
 */
export function trackActivityRoute(contextTracker: WorkContextTracker) {
  return async (request: FastifyRequest<{ Body: HookPayload }>, reply: FastifyReply) => {
    const { tool_name, tool_input, context } = request.body

    try {
      // Track file operations
      if (
        tool_input?.file_path &&
        (tool_name === 'Read' || tool_name === 'Edit' || tool_name === 'Write')
      ) {
        contextTracker.trackFile(tool_input.file_path)
        request.log.info({ file: tool_input.file_path, tool: tool_name }, 'Tracked file activity')
      }

      // Track commands
      if (tool_name === 'Bash' && tool_input?.command) {
        contextTracker.trackCommand(tool_input.command)
        request.log.info(
          { command: tool_input.command, description: tool_input.description },
          'Tracked command activity'
        )
      }

      // Update working directory
      if (context?.working_directory) {
        contextTracker.updateDirectory(context.working_directory)
      }

      return {
        status: 'ok',
        message: 'Activity tracked',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      request.log.error(error, 'Error tracking activity')
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to track activity',
      })
    }
  }
}
