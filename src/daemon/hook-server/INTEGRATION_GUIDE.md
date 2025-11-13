# Hook Server Integration Guide

This guide explains how to integrate the Hook Server with the DaemonManager and replace the MockAnalyzer with real AI analyzers.

## Integration with DaemonManager

### Step 1: Update DaemonManager

Add hook server management to `src/daemon/DaemonManager.ts`:

```typescript
import { HookServer, setupGracefulShutdown } from './hook-server/server.js'

export class DaemonManager {
  private hookServer?: HookServer

  async start(): Promise<void> {
    // Start hook server
    this.hookServer = new HookServer({
      port: 3040,
      host: '127.0.0.1',
      logger: true
    })

    await this.hookServer.start()
    setupGracefulShutdown(this.hookServer)

    console.log('Hook server started on port 3040')
  }

  async stop(): Promise<void> {
    if (this.hookServer) {
      await this.hookServer.stop()
      console.log('Hook server stopped')
    }
  }

  isRunning(): boolean {
    return this.hookServer?.isListening() ?? false
  }
}
```

### Step 2: CLI Integration

Update `src/cli/commands/daemon.ts`:

```typescript
import { DaemonManager } from '../../daemon/DaemonManager.js'

const daemon = new DaemonManager()

// Start daemon
export async function startDaemon() {
  await daemon.start()
  console.log('Footnote daemon started')
}

// Stop daemon
export async function stopDaemon() {
  await daemon.stop()
  console.log('Footnote daemon stopped')
}

// Status check
export function daemonStatus() {
  const isRunning = daemon.isRunning()
  console.log(`Daemon status: ${isRunning ? 'running' : 'stopped'}`)

  if (isRunning) {
    console.log('Hook server listening on http://127.0.0.1:3040')
  }
}
```

## Replacing MockAnalyzer with Real AI

### Option 1: Claude Analyzer (Anthropic)

Create `src/daemon/analyzers/ClaudeAnalyzer.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { BaseAnalyzer } from './BaseAnalyzer.js'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'

export class ClaudeAnalyzer extends BaseAnalyzer {
  private client: Anthropic

  constructor(apiKey: string) {
    super('claude-3-5-sonnet-20241022')

    if (!apiKey) {
      throw new Error('Anthropic API key is required')
    }

    this.client = new Anthropic({ apiKey })
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(context)

    return this.withRetry(async () => {
      const response = await this.client.messages.create({
        model: this.modelName,
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      return this.parseResponse(content.text)
    })
  }

  isConfigured(): boolean {
    return !!this.client.apiKey
  }

  getProvider(): string {
    return 'Claude (Anthropic)'
  }
}
```

### Option 2: OpenAI Analyzer

Create `src/daemon/analyzers/OpenAIAnalyzer.ts`:

```typescript
import OpenAI from 'openai'
import { BaseAnalyzer } from './BaseAnalyzer.js'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'

export class OpenAIAnalyzer extends BaseAnalyzer {
  private client: OpenAI

  constructor(apiKey: string) {
    super('gpt-4-turbo-preview')

    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }

    this.client = new OpenAI({ apiKey })
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(context)

    return this.withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an ADHD focus assistant. Analyze requests objectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return this.parseResponse(content)
    })
  }

  isConfigured(): boolean {
    return !!this.client.apiKey
  }

  getProvider(): string {
    return 'GPT-4 (OpenAI)'
  }
}
```

### Option 3: Gemini Analyzer

Create `src/daemon/analyzers/GeminiAnalyzer.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { BaseAnalyzer } from './BaseAnalyzer.js'
import type { AnalysisResult, AnalysisContext } from '../../types/analysis.js'

export class GeminiAnalyzer extends BaseAnalyzer {
  private client: GoogleGenerativeAI
  private model: any

  constructor(apiKey: string) {
    super('gemini-pro')

    if (!apiKey) {
      throw new Error('Google API key is required')
    }

    this.client = new GoogleGenerativeAI(apiKey)
    this.model = this.client.getGenerativeModel({ model: this.modelName })
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(context)

    return this.withRetry(async () => {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseResponse(text)
    })
  }

  isConfigured(): boolean {
    return !!this.client
  }

  getProvider(): string {
    return 'Gemini (Google)'
  }
}
```

### Step 3: Update check-focus.ts

Replace MockAnalyzer with real analyzer:

```typescript
import { ClaudeAnalyzer } from '../../analyzers/ClaudeAnalyzer.js'
import { OpenAIAnalyzer } from '../../analyzers/OpenAIAnalyzer.js'
import { GeminiAnalyzer } from '../../analyzers/GeminiAnalyzer.js'

// Create analyzer factory
function createAnalyzer(): BaseAnalyzer {
  // Check which API key is available
  const claudeKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GOOGLE_API_KEY

  if (claudeKey) {
    return new ClaudeAnalyzer(claudeKey)
  }

  if (openaiKey) {
    return new OpenAIAnalyzer(openaiKey)
  }

  if (geminiKey) {
    return new GeminiAnalyzer(geminiKey)
  }

  // Fallback to mock in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('No AI API key found, using MockAnalyzer')
    return new MockAnalyzer()
  }

  throw new Error('No AI analyzer configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY')
}

// In checkFocusRoute function:
export function checkFocusRoute(stateManager: StateManager, commitmentStore: CommitmentStore) {
  return async (request: FastifyRequest<{ Body: HookRequest }>, reply: FastifyReply) => {
    // ... validation code ...

    try {
      // Create analyzer based on available API keys
      const analyzer = createAnalyzer()

      if (!analyzer.isConfigured()) {
        throw new Error('Analyzer not properly configured')
      }

      // Analyze the request
      const analysisResult = await analyzer.analyze({
        commitment: commitment.mainThought,
        request: userRequest,
        context: {
          current_file: context.current_file,
          git_branch: context.git_branch,
          recent_commits: context.recent_commits,
        },
      })

      // ... rest of handler ...
    } catch (error) {
      // ... error handling ...
    }
  }
}
```

## Environment Configuration

### Development (.env.local)
```bash
# Choose one AI provider
ANTHROPIC_API_KEY=your_claude_key
# or
OPENAI_API_KEY=your_openai_key
# or
GOOGLE_API_KEY=your_gemini_key

# Hook server config
HOOK_SERVER_PORT=3040
HOOK_SERVER_HOST=127.0.0.1
NODE_ENV=development
```

### Production (.env)
```bash
# AI Provider (choose one)
ANTHROPIC_API_KEY=your_production_claude_key

# Hook server
HOOK_SERVER_PORT=3040
HOOK_SERVER_HOST=127.0.0.1
NODE_ENV=production

# Logging
LOG_LEVEL=info
```

## Testing with Real AI

### Test Script
Create `test-with-ai.sh`:

```bash
#!/bin/bash

# Set API key
export ANTHROPIC_API_KEY="your_key_here"

# Start server
node dist/daemon/hook-server/index.js &
SERVER_PID=$!

sleep 2

# Test with real AI analysis
curl -X POST http://127.0.0.1:3040/check-focus \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Let me refactor this entire codebase before implementing the feature",
    "context": {
      "current_file": "src/app.ts",
      "git_branch": "feature/auth"
    },
    "source": "claude-code"
  }'

# Stop server
kill $SERVER_PID
```

## Performance Considerations

### Caching
Add response caching for repeated requests:

```typescript
import { LRUCache } from 'lru-cache'

const analysisCache = new LRUCache<string, AnalysisResult>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
})

function getCacheKey(context: AnalysisContext): string {
  return `${context.commitment}:${context.request}`
}

// In analyze function:
const cacheKey = getCacheKey(context)
const cached = analysisCache.get(cacheKey)

if (cached) {
  return cached
}

const result = await analyzer.analyze(context)
analysisCache.set(cacheKey, result)
return result
```

### Timeout Handling
Add timeout to prevent hanging:

```typescript
const ANALYSIS_TIMEOUT = 10000 // 10 seconds

const result = await Promise.race([
  analyzer.analyze(context),
  new Promise<AnalysisResult>((_, reject) =>
    setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT)
  )
])
```

### Rate Limiting
Add rate limiting per source:

```typescript
import { RateLimiter } from 'limiter'

const limiters = new Map<string, RateLimiter>()

function getRateLimiter(source: string): RateLimiter {
  if (!limiters.has(source)) {
    limiters.set(source, new RateLimiter({
      tokensPerInterval: 10,
      interval: 'minute'
    }))
  }
  return limiters.get(source)!
}

// In route handler:
const limiter = getRateLimiter(source)
const allowed = await limiter.removeTokens(1)

if (!allowed) {
  reply.code(429)
  throw new Error('Rate limit exceeded')
}
```

## Monitoring

### Add Metrics Endpoint

```typescript
// In server.ts
this.fastify.get('/metrics', async () => {
  return {
    uptime: process.uptime(),
    requests: {
      total: requestCount,
      check_focus: checkFocusCount,
      capture: captureCount,
    },
    analysis: {
      average_time: averageAnalysisTime,
      cache_hit_rate: cacheHitRate,
      errors: analysisErrorCount,
    },
    memory: process.memoryUsage(),
  }
})
```

## Troubleshooting

### AI Analysis Failures
1. Check API keys are set correctly
2. Verify network connectivity
3. Check rate limits
4. Review logs for error details
5. Test with MockAnalyzer first

### Server Won't Start
1. Check port 3040 is available
2. Verify dependencies are installed
3. Check file permissions
4. Review server logs

### Slow Response Times
1. Enable caching
2. Reduce timeout values
3. Use faster AI models
4. Add connection pooling

## Next Steps

1. ✅ Implement analyzer of choice
2. ✅ Update check-focus.ts
3. ✅ Add environment configuration
4. ✅ Test with real AI
5. Add caching layer
6. Add rate limiting
7. Add monitoring/metrics
8. Production deployment
