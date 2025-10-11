# Type Safety in Vanilla JavaScript

## Overview

This project uses **JSDoc with TypeScript type checking** to achieve type safety without compilation or build steps.

## How It Works

### 1. JSDoc Type Annotations
We use JSDoc comments to define types:

```javascript
// @ts-check  // Enable type checking for this file

/**
 * @typedef {Object} Card
 * @property {string} rank - Card rank (2-10, J, Q, K, A)
 * @property {string} suit - Card suit (♠, ♥, ♦, ♣)
 */

/**
 * Creates a standard 52-card deck
 * @returns {Card[]} Array of card objects
 */
function createDeck() {
  /** @type {Card[]} */
  const deck = [];
  // ...
  return deck;
}
```

### 2. TypeScript Compiler for Validation
TypeScript compiler (`tsc`) validates types without emitting any JavaScript:

```bash
npm run typecheck
```

### 3. VS Code IntelliSense
VS Code automatically provides:
- ✅ Auto-completion
- ✅ Type hints
- ✅ Error highlighting
- ✅ Parameter info
- ✅ Go to definition

## Configuration Files

### tsconfig.json
Main TypeScript configuration for type checking:
- `allowJs: true` - Allow JavaScript files
- `checkJs: true` - Type check JavaScript
- `noEmit: true` - Don't compile, just validate
- `strict: true` - Strict type checking

### jsconfig.json
VS Code-specific configuration for editor support:
- Enables IntelliSense in VS Code
- Provides better autocomplete
- Same settings as tsconfig.json

## Type Checking Commands

```bash
# Check types across all source files
npm run typecheck

# Or use it as part of linting
npm run lint
```

## JSDoc Cheat Sheet

### Basic Types
```javascript
/** @type {string} */
const name = "Player 1";

/** @type {number} */
const score = 100;

/** @type {boolean} */
const isActive = true;

/** @type {string[]} */
const names = ["Alice", "Bob"];
```

### Type Definitions
```javascript
/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {Card[]} hand
 */
```

### Union Types
```javascript
/**
 * @typedef {'blue' | 'red'} CardBackColor
 */

/** @type {'pending' | 'ready' | 'playing'} */
let gameState = 'pending';
```

### Function Types
```javascript
/**
 * @param {Card[]} deck - The deck to shuffle
 * @returns {Card[]} The shuffled deck
 */
function shuffleDeck(deck) {
  // ...
}

/**
 * @callback DealCallback
 * @param {Card} card
 * @returns {void}
 */

/**
 * @param {DealCallback} callback
 */
function dealCards(callback) {
  // ...
}
```

### Readonly Types
```javascript
/** @type {ReadonlyArray<string>} */
const RANKS = ['2', '3', '4', ..., 'K', 'A'];
```

### Complex Types
```javascript
/**
 * @typedef {Object} GameState
 * @property {Player[]} players
 * @property {Card[]} deck
 * @property {Card[]} communityCards
 * @property {number} currentTurn
 * @property {'lobby' | 'playing' | 'complete'} phase
 */
```

### Type Imports (for shared types)
```javascript
/**
 * @typedef {import('./deck').Card} Card
 */
```

## Example: Type-Safe Card Operations

### Definition (deck.js)
```javascript
// @ts-check

/**
 * @typedef {Object} Card
 * @property {string} rank
 * @property {string} suit
 */

/**
 * @param {Card[]} deck
 * @returns {Card}
 */
function dealCard(deck) {
  const card = deck.pop();
  if (!card) {
    throw new Error('Deck is empty');
  }
  return card;
}
```

### Usage
```javascript
const deck = createDeck();
const card = dealCard(deck);

// VS Code knows card.rank and card.suit exist
console.log(card.rank);  // ✅ Auto-complete works
console.log(card.color); // ❌ Error: Property 'color' does not exist
```

## Benefits

### ✅ Type Safety
- Catch errors before runtime
- Prevent typos in property names
- Ensure function parameters are correct

### ✅ Better Developer Experience
- IntelliSense and autocomplete
- Inline documentation
- Easier refactoring

### ✅ No Build Step
- Still vanilla JavaScript
- No compilation required
- Works directly in browser

### ✅ Progressive Adoption
- Add types gradually
- Mix typed and untyped code
- Start with critical modules

## Testing with Types

Types work seamlessly with Jest:

```javascript
const { createDeck } = require('../src/deck');

test('should create properly typed deck', () => {
  const deck = createDeck();

  // TypeScript validates these assertions
  expect(deck[0]).toHaveProperty('rank');
  expect(deck[0]).toHaveProperty('suit');
});
```

## Common Patterns

### Optional Properties
```javascript
/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {Card[]} [hand] - Optional property
 */
```

### Nullable Types
```javascript
/**
 * @param {Card | null} card
 * @returns {string}
 */
function getCardName(card) {
  if (!card) return 'No card';
  return `${card.rank}${card.suit}`;
}
```

### Generic Arrays
```javascript
/**
 * @template T
 * @param {T[]} array
 * @param {number} count
 * @returns {T[]}
 */
function takeFirst(array, count) {
  return array.slice(0, count);
}
```

## Enforcing Type Checks

### Per-File Enforcement
Add `// @ts-check` at the top of each file:

```javascript
// @ts-check

function myFunction() {
  // Type checking enabled
}
```

### Project-Wide Enforcement
In `jsconfig.json`:
```json
{
  "compilerOptions": {
    "checkJs": true  // Check all JS files by default
  }
}
```

### Disable for Specific Lines
```javascript
// @ts-ignore
const x = functionWithoutTypes();

// @ts-expect-error
const y = somethingThatWillFail();
```

## Pre-commit Hook (Future)

Add type checking to git hooks:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run typecheck && npm test"
    }
  }
}
```

## Resources

- [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TypeScript without TypeScript](https://fettblog.eu/typescript-jsdoc-superpowers/)
- [Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

## Next Steps

1. Add types to all new modules (poker.js, gameState.js, etc.)
2. Run `npm run typecheck` before commits
3. Use types in test files for better assertions
4. Export type definitions for shared types
