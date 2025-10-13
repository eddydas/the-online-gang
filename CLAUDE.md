# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Online Gang** is a cooperative P2P multiplayer card game (2-8 players) where players use token trading to communicate hand strength. Built with vanilla JavaScript, peer.js, and TDD methodology.

**Tech Stack:**
- Vanilla JavaScript (ES6+) - no frameworks, no transpiling
- peer.js for P2P WebRTC connections
- Vitest for testing
- JSDoc + TypeScript for type safety (validation only, no compilation)
- Target: Safari (iOS, macOS, Vision Pro)

## Development Commands

### Testing
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode (re-runs on file changes)
npm run test:coverage       # Coverage report (80% threshold)

# Run specific test file
npm test -- tests/deck.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create a deck"
```

### Type Checking
```bash
npm run typecheck          # Type check all JS files (no emit)
npm run lint               # Alias for typecheck
```

### Coverage Requirements
- **Sprint 1:** >80% (game logic)
- **Sprint 2-3:** >75% (with UI/animations)
- **Sprint 4:** >90% (production)

## Architecture & Game Logic

### Game Mechanics (Critical to Understand)

**Cooperative Win Condition:**
- ALL players must correctly select tokens (1 to N) matching their hand strength
- Everyone wins together or loses together
- **Critical edge case:** Players with identical hands (same rank AND kickers) can swap tokens and still win

**Token Trading System:**
- Players select numbered tokens from central pool
- **Token stealing:** Players can take tokens from others (core communication mechanic)
- Conflict resolution: timestamp-based (earlier selection wins)
- 4 turns with full token history tracking

**Game Flow:**
```
LOBBY (initial join only)
  ↓
CARD_DEAL → READY_UP → TOKEN_TRADING → TURN_COMPLETE
    ↑                                         ↓
    └──────────── (repeat 4 turns) ──────────┘
                          ↓ (after turn 4)
                       END_GAME
                          ↓
            "Ready for Next Game" button
                          ↓
                   (back to CARD_DEAL)
```

**Important:** Game does NOT return to lobby after END_GAME. Uses "Ready for Next Game" button for seamless continuous play.

### P2P Architecture (peer.js)

**Host Authority Model:**
- First player (host) is the single source of truth
- Host generates shareable link with peer ID
- Clients connect via URL parameter
- All state mutations happen on host, then broadcast to clients
- State sync: `host → all clients` (unidirectional)

**Deferred to Post-MVP:**
- Reconnection logic
- Session persistence
- Host/client disconnect recovery

### Type Safety Pattern (JSDoc + TypeScript)

All JavaScript files must follow this pattern:

```javascript
// @ts-check

/**
 * @typedef {Object} Card
 * @property {string} rank - Card rank (2-10, J, Q, K, A)
 * @property {string} suit - Card suit (♠, ♥, ♦, ♣)
 */

/**
 * Shuffles a deck using Fisher-Yates algorithm
 * @param {Card[]} deck - The deck to shuffle
 * @returns {Card[]} The shuffled deck (new array, original unchanged)
 */
function shuffleDeck(deck) { /* ... */ }
```

- `@ts-check` directive at top of every file
- `@typedef` for all data structures
- Type all function parameters and return values
- TypeScript compiler validates but doesn't compile (noEmit: true)

### Core Data Structures (To Implement)

**GameState:**
```javascript
/**
 * @typedef {Object} GameState
 * @property {string} phase - LOBBY | CARD_DEAL | READY_UP | TOKEN_TRADING | TURN_COMPLETE | END_GAME
 * @property {number} turn - Current turn (1-4)
 * @property {Player[]} players - All players (2-8)
 * @property {Card[]} deck - Shuffled deck
 * @property {Card[]} communityCards - Shared cards (max 5)
 * @property {Token[]} tokens - Available tokens (1 to N)
 * @property {'blue'|'red'} cardBackColor - Randomized once per game
 */
```

**Player:**
```javascript
/**
 * @typedef {Object} Player
 * @property {string} id - Unique peer ID
 * @property {string} name - Display name (max 20 chars)
 * @property {Card[]} holeCards - 2 private cards
 * @property {number|null} currentToken - Selected token number
 * @property {number[]} tokenHistory - Tokens per turn (length 4)
 * @property {boolean} isReady - Ready state
 * @property {boolean} isHost - Host flag
 * @property {string} emoji - Avatar emoji
 */
```

**HandResult:**
```javascript
/**
 * @typedef {Object} HandResult
 * @property {number} rank - Hand rank (1-10, higher = better)
 * @property {string} name - "High Card" | "Pair" | "Two Pair" | ... | "Royal Flush"
 * @property {Card[]} bestFive - Best 5 cards from 7 available
 * @property {number[]} tiebreakers - Kicker values for comparison
 * @property {string} description - Full hand description
 */
```

### Poker Hand Rankings (1-10)
1. High Card
2. Pair
3. Two Pair
4. Three of a Kind
5. Straight
6. Flush
7. Full House
8. Four of a Kind
9. Straight Flush
10. Royal Flush

**Kicker Logic:** When comparing hands of same rank, use tiebreaker array (e.g., A-A-K beats A-A-Q because K > Q).

## TDD Workflow (MANDATORY)

**For every feature:**
1. Write failing test first
2. Run test (confirm red)
3. Write minimal code to pass
4. Run test (confirm green)
5. Refactor
6. Run test (confirm still green)
7. **BEFORE COMMIT:** Run both verification commands:
   - `npm test` - All tests must pass
   - `npm run typecheck` - No TypeScript errors allowed
8. Commit only when both pass

**Test file location:** `tests/[module].test.js`

**Example pattern:**
```javascript
// tests/poker.test.js
import { evaluateHand } from '../src/browser/poker.js';

describe('Poker Hand Evaluation', () => {
  test('should recognize a pair of Aces', () => {
    const hand = [
      { rank: 'A', suit: '♠' },
      { rank: 'A', suit: '♥' },
      // ... 5 more cards
    ];
    const result = evaluateHand(hand);
    expect(result.name).toBe('Pair');
    expect(result.rank).toBe(2);
  });
});
```

**CRITICAL: Always verify before commit:**
```bash
npm test              # Must pass
npm run typecheck     # Must have no errors
git add ...
git commit ...
```

## Implementation Rules

### Build for N Players from Day 1
- ❌ Don't: Build for 2 players, then scale to 8
- ✅ Do: Build for 2-8 players from start (use dynamic N everywhere)

### End-Game Table is CORE (Sprint 1)
- **Not polish** - essential feature in first sprint
- Shows: 4 token history columns + 7 cards + hand description
- Turn 4 tokens highlighted (green = correct, red = incorrect)
- WIN/LOSS banner at top

### Ready-Up from Day 1
- ❌ Don't: Build host-controlled flow, then replace
- ✅ Do: Implement ready-up system immediately

### Proper HTML Structure from Day 1
- ❌ Don't: Build ugly then redesign
- ✅ Do: Semantic HTML from start, style in Sprint 2
- Cards as `<div>`, tokens as `<button>`, proper table structure

## Edge Cases to Remember

1. **Tied hands can swap tokens:** Players with identical hands (A-A-K-Q-J vs A-A-K-Q-J) can have either token order and still win
2. **Late joiners:** Show lobby screen, wait for current game to finish (can't join mid-game)
3. **Token stealing:** Uses timestamp conflict resolution (earlier selection wins)
4. **Card back color:** Randomized once per game (blue or red), not per card
5. **Host authority:** All state changes must originate from host
6. **No return to lobby:** After END_GAME, use "Ready for Next Game" button (seamless continuous play, not "Play Again")

## Current Sprint

**Sprint 1:** Core Game Engine + End Game (Week 1-2)

**Completed:**
- ✅ Test infrastructure (Vitest)
- ✅ Type safety (JSDoc + TypeScript)
- ✅ Deck module (100% coverage, fully typed)

**Next Steps (see `docs/sprints/sprint-1.md`):**
1. Poker hand evaluation (TDD)
2. Token system (TDD)
3. Win/loss determination (TDD)
4. P2P connection setup
5. Game state machine (TDD)
6. Lobby system
7. End-game summary table

## Documentation

- **Requirements:** `docs/REQUIREMENTS.md` - Complete game specifications (ALWAYS check this file for feature requirements)
- **Testing Guide:** `docs/TESTING.md` - TDD workflow and Vitest patterns
- **Type Safety:** `docs/TYPE_SAFETY.md` - JSDoc patterns and examples
- **Sprint Planning:** `docs/sprints/README.md` - Sprint index and goals
- **Current Sprint:** `docs/sprints/sprint-1.md` - Detailed tasks

**Important:** All requirements and specifications should be documented in `docs/REQUIREMENTS.md`. When implementing any feature, always reference this file first to ensure compliance with the defined specifications.

## Git Configuration

Already configured:
- Email: `eddydas@gmail.com`
- Name: `Eddy Wong`
- GPG signing: `false`

Commit message format:
```
Brief description of changes

- Detailed point 1
- Detailed point 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
- Never push to remote git unless explicitly asked to do so. Always run test and type check for any code changes, and fix up errors as needed. Do not import within type annotations.