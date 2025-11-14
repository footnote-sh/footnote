# Footnote Hook Server

Production-ready Fastify server for the Footnote intervention system. Provides REST API endpoints for checking focus alignment and capturing footnotes.

## Overview

The hook server intercepts AI coding requests (from Claude Code, Cursor, etc.) and checks if they align with the user's daily commitment. If misaligned, it provides an intervention to help the user refocus.

## Architecture

```
┌─────────────────┐
│   AI Coding     │
│   Assistant     │
└────────┬────────┘
         │ POST /check-focus
         ▼
┌─────────────────┐
│   Hook Server   │
│   (Port 3040)   │
└────────┬────────┘
         │
         ├─► StateManager ──► Commitment Store
         │
         └─► BaseAnalyzer ──► AI Analysis
```

## Endpoints

### GET /health

Health check endpoint for monitoring server status.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-13T12:00:00.000Z",
  "hasCommitmentToday": true
}
```

### POST /check-focus

Checks if a coding request aligns with today's commitment.

**Request:**
```json
{
  "request": "Build a new authentication system",
  "context": {
    "current_file": "src/auth/login.ts",
    "git_branch": "feature/auth",
    "recent_commits": ["Add user model", "Setup database"],
    "working_directory": "/Users/dev/project",
    "timestamp": "2024-01-13T12:00:00.000Z"
  },
  "source": "claude-code"
}
```

**Response (Aligned):**
```json
{
  "action": "allow",
  "severity": "LOW",
  "type": "aligned",
  "message": "This aligns with your commitment. Go ahead!"
}
```

**Response (Misaligned):**
```json
{
  "action": "block",
  "severity": "HIGH",
  "type": "shiny_object",
  "message": "This looks like a shiny new object. Is this really what you committed to today?",
  "intervention": {
    "title": "This looks like a shiny new object. Is this really what you committed to today?",
    "commitment": "Build authentication system",
    "request": "Refactor the entire database layer",
    "reasoning": "This appears to be a completely different task",
    "options": [
      {
        "id": "refocus",
        "label": "Refocus",
        "description": "Get back to your commitment",
        "action": "refocus"
      },
      {
        "id": "capture",
        "label": "Capture & Continue",
        "description": "Save this thought and stay focused",
        "action": "capture"
      },
      {
        "id": "find_fun",
        "label": "Find the Fun",
        "description": "Make your commitment more engaging",
        "action": "find_fun"
      },
      {
        "id": "override",
        "label": "Override",
        "description": "I know what I'm doing",
        "action": "override"
      }
    ]
  }
}
```

### POST /capture

Captures a footnote to today's commitment.

**Request:**
```json
{
  "thought": "Need to refactor auth later",
  "context": {
    "current_file": "src/auth/login.ts",
    "git_branch": "feature/auth"
  }
}
```

**Response (Success):**
```json
{
  "captured": true,
  "message": "Footnote captured! You now have 3 footnotes for today."
}
```

**Response (No Commitment):**
```json
{
  "captured": false,
  "message": "No commitment set for today. Please set a commitment before capturing footnotes."
}
```

## Usage

### Start Server Standalone

```bash
# Default port (3040)
node dist/daemon/hook-server/index.js

# Custom port
PORT=8080 node dist/daemon/hook-server/index.js

# Custom host
HOST=0.0.0.0 PORT=3040 node dist/daemon/hook-server/index.js
```

### Programmatic Usage

```typescript
import { HookServer, setupGracefulShutdown } from './daemon/hook-server/server.js'

// Create and start server
const server = new HookServer({
  port: 3040,
  host: '127.0.0.1',
  logger: true
})

await server.start()
setupGracefulShutdown(server)

// Stop server
await server.stop()
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3040)
- `HOST` - Server host (default: 127.0.0.1)
- `NODE_ENV` - Environment (development/production)

### Security

- **Localhost Only**: Server binds to 127.0.0.1 by default for security
- **CORS**: Restricted to localhost origins
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: TODO - implement rate limiting
- **Request ID**: Each request gets a unique ID for tracing

## Error Handling

The server implements comprehensive error handling:

1. **Validation Errors**: 400 Bad Request
2. **No Commitment**: 409 Conflict (for capture endpoint)
3. **Server Errors**: 500 Internal Server Error
4. **Graceful Shutdown**: Handles SIGTERM/SIGINT
5. **Fail Open**: If analysis fails, allows the request

## Logging

Structured logging with request/response tracking:

```json
{
  "level": "info",
  "reqId": "req-123",
  "url": "/check-focus",
  "method": "POST",
  "statusCode": 200,
  "responseTime": 45,
  "msg": "Request completed"
}
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test src/daemon/hook-server/__tests__/server.test.ts
```

## Integration with Daemon

The hook server is managed by the `DaemonManager`:

```typescript
import { DaemonManager } from './daemon/DaemonManager.js'

const daemon = new DaemonManager()
await daemon.start()  // Starts hook server
await daemon.stop()   // Stops hook server
```

## Analyzer Integration

The server uses `BaseAnalyzer` for semantic analysis. In production, replace `MockAnalyzer` with:

- **Claude Analyzer**: Uses Anthropic API for deep semantic understanding
- **OpenAI Analyzer**: Uses GPT-4 for analysis
- **Local LLM**: Uses local model for privacy

See `src/daemon/analyzers/` for analyzer implementations.

## Performance

- **Response Time**: < 100ms (without AI analysis)
- **Concurrency**: Handles multiple concurrent requests
- **Memory**: Low memory footprint (~30MB base)
- **Startup**: < 1 second

## Roadmap

- [ ] Add rate limiting per source
- [ ] Implement caching for repeated requests
- [ ] Add metrics endpoint (Prometheus)
- [ ] Support WebSocket for real-time updates
- [ ] Add authentication for non-localhost access
- [ ] Implement request batching
- [ ] Add circuit breaker for analyzer
- [ ] Support custom analyzers via plugins

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3040
lsof -i :3040

# Kill the process
kill -9 <PID>
```

### Server Won't Start

1. Check if port is available
2. Verify Node.js version (>=18.0.0)
3. Check file permissions
4. Review logs for errors

### Analysis Failing

1. Check analyzer configuration
2. Verify API keys (for Claude/OpenAI)
3. Check network connectivity
4. Review analyzer logs

## Contributing

When modifying the server:

1. Update types in `src/types/hook.ts`
2. Add tests for new endpoints
3. Update this README
4. Run `npm test` before committing
5. Follow TypeScript best practices
