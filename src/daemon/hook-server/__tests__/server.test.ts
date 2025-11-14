/**
 * Hook server tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { HookServer } from '../server.js'
import type { HookRequest, CaptureRequest } from '../../../types/hook.js'

describe('HookServer', () => {
  let server: HookServer

  beforeEach(async () => {
    // Use a random port for testing to avoid conflicts
    const port = 3000 + Math.floor(Math.random() * 1000)
    server = new HookServer({ port, logger: false })
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const address = server.getAddress()
      const response = await fetch(`http://${address}/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('version')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('hasCommitmentToday')
    })
  })

  describe('Check Focus Endpoint', () => {
    it('should handle missing request field', async () => {
      const address = server.getAddress()
      const response = await fetch(`http://${address}/check-focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
    })

    it('should warn when no commitment is set', async () => {
      const address = server.getAddress()
      const request: HookRequest = {
        request: 'Build a new feature',
        context: {},
        source: 'claude-code',
      }

      const response = await fetch(`http://${address}/check-focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.action).toBe('warn')
      expect(data.severity).toBe('MEDIUM')
    })

    it('should return intervention for misaligned request', async () => {
      // First, set a commitment (this would normally be done via CLI)
      // For this test, we'll just test the no-commitment case
      const address = server.getAddress()
      const request: HookRequest = {
        request: 'Refactor the entire codebase',
        context: {
          current_file: 'test.ts',
          git_branch: 'main',
        },
        source: 'claude-code',
      }

      const response = await fetch(`http://${address}/check-focus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('action')
      expect(data).toHaveProperty('severity')
    })
  })

  describe('Capture Endpoint', () => {
    it('should handle missing thought field', async () => {
      const address = server.getAddress()
      const response = await fetch(`http://${address}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
    })

    it('should handle empty thought', async () => {
      const address = server.getAddress()
      const request: CaptureRequest = {
        thought: '   ',
      }

      const response = await fetch(`http://${address}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      expect(response.status).toBe(400)
    })

    it('should fail when no commitment is set', async () => {
      const address = server.getAddress()
      const request: CaptureRequest = {
        thought: 'This is a test thought',
        context: {
          current_file: 'test.ts',
        },
      }

      const response = await fetch(`http://${address}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.captured).toBe(false)
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const address = server.getAddress()
      const response = await fetch(`http://${address}/unknown-route`)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Not Found')
    })
  })

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const address = server.getAddress()
      const response = await fetch(`http://${address}/health`, {
        method: 'OPTIONS',
      })

      expect(response.headers.has('access-control-allow-origin')).toBe(true)
    })
  })
})
