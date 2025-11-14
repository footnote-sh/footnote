/**
 * Hook server entry point
 * Can be run standalone for testing or imported for daemon integration
 */

import { createHookServer, setupGracefulShutdown, type HookServerOptions } from './server.js'

/**
 * Start the hook server with default options
 */
export async function startHookServer(options?: HookServerOptions) {
  const server = await createHookServer(options)
  setupGracefulShutdown(server)
  return server
}

// Export server class and types
export { HookServer, type HookServerOptions } from './server.js'

// If running directly (not imported), start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3040
  const host = process.env.HOST || '127.0.0.1'

  console.log('Starting Footnote hook server...')
  console.log(`Port: ${port}`)
  console.log(`Host: ${host}`)

  startHookServer({ port, host })
    .then(() => {
      console.log('Server started successfully')
    })
    .catch((error) => {
      console.error('Failed to start server:', error)
      process.exit(1)
    })
}
