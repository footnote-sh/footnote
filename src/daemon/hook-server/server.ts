/**
 * Fastify hook server for Footnote intervention system
 * Provides endpoints for checking focus alignment and capturing footnotes
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { StateManager } from '../../state/StateManager.js'
import { CommitmentStore } from '../../state/CommitmentStore.js'
import { checkFocusRoute } from './routes/check-focus.js'
import { captureRoute } from './routes/capture.js'

const DEFAULT_PORT = 3040
const DEFAULT_HOST = '127.0.0.1' // localhost only for security

export interface HookServerOptions {
  port?: number
  host?: string
  logger?: boolean
}

export class HookServer {
  private fastify: ReturnType<typeof Fastify>
  private stateManager: StateManager
  private commitmentStore: CommitmentStore
  private port: number
  private host: string

  constructor(options: HookServerOptions = {}) {
    this.port = options.port ?? DEFAULT_PORT
    this.host = options.host ?? DEFAULT_HOST

    // Initialize Fastify with logger
    this.fastify = Fastify({
      logger: options.logger ?? true,
      requestIdLogLabel: 'reqId',
      disableRequestLogging: false,
      requestIdHeader: 'x-request-id',
    })

    // Initialize state management
    this.stateManager = new StateManager()
    this.commitmentStore = new CommitmentStore(this.stateManager)

    this.setupPlugins()
    this.setupRoutes()
    this.setupErrorHandlers()
  }

  /**
   * Setup Fastify plugins
   */
  private setupPlugins(): void {
    // CORS - allow localhost only
    this.fastify.register(cors, {
      origin: ['http://localhost:*', 'http://127.0.0.1:*'],
      methods: ['GET', 'POST'],
      credentials: true,
    })

    // Request logging hook
    this.fastify.addHook('onRequest', async (request: any, reply: any) => {
      request.log.info(
        {
          url: request.url,
          method: request.method,
          ip: request.ip,
        },
        'Incoming request'
      )
    })

    // Response logging hook
    this.fastify.addHook('onResponse', async (request: any, reply: any) => {
      request.log.info(
        {
          url: request.url,
          method: request.method,
          statusCode: reply.statusCode,
          responseTime: reply.elapsedTime,
        },
        'Request completed'
      )
    })
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.fastify.get('/health', async (request: any, reply: any) => {
      const hasCommitment = this.commitmentStore.hasCommitmentToday()

      return {
        status: 'ok',
        version: this.stateManager.getVersion(),
        timestamp: new Date().toISOString(),
        hasCommitmentToday: hasCommitment,
      }
    })

    // Check focus alignment endpoint
    this.fastify.post('/check-focus', checkFocusRoute(this.stateManager, this.commitmentStore))

    // Capture footnote endpoint
    this.fastify.post('/capture', captureRoute(this.stateManager, this.commitmentStore))

    // 404 handler
    this.fastify.setNotFoundHandler((request: any, reply: any) => {
      reply.code(404).send({
        error: 'Not Found',
        message: `Route ${request.method}:${request.url} not found`,
        statusCode: 404,
      })
    })
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    this.fastify.setErrorHandler((error: any, request: any, reply: any) => {
      // Log the error
      request.log.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          url: request.url,
          method: request.method,
        },
        'Request error'
      )

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development'

      reply.status(error.statusCode ?? 500).send({
        error: error.name || 'Internal Server Error',
        message: isDevelopment ? error.message : 'An internal error occurred',
        statusCode: error.statusCode ?? 500,
        ...(isDevelopment && { stack: error.stack }),
      })
    })
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      await this.fastify.listen({
        port: this.port,
        host: this.host,
      })

      console.log(`Footnote hook server listening on ${this.host}:${this.port}`)
    } catch (error) {
      this.fastify.log.error(error)
      throw error
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    try {
      await this.fastify.close()
      console.log('Footnote hook server stopped')
    } catch (error) {
      this.fastify.log.error(error)
      throw error
    }
  }

  /**
   * Get server address
   */
  getAddress(): string | null {
    const address = this.fastify.server.address()
    if (!address) return null

    if (typeof address === 'string') {
      return address
    }

    return `${address.address}:${address.port}`
  }

  /**
   * Check if server is listening
   */
  isListening(): boolean {
    return this.fastify.server.listening
  }
}

/**
 * Create and start a hook server
 */
export async function createHookServer(options?: HookServerOptions): Promise<HookServer> {
  const server = new HookServer(options)
  await server.start()
  return server
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(server: HookServer): void {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down gracefully...`)

      try {
        await server.stop()
        process.exit(0)
      } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
      }
    })
  })

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
    server.stop().finally(() => process.exit(1))
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason)
    server.stop().finally(() => process.exit(1))
  })
}
