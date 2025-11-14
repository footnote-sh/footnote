# Testing Strategy: Intervention Engine (Workflow 03)

## Executive Summary

**YES, you can test 95% of the intervention engine NOW**, before workflows 04 (daemon) and 05 (walkthrough) are implemented.

**Reason**: The intervention engine is architecturally well-designed with:
- Pure function strategies (no side effects)
- Clear separation of concerns
- Dependency injection for state management
- Testable interfaces throughout

## Testing Pyramid for Intervention Engine

```
         ┌─────────────────┐
         │  E2E Tests (5%) │  ← Requires daemon + walkthrough
         │  Hook server    │
         └─────────────────┘
               ▲
               │
      ┌────────────────────┐
      │ Integration (20%)  │  ← Test NOW with mocks
      │ Full engine flows  │
      └────────────────────┘
               ▲
               │
    ┌──────────────────────────┐
    │   Unit Tests (75%)       │  ← Test NOW, no dependencies
    │   Pure logic functions   │
    └──────────────────────────┘
```

## What Can Be Tested NOW (Before Workflows 04 & 05)

### ✅ Tier 1: Pure Logic (75% of system) - TEST FIRST
These components have ZERO external dependencies:

1. **ProfileBuilder** (`src/profile/ProfileBuilder.ts`)
   - `fromWalkthrough()` - transformation logic
   - `validate()` - validation rules
   - `merge()` - merge logic
   - **No dependencies on walkthrough implementation**

2. **Intervention Strategies** (4 files in `src/intervention/strategies/`)
   - `canHandle()` - conditional logic
   - `execute()` - message generation
   - Message personalization (tone × formality matrix)
   - **Pure functions, fully testable**

3. **EffectivenessCalculator** (`src/learning/EffectivenessCalculator.ts`)
   - `calculateScore()` - scoring algorithm
   - `calculateMetrics()` - metric computations
   - `calculateTrend()` - trend analysis
   - `compareStrategies()` - comparison logic
   - `needsAdjustment()` - threshold logic
   - `recommendStrategy()` - recommendation algorithm
   - **Pure functions with no I/O**

4. **FindTheFun** (`src/intervention/FindTheFun.ts`)
   - Reframing approach selection
   - Message personalization
   - **Pure transformation logic**

5. **InterventionFormatter** (`src/intervention/InterventionFormatter.ts`)
   - Format for different channels (CLI, notification, log)
   - **Pure formatting logic**

### ✅ Tier 2: Stateful Components with Mock Store (20%) - TEST NOW
These require ProfileStore, but we can mock it:

6. **BehaviorTracker** (`src/learning/BehaviorTracker.ts`)
   - All methods testable with mock ProfileStore
   - Test logic, not storage implementation

7. **AdaptiveLearner** (`src/learning/AdaptiveLearner.ts`)
   - Strategy switching logic
   - Threshold-based decisions

8. **StrategySelector** (`src/learning/StrategySelector.ts`)
   - Context-based selection
   - Effectiveness-based selection

9. **InterventionEngine** (`src/intervention/InterventionEngine.ts`)
   - Full intervention flow
   - Strategy selection → execution → formatting

### ❌ Tier 3: Integration Tests (5%) - WAIT for Workflows 04 & 05
These require actual daemon and walkthrough:

10. **Hook Server Middleware** (`src/daemon/hook-server/middleware/intervention.ts`)
    - Requires running daemon
    - Requires real-time app activity monitoring
    - **DEFER until Workflow 04**

11. **End-to-End Flows**
    - Walkthrough → Profile creation → Intervention
    - **DEFER until Workflow 05**

## Test File Structure

```
tests/
├── fixtures/
│   ├── user-profiles.ts           # Sample UserProfile objects
│   ├── intervention-contexts.ts   # Sample InterventionContext objects
│   ├── intervention-records.ts    # Sample InterventionRecord arrays
│   └── walkthrough-responses.ts   # Sample WalkthroughResponse objects
│
├── unit/
│   ├── profile/
│   │   └── ProfileBuilder.test.ts         # Priority 1
│   │
│   ├── intervention/
│   │   ├── strategies/
│   │   │   ├── AccountabilityStrategy.test.ts    # Priority 2
│   │   │   ├── HardBlockStrategy.test.ts
│   │   │   ├── MicroTaskStrategy.test.ts
│   │   │   └── TimeBoxedStrategy.test.ts
│   │   │
│   │   ├── FindTheFun.test.ts             # Priority 3
│   │   └── InterventionFormatter.test.ts  # Priority 4
│   │
│   └── learning/
│       ├── EffectivenessCalculator.test.ts  # Priority 5
│       ├── BehaviorTracker.test.ts          # Priority 6 (mock ProfileStore)
│       ├── AdaptiveLearner.test.ts          # Priority 7
│       └── StrategySelector.test.ts         # Priority 8
│
├── integration/
│   ├── InterventionEngine.test.ts         # Priority 9 (full flow with mocks)
│   └── LearningSystem.test.ts             # Priority 10 (tracking → calculation → adaptation)
│
└── e2e/
    ├── hook-server.test.ts                # DEFER: Requires Workflow 04
    └── walkthrough-to-intervention.test.ts # DEFER: Requires Workflow 05
```

## Testing Priority Order

### Phase 1: Core Pure Logic (Test TODAY)
```
1. ProfileBuilder         → Validates data transformation
2. AccountabilityStrategy → Reference implementation for all strategies
3. EffectivenessCalculator → Critical for learning system
4. InterventionFormatter  → Message output validation
```

**Why this order?**
- ProfileBuilder is the entry point (all other tests need valid profiles)
- AccountabilityStrategy is simplest, serves as template
- EffectivenessCalculator has complex math (high bug risk)
- Formatter ensures output is correct

### Phase 2: Remaining Strategies & Utilities (Test TODAY)
```
5. HardBlockStrategy
6. MicroTaskStrategy
7. TimeBoxedStrategy
8. FindTheFun
```

### Phase 3: Stateful Components (Test TODAY with mocks)
```
9. BehaviorTracker (mock ProfileStore)
10. StrategySelector
11. AdaptiveLearner
```

### Phase 4: Integration (Test TODAY with comprehensive mocks)
```
12. InterventionEngine (full intervention flow)
13. LearningSystem (tracking → effectiveness → adaptation)
```

### Phase 5: E2E (DEFER to Workflows 04 & 05)
```
14. Hook server middleware
15. Walkthrough-to-intervention flow
```

## Coverage Goals

| Component Type | Target Coverage | Rationale |
|---------------|----------------|-----------|
| **Pure Logic** | 95%+ | No excuse for gaps, fully deterministic |
| **Strategies** | 100% | Critical user-facing behavior |
| **Learning System** | 90%+ | Complex math, high-value testing |
| **Integration** | 80%+ | Covers main paths with mocks |
| **E2E** | 60%+ | Happy paths + critical errors (defer) |

**Overall Target**: 85%+ line coverage, 80%+ branch coverage

## Mock Strategy

### ProfileStore Mock (Required for BehaviorTracker, AdaptiveLearner)

```typescript
// tests/fixtures/mock-profile-store.ts
export class MockProfileStore {
  private interventionHistory: InterventionRecord[] = []

  addInterventionRecord(record: InterventionRecord): void {
    this.interventionHistory.push(record)
  }

  getInterventionHistory(): InterventionRecord[] {
    return this.interventionHistory
  }

  reset(): void {
    this.interventionHistory = []
  }
}
```

### Why This Works
- **No filesystem I/O**: Tests run fast
- **No race conditions**: Predictable behavior
- **Easy assertions**: Full control over state
- **No cleanup needed**: Each test gets fresh mock

### What NOT to Mock
- Pure functions (ProfileBuilder, EffectivenessCalculator, Strategies)
- Type transformations
- Math calculations
- String formatting

**Rule**: Only mock I/O boundaries (ProfileStore). Test everything else with real implementations.

## Key Test Scenarios

### ProfileBuilder
```typescript
✓ Valid walkthrough response → complete UserProfile
✓ Missing required fields → validation errors
✓ Merge partial updates → preserves existing fields
✓ All procrastination pattern combinations
✓ All communication style combinations
```

### Strategies
```typescript
✓ Message personalization: 4 tones × 3 formalities = 12 variants each
✓ canHandle() logic for different contexts
✓ Metadata generation (time limits, micro-tasks, etc.)
✓ Edge cases: empty commitments, long activity names
```

### EffectivenessCalculator
```typescript
✓ Empty history → score of 0
✓ Perfect compliance (100% complied) → high score
✓ High override rate → low score
✓ Fast refocus time → higher score than slow
✓ Trend detection: improving vs declining vs stable
✓ Strategy comparison and ranking
✓ Recommendation logic (20% improvement threshold)
```

### BehaviorTracker
```typescript
✓ Record intervention → appears in history
✓ Get history by strategy → filtered correctly
✓ Get history by trigger → filtered correctly
✓ Compliance rate calculation
✓ Average refocus time calculation
✓ Strategy rejection detection (threshold: 70%)
✓ Trigger frequency analysis
```

### InterventionEngine (Integration)
```typescript
✓ Context + Profile → selects correct strategy
✓ Strategy execution → formatted output
✓ Different triggers → different strategy selection
✓ User profile preferences → affect strategy choice
✓ Learning disabled → uses primary strategy
✓ Learning enabled → adapts over time
```

## Running Tests

```bash
# Run all tests
npm run test

# Watch mode (recommended during development)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/profile/ProfileBuilder.test.ts

# Run specific test suite
npx vitest run --grep "ProfileBuilder"

# Run only unit tests
npx vitest run tests/unit

# Run only integration tests
npx vitest run tests/integration
```

## Test Development Workflow

### For Each Component:
1. **Write fixtures first** (sample data in `/tests/fixtures/`)
2. **Write happy path test** (validates core functionality)
3. **Write edge cases** (empty inputs, boundaries, invalid data)
4. **Write error cases** (missing data, type mismatches)
5. **Check coverage** (`npm run test:coverage`)
6. **Refactor tests** (DRY, clear assertions)

### Test Naming Convention
```typescript
describe('ProfileBuilder', () => {
  describe('fromWalkthrough', () => {
    it('should create complete UserProfile from valid response', () => {})
    it('should initialize empty intervention history', () => {})
    it('should set current strategy to primary intervention', () => {})
  })

  describe('validate', () => {
    it('should return valid for complete response', () => {})
    it('should return missing fields for incomplete response', () => {})
    it('should validate nested patterns object', () => {})
  })
})
```

**Pattern**: `should [expected behavior] when [condition]`

## Dependencies for Testing

### Already Installed
- ✅ Vitest (test runner)
- ✅ TypeScript (type checking in tests)

### May Need to Add
```bash
# If not already installed:
npm install -D @vitest/coverage-v8   # For coverage reports
```

### No Additional Mocking Libraries Needed
- Vitest has built-in mocking (`vi.fn()`, `vi.mock()`)
- We'll use simple mock classes for ProfileStore
- No need for complex mocking frameworks

## Benefits of Testing NOW

### 1. **Fast Feedback Loop**
- Catch bugs before they compound
- Validate logic before integration
- Refactor with confidence

### 2. **Living Documentation**
- Tests show how to use each component
- Examples of all edge cases
- Clear expected behavior

### 3. **Easier Integration**
- When workflows 04 & 05 are ready, we know the core works
- Integration bugs will be in the new code, not the intervention engine
- Faster debugging

### 4. **Design Validation**
- Tests reveal if interfaces are awkward
- Early feedback on API design
- Opportunity to improve before integration

### 5. **Regression Prevention**
- Safe refactoring as requirements evolve
- Confidence when adding features
- Automated validation of changes

## What Tests CAN'T Do (Yet)

### Without Workflow 04 (Daemon):
- ❌ Test real-time app activity monitoring
- ❌ Test hook server middleware with actual traffic
- ❌ Test intervention triggers from real app switches

### Without Workflow 05 (Walkthrough):
- ❌ Test interactive walkthrough flow
- ❌ Test profile creation from real user input
- ❌ Test validation UI/UX

**But**: We can create fixtures that simulate the data these workflows will produce, so we're ready for integration when they arrive.

## Next Steps

### Immediate (Today):
1. Create fixtures (`tests/fixtures/`)
2. Write ProfileBuilder tests (Priority 1)
3. Write AccountabilityStrategy tests (Priority 2)
4. Write EffectivenessCalculator tests (Priority 3)

### This Week:
5. Complete all strategy tests
6. Complete all learning system tests
7. Write integration tests with mocks

### After Workflows 04 & 05:
8. Add E2E tests for hook server
9. Add E2E tests for walkthrough flow
10. Integration smoke tests

## Success Criteria

✅ **Phase 1 Complete When**:
- 95%+ coverage on pure logic components
- All strategies tested with all tone/formality combinations
- EffectivenessCalculator validated with edge cases
- CI/CD passes consistently

✅ **Phase 2 Complete When**:
- 85%+ overall coverage
- Integration tests passing with mocked ProfileStore
- BehaviorTracker and AdaptiveLearner validated
- Learning system end-to-end flow tested

✅ **Phase 3 Complete When** (Post-workflows 04 & 05):
- Hook server E2E tests passing
- Walkthrough-to-intervention flow validated
- Real-world usage tested
- 90%+ total coverage

## Questions & Answers

**Q: Can we meaningfully test without the daemon?**
A: YES. 95% of the intervention engine is pure logic that doesn't need runtime monitoring.

**Q: Can we meaningfully test without the walkthrough?**
A: YES. We create fixtures with sample `WalkthroughResponse` objects. ProfileBuilder doesn't care if they came from a real walkthrough or a fixture.

**Q: What's the ROI of testing now vs waiting?**
A: High ROI. Testing now catches bugs early, validates design, and gives confidence. Waiting means debugging integration issues that could have been prevented.

**Q: How do we handle ProfileStore dependency?**
A: Simple mock class. ProfileStore is just a thin wrapper around file I/O. We test the I/O separately, mock it in component tests.

**Q: What if requirements change during workflows 04/05?**
A: Tests make refactoring safer. If we need to change interfaces, tests show exactly what breaks and where.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing TypeScript](https://github.com/goldbergyoni/javascript-testing-best-practices#section-0-the-golden-rule)
- [Test Pyramid Pattern](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**TL;DR**: Test 95% NOW (pure logic + mocked state). Defer 5% E2E until workflows 04 & 05. Start with ProfileBuilder → Strategies → Learning System → Integration. Aim for 85%+ coverage.
