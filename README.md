# Footnote

> Main thought (not the footnotes).

A personalized ADHD intervention system for developers, founders, and product people.

---

## Status

🚧 **In Development** - Core foundation complete (v0.0.1)

### Completed
- ✅ CLI foundation
- ✅ State management
- ✅ Basic commands (focus, capture, check)
- ✅ TypeScript setup

### In Progress
- 🔄 Hook integration (AI assistant interception)
- 🔄 Intervention engine
- 🔄 App watcher daemon
- 🔄 Interactive walkthrough

---

## Quick Start

### Installation (Development)

```bash
# Clone repo
git clone https://github.com/footnote-sh/footnote
cd footnote

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link

# Initialize
footnote init
```

### Usage

```bash
# Set your main focus for today
footnote focus

# Capture a footnote (idea/task for later)
footnote capture "Add marketplace feature"

# Check current commitment
footnote check

# JSON output
footnote check --json
```

---

## What is Footnote?

Footnote helps ADHD brains stay focused on ONE main thing at a time.

### The Problem

You're debugging an email bug. It's tedious. Then you remember: "Oh! I should build that marketplace feature!"

The marketplace is exciting. You can picture the whole architecture. You open `marketplace.ts`.

**3 hours later**: The marketplace is half-done, the email bug is still broken, and you feel scattered.

### The Solution

Footnote stops you BEFORE you lose 3 hours:

1. **Morning**: Set your ONE main thought
   ```
   "Fix email rendering bug"
   ```

2. **10:30am**: You ask Claude Code, "Let's add a marketplace"
   - **Footnote intervenes**: "This doesn't match your commitment"
   - Options:
     - 🎯 Return to email bug
     - 📝 Capture as footnote (for later)
     - 🎨 Find the fun in email bug
     - ⚠️ Override (logs pattern)

3. **Result**: You capture the marketplace idea and return to the email bug. 3 hours saved.

### How It Works

1. **Hook-based**: Integrates with Claude Code, Gemini, Codex (catches AI requests)
2. **App-watching**: Monitors your activity (detects context switches)
3. **Personalized**: Learns what interventions work for YOUR brain
4. **Adaptive**: Quietly shifts strategies based on your behavior

---

## Architecture

### Components

1. **CLI** (`footnote`) - Daily commitment management
2. **Hook Server** (localhost:3040) - Intercepts AI coding requests
3. **App Watcher Daemon** - Monitors system activity
4. **Intervention Engine** - Personalized interventions
5. **Adaptive Learning** - Behavior-based strategy shifts

### Workflow

```
Morning: footnote focus
→ "Fix email bug"

10am: "Let's add marketplace" (in Claude Code)
→ Hook fires
→ Semantic analysis (AI)
→ Intervention (personalized)
→ User captures as footnote
→ Returns to focus
```

---

## Current State (v0.0.1)

### Working
- ✅ State management (commitments, profiles)
- ✅ CLI commands (focus, capture, check)
- ✅ TypeScript setup
- ✅ Build system

### Not Yet Implemented
- ❌ Hook server
- ❌ AI semantic analysis
- ❌ App watcher
- ❌ Intervention engine
- ❌ Adaptive learning
- ❌ Interactive walkthrough

---

## Development

### Project Structure

```
footnote/
├── src/
│   ├── cli/          # CLI commands
│   ├── daemon/       # Hook server & app watcher
│   ├── state/        # State management
│   ├── types/        # TypeScript types
│   └── utils/        # Utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── internal/
│   ├── workflows/    # Implementation workflows
│   └── plans/        # Design documents
└── templates/        # LaunchAgent, configs
```

### Scripts

```bash
npm run build          # Build with tsup
npm run dev            # Run with tsx
npm run test           # Run tests
npm run test:watch     # Watch mode
npm run typecheck      # Type check
npm run lint           # Lint code
```

### Implementation Roadmap

See `internal/IMPLEMENTATION_ROADMAP.md` for complete roadmap.

**Week 1-2**: Core foundation (✅ COMPLETE)
**Week 3-4**: Hook integration, intervention engine, app watcher (parallel)
**Week 5-6**: Walkthrough, integration testing
**Week 7-8**: UAT, launch prep

---

## Documentation

- [Implementation Roadmap](internal/IMPLEMENTATION_ROADMAP.md)
- [Design Document](internal/plans/2025-11-12-personalized-intervention-design.md)
- [Architecture (Hooks)](internal/architecture-hooks.md)
- [JTBD](internal/JTBD-footnote.md)

---

## License

SEE LICENSE IN LICENSE

---

## Author

J.N. Choi <jn@footnote.sh>

Website: https://footnote.sh
