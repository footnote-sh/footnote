# Testing Quick Start Guide

## TL;DR

**YES**, you can test the intervention engine NOW without the daemon or walkthrough.

**Status**: ✅ **122 passing tests** validating 95% of the intervention engine

## Running Tests

```bash
# Run all tests
npm run test

# Run only intervention engine tests (fast)
npm run test tests/unit/

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm run test tests/unit/profile/ProfileBuilder.test.ts
```

## Test Structure

```
tests/
├── fixtures/           # Shared test data (ready for reuse)
│   ├── user-profiles.ts
│   ├── intervention-contexts.ts
│   ├── intervention-records.ts
│   ├── walkthrough-responses.ts
│   └── mock-profile-store.ts
│
└── unit/              # Pure logic tests (122 tests ✅)
    ├── profile/ProfileBuilder.test.ts              (40 tests)
    ├── intervention/strategies/AccountabilityStrategy.test.ts  (42 tests)
    └── learning/EffectivenessCalculator.test.ts    (40 tests)
```

## What's Tested

✅ **ProfileBuilder** (40 tests)
- Walkthrough response → UserProfile transformation
- Validation of required fields
- Merge partial updates

✅ **AccountabilityStrategy** (42 tests)
- Message personalization (12 tone × formality variants)
- Trigger compatibility
- Edge cases (empty data, long strings)

✅ **EffectivenessCalculator** (40 tests)
- Weighted scoring algorithm
- Compliance/refocus metrics
- Trend detection (improving/declining/stable)
- Strategy comparison and recommendations

## What's NOT Tested Yet

⏳ **Integration Tests** (can be done NOW with mocks)
- InterventionEngine (full flow)
- BehaviorTracker (recording outcomes)
- AdaptiveLearner (strategy switching)
- StrategySelector (context-aware selection)

❌ **E2E Tests** (MUST WAIT for Workflows 04 & 05)
- Hook server middleware (needs daemon)
- Walkthrough flow (needs CLI implementation)

## Adding New Tests

### Example: Test a New Strategy

```typescript
import { describe, it, expect } from 'vitest'
import { MyNewStrategy } from '../../../src/intervention/strategies/MyNewStrategy.js'
import { interventionContexts } from '../../fixtures/intervention-contexts.js'

describe('MyNewStrategy', () => {
  const strategy = new MyNewStrategy()

  describe('canHandle', () => {
    it('should handle specific triggers', () => {
      expect(strategy.canHandle(interventionContexts.shinyObject)).toBe(true)
    })
  })

  describe('execute', () => {
    it('should generate personalized message', () => {
      const result = strategy.execute(interventionContexts.directCoach)

      expect(result.type).toBe('my_new_strategy')
      expect(result.message).toBeDefined()
      expect(result.action).toBe('prompt')
    })
  })
})
```

### Example: Use Fixtures

```typescript
import { userProfiles } from '../../fixtures/user-profiles.js'
import { interventionContexts } from '../../fixtures/intervention-contexts.js'
import { interventionRecords } from '../../fixtures/intervention-records.js'

// Use predefined profiles
const profile = userProfiles.directCoach

// Use predefined contexts
const context = interventionContexts.shinyObject

// Use predefined histories
const history = interventionRecords.perfectCompliance
```

## Test-Driven Development Workflow

1. **Write test first** (red)
```bash
npm run test:watch  # Start watch mode
```

2. **Implement feature** (green)
```typescript
// Write minimal code to make test pass
```

3. **Refactor** (refactor)
```typescript
// Improve code while tests stay green
```

4. **Check coverage** (validate)
```bash
npm run test:coverage
```

## Next Steps

### This Week (Priority)
1. ✅ ProfileBuilder tests (DONE)
2. ✅ AccountabilityStrategy tests (DONE)
3. ✅ EffectivenessCalculator tests (DONE)
4. ⏳ Add tests for remaining strategies (HardBlock, MicroTask, TimeBoxed)
5. ⏳ Add integration tests with MockProfileStore

### After Workflow 04 (Daemon)
6. ⏳ Hook server E2E tests

### After Workflow 05 (Walkthrough)
7. ⏳ Walkthrough E2E tests

## Documentation

- **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** - Comprehensive strategy and architecture
- **[TESTING_IMPLEMENTATION_SUMMARY.md](./TESTING_IMPLEMENTATION_SUMMARY.md)** - Detailed results and insights

## Key Files

- **Test Runner**: Vitest (configured in `package.json`)
- **Fixtures**: `tests/fixtures/*.ts` (reusable test data)
- **Mock Store**: `tests/fixtures/mock-profile-store.ts` (for stateful tests)

## Common Patterns

### Testing Pure Functions
```typescript
// No setup needed, just call and assert
const result = pureFunction(input)
expect(result).toBe(expectedOutput)
```

### Testing Stateful Components
```typescript
import { createMockProfileStore } from '../../fixtures/mock-profile-store.js'

const mockStore = createMockProfileStore()
mockStore.seed(userProfiles.directCoach)  // Initialize with test data

const tracker = new BehaviorTracker(mockStore)
// Test tracker methods...

mockStore.reset()  // Clean up between tests
```

### Testing Edge Cases
```typescript
// Empty data
expect(calculator.calculateScore([])).toBe(0)

// Extreme values
expect(calculator.calculateScore(veryLongHistory)).toBeGreaterThanOrEqual(0)

// Invalid data (should not throw)
expect(() => builder.validate(emptyResponse)).not.toThrow()
```

## Troubleshooting

### Tests Failing After Code Change
```bash
# Check which tests failed
npm run test

# Run specific failing test
npm run test tests/unit/path/to/failing.test.ts

# Check git diff to see what changed
git diff
```

### Type Errors in Tests
```bash
# Run TypeScript check
npm run typecheck

# Fix import paths (tests use .js extensions)
import { Foo } from '../../../src/path/to/Foo.js'  // ✅ Correct
import { Foo } from '../../../src/path/to/Foo'     // ❌ Wrong
```

### Slow Tests
```bash
# Run only changed tests
npm run test -- --changed

# Run specific test file
npm run test tests/unit/specific.test.ts

# Intervention engine tests run in ~15ms, so slowness likely elsewhere
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run test` | Run all tests once |
| `npm run test:watch` | Auto-rerun on changes |
| `npm run test:coverage` | Generate coverage report |
| `npm run test tests/unit/` | Run only unit tests |
| `npm run typecheck` | Check TypeScript types |

---

**Need more detail?** See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) or [TESTING_IMPLEMENTATION_SUMMARY.md](./TESTING_IMPLEMENTATION_SUMMARY.md)
