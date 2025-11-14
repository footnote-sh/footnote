# Footnote AI Semantic Analyzers

AI-powered semantic analyzers that detect when users are straying from their daily commitments.

## Overview

These analyzers use LLMs to determine if a coding request aligns with the user's stated commitment. This is critical for catching ADHD-driven context switches before they waste hours.

## Supported Providers

- **Claude** (Anthropic) - Uses `@anthropic-ai/sdk`
- **OpenAI** (GPT-4) - Uses `openai` package
- **Gemini** (Google) - Uses `@google/generative-ai`
- **Ollama** - Local LLMs via HTTP

## Analysis Types

The analyzers classify requests into these types:

- `aligned` - Request matches the commitment ✅
- `shiny_object` - Completely different exciting idea ⚠️
- `context_switch` - Related but off-track ⚠️
- `enhancement` - Enhancement to main task ℹ️
- `productive_procrastination` - Planning/research instead of doing ⚠️

## Setup

### Environment Variables

Set one or more API keys:

```bash
# Claude (recommended)
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI
export OPENAI_API_KEY="sk-..."

# Gemini
export GEMINI_API_KEY="..."
# or
export GOOGLE_API_KEY="..."

# Ollama (no key needed, just run server)
# Optional: customize base URL
export OLLAMA_BASE_URL="http://localhost:11434"
```

### Ollama Setup

For local LLM usage:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.1

# Start server (runs on localhost:11434)
ollama serve
```

## Usage

### Basic Usage

```typescript
import { AnalyzerFactory } from './analyzers'

// Auto-select based on available API keys
const analyzer = AnalyzerFactory.createAuto()

// Analyze a request
const result = await analyzer.analyze({
  commitment: 'Build user authentication system',
  request: 'Implement JWT token generation',
  context: {
    current_file: 'src/auth/tokens.ts',
    git_branch: 'feature/auth',
  },
})

console.log(result)
// {
//   aligned: true,
//   severity: 'LOW',
//   type: 'aligned',
//   reasoning: 'JWT tokens are core to auth system',
//   confidence: 0.95
// }
```

### Specific Provider

```typescript
import { AnalyzerFactory } from './analyzers'

// Use Claude specifically
const analyzer = AnalyzerFactory.create({
  provider: 'claude',
  modelName: 'claude-3-5-sonnet-20241022',
})

// Use Ollama with custom model
const localAnalyzer = AnalyzerFactory.create({
  provider: 'ollama',
  modelName: 'llama3.1',
  ollamaBaseUrl: 'http://localhost:11434',
})
```

### Check Available Providers

```typescript
import { AnalyzerFactory } from './analyzers'

const available = AnalyzerFactory.getAvailableProviders()
// ['claude', 'openai', 'gemini'] or ['ollama'] if only local
```

### Advanced Usage

```typescript
import { ClaudeAnalyzer } from './analyzers'

// Direct instantiation with custom model
const analyzer = new ClaudeAnalyzer('claude-3-5-sonnet-20241022')

// Check if configured
if (!analyzer.isConfigured()) {
  console.error('ANTHROPIC_API_KEY not set')
  process.exit(1)
}

// Analyze with full context
const result = await analyzer.analyze({
  commitment: 'Fix checkout flow bug',
  request: 'Let me first research state management patterns',
  context: {
    current_file: 'src/checkout/cart.tsx',
    git_branch: 'bugfix/checkout',
    recent_commits: [
      'Add error handling to cart',
      'Update payment validation',
    ],
  },
})

// Result includes confidence score
if (result.confidence > 0.8 && !result.aligned) {
  console.log('High-confidence distraction detected!')
  console.log(`Type: ${result.type}`)
  console.log(`Reasoning: ${result.reasoning}`)
}
```

## Example Scenarios

### Scenario 1: Aligned Request ✅

```typescript
{
  commitment: 'Build the user authentication system',
  request: 'Implement JWT token generation and validation'
}
// Result: { aligned: true, type: 'aligned', severity: 'LOW' }
```

### Scenario 2: Shiny Object ⚠️

```typescript
{
  commitment: 'Build the user authentication system',
  request: "Let's refactor the entire database schema to use GraphQL"
}
// Result: { aligned: false, type: 'shiny_object', severity: 'HIGH' }
```

### Scenario 3: Productive Procrastination ⚠️

```typescript
{
  commitment: 'Fix the checkout flow bug',
  request: 'First, let me research the best state management patterns'
}
// Result: { aligned: false, type: 'productive_procrastination', severity: 'MEDIUM' }
```

### Scenario 4: Enhancement ℹ️

```typescript
{
  commitment: 'Add pagination to user list',
  request: 'Also add sorting and filtering capabilities'
}
// Result: { aligned: false, type: 'enhancement', severity: 'LOW' }
```

## Running Examples

```bash
# Run the example file (requires API key)
tsx src/daemon/analyzers/example.ts

# Test with specific provider
ANTHROPIC_API_KEY="..." tsx src/daemon/analyzers/example.ts
```

## Architecture

### BaseAnalyzer

Abstract base class providing:
- Prompt template generation
- Response parsing and validation
- Retry logic with exponential backoff
- Error handling

### Provider Implementations

Each provider implements:
- API client initialization
- Configuration validation
- Request/response handling
- Provider-specific error handling

### AnalyzerFactory

Factory pattern providing:
- Provider creation
- Auto-selection based on available credentials
- Default model recommendations
- Provider availability checking

## Error Handling

All analyzers include:

1. **Retry Logic**: Exponential backoff up to 3 attempts
2. **Timeout Protection**: 30-second default timeout
3. **Graceful Degradation**: Returns safe defaults on parse failure
4. **Credential Validation**: Checks before making requests

## Performance

Typical analysis time:
- Claude: 1-2 seconds
- OpenAI: 1-2 seconds
- Gemini: 1-2 seconds
- Ollama: 2-5 seconds (depends on hardware)

All analyzers use low temperature (0.2) for consistent, deterministic results.

## Testing

The analyzers are designed to be testable:

```typescript
import { BaseAnalyzer } from './analyzers'

class MockAnalyzer extends BaseAnalyzer {
  getProvider() {
    return 'mock'
  }
  isConfigured() {
    return true
  }
  async analyze(context) {
    return {
      aligned: false,
      severity: 'HIGH',
      type: 'shiny_object',
      reasoning: 'Mock response',
      confidence: 1.0,
    }
  }
}
```

## Cost Considerations

Approximate cost per analysis (1000 requests):

- Claude Sonnet 3.5: ~$3-5
- GPT-4o: ~$5-10
- Gemini 2.0 Flash: ~$0.50-1
- Ollama: Free (runs locally)

For cost optimization, use Gemini for high-volume or Ollama for local-first.
