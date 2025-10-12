# The Online Gang - Testing Guide

## Test Infrastructure

### Framework
- **Vitest** - Modern testing framework with native ES6 module support, built on Vite

### Directory Structure
```
theeddygang2/
├── src/                 # Source code
│   └── deck.js         # Example: Deck module
├── tests/              # Test files
│   └── deck.test.js    # Example: Deck tests
├── vitest.config.js    # Vitest configuration
└── package.json        # npm scripts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Coverage Goals

- **Sprint 1:** >80% coverage for game logic
- **Sprint 2:** >75% coverage (including UI)
- **Sprint 3:** >75% coverage (including animations)
- **Sprint 4:** >90% overall coverage

### Coverage Thresholds (configured in vitest.config.js)
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## TDD Workflow

### 1. Write failing test
```javascript
test('should create a deck with 52 cards', () => {
  const deck = createDeck();
  expect(deck).toHaveLength(52);
});
```

### 2. Run test (should fail)
```bash
npm test
```

### 3. Write minimal code to pass
```javascript
function createDeck() {
  const deck = [];
  // ... implementation
  return deck;
}
```

### 4. Run test (should pass)
```bash
npm test
```

### 5. Refactor and repeat

## Example: Deck Module Tests

The deck module (`src/deck.js`) demonstrates:
- ✅ Unit tests for pure functions
- ✅ Testing return values and data structures
- ✅ Testing edge cases and constraints
- ✅ Probabilistic testing (shuffle, randomization)

### Test Categories Covered:
1. **createDeck()**
   - Returns 52 cards
   - 13 cards per suit
   - 4 cards per rank
   - All cards unique
   - Correct card structure

2. **shuffleDeck()**
   - Maintains deck length
   - Doesn't modify original
   - Contains same cards
   - Produces different order
   - No duplicates

3. **randomizeCardBackColor()**
   - Returns valid color (blue/red)
   - Probabilistic variation

## Writing Good Tests

### Do's ✅
- Test one thing per test
- Use descriptive test names
- Test edge cases
- Test error conditions
- Keep tests independent
- Use setup/teardown when needed

### Don'ts ❌
- Don't test implementation details
- Don't write brittle tests
- Don't skip error cases
- Don't rely on test execution order

## CI/CD Integration (Future)

Tests will run automatically on:
- Pre-commit (git hooks)
- Pull request
- Main branch push
- Pre-deployment

## Common Vitest Matchers

```javascript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: value });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
```

## Mocking with Vitest

Vitest provides `vi` for mocking:

```javascript
// Mock functions
const mockFn = vi.fn();

// Mock implementation
mockFn.mockReturnValue(42);
mockFn.mockImplementation(() => 'result');

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg);
```

## Next Steps

1. Run `npm test` to verify setup
2. Check test coverage: `npm run test:coverage`
3. Begin TDD cycle for next feature

