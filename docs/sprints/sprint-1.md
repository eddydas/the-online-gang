## Sprint 1: Core Game Engine + End Game (Week 1-2) 🚀

### Sprint Goal
**Complete playable game with win/loss determination and basic end-game table**

### Issues

#### 1.1 Test Infrastructure Setup
- **Priority:** CRITICAL
- **Estimate:** 3 hours
- **Tasks:**
  - Set up testing framework (Jest or Mocha + Chai)
  - Configure test runner
  - Create test file structure (tests/ directory)
  - Set up assertion library
  - Configure code coverage reporting
  - Document TDD workflow

#### 1.2 Card System (TDD)
- **Priority:** CRITICAL
- **Estimate:** 12 hours
- **Tests First:**
  - ✅ Deck has 52 cards (13 ranks × 4 suits)
  - ✅ Shuffle randomizes order (no duplicates)
  - ✅ Deal 2 hole cards per player
  - ✅ Deal 3/1/1 community cards per turn
  - ✅ Card back color randomized per game (blue or red)
- **Implementation:**
  - 52-card deck creation
  - Fisher-Yates shuffle
  - Deal hole cards function
  - Deal community cards function
  - Deck randomization
- **Simple UI:** Cards as DIVs with text (proper HTML structure, minimal CSS)

#### 1.3 Poker Hand Evaluation (TDD)
- **Priority:** CRITICAL
- **Estimate:** 12 hours
- **Tests First:**
  - ✅ Recognize all 10 hand types (Royal Flush → High Card)
  - ✅ Find best 5 cards from 7 (2 hole + 5 community)
  - ✅ Compare hands correctly (High Card < Pair < Two Pair...)
  - ✅ Handle kickers for ties (e.g., A-A-K beats A-A-Q)
  - ✅ Detect identical hands (true ties)
  - ✅ Generate correct hand descriptions
- **Implementation:**
  - Hand ranking algorithm
  - Best 5-card selector
  - Hand comparison logic
  - Tie detection
  - Hand description generator

#### 1.4 Token System (TDD)
- **Priority:** CRITICAL
- **Estimate:** 10 hours
- **Tests First:**
  - ✅ Generate N tokens (where N = player count)
  - ✅ Token selection assigns to player
  - ✅ Token stealing transfers ownership
  - ✅ Conflict resolution (timestamp-based)
  - ✅ Token history tracking (4 turns)
  - ✅ Placeholder logic when stolen
- **Implementation:**
  - Token generation
  - Selection/stealing logic
  - Ownership tracking
  - History storage
  - Conflict resolution
- **Simple UI:** Buttons with numbers, basic ownership display

#### 1.5 Win/Loss Determination (TDD)
- **Priority:** CRITICAL
- **Estimate:** 10 hours
- **Tests First:**
  - ✅ Sort players by hand strength (strongest → weakest)
  - ✅ Detect correct token ordering (descending)
  - ✅ Handle tie scenarios (tied players can swap tokens)
  - ✅ Validate tokens for each turn (not just Turn 4)
  - ✅ Return win/loss result
  - ✅ Generate expected token order
- **Implementation:**
  - Player sorting by hand strength
  - Token order validation
  - Tie logic (players with same hand acceptable in either order)
  - Per-turn validation
  - Win/loss calculation

#### 1.6 End-Game Summary Table - FUNCTIONAL
- **Priority:** CRITICAL
- **Estimate:** 8 hours
- **Tasks:**
  - Build basic HTML table (no animations yet)
  - Display players sorted by hand strength
  - Show Columns 1-4: Token selections per turn
  - Show Column 5: All 7 cards (2 hole + 5 community)
  - Show Column 6: Hand description text
  - Highlight Turn 4 tokens (green = correct, red = incorrect)
  - Display WIN/LOSS message at top
  - "Play Again" button to reset
  - **NO ANIMATIONS** - instant display

#### 1.7 P2P Foundation
- **Priority:** CRITICAL
- **Estimate:** 8 hours
- **Tasks:**
  - Initialize peer.js (host creates peer)
  - Generate shareable link with peer ID
  - Client connection via URL parameter
  - Support N players (2-8) from day 1
  - Broadcast state updates (host → all clients)
  - Basic connection status indicator
  - **Tests:** Mock peer connections for state sync

#### 1.8 Game State Machine (TDD)
- **Priority:** CRITICAL
- **Estimate:** 10 hours
- **Tests First:**
  - ✅ State transitions: LOBBY → CARD_DEAL → READY_UP → TOKEN_TRADING → TURN_COMPLETE
  - ✅ Turn progression (1 → 2 → 3 → 4)
  - ✅ Ready-up logic (all players must ready)
  - ✅ Turn completion logic (all players proceed)
  - ✅ Game reset to lobby
- **Implementation:**
  - State structure (players, deck, cards, tokens, turn, phase)
  - Phase state machine
  - Ready-up tracking
  - Turn advancement
  - State broadcast (host authority)

#### 1.9 Turn Flow
- **Priority:** CRITICAL
- **Estimate:** 8 hours
- **Tasks:**
  - Implement ready-up phase (all players ready before trading)
  - Token trading phase
  - Turn complete phase (all players proceed to next turn)
  - Block turn progression if any player not ready/proceeded
  - Phase indicator text ("Press Ready when ready", "Take a token...", etc.)
  - **Tests:** Turn progression logic

#### 1.10 Lobby System
- **Priority:** CRITICAL
- **Estimate:** 6 hours
- **Tasks:**
  - Player name input (20 char max)
  - Ready/Unready toggle (locks name when ready)
  - Host "Start Game" button (min 2 players)
  - Player list display
  - Late joiner detection → show lobby, wait for next game
  - **Tests:** Player join/leave, ready states

### **Sprint 1 Deliverable:**
✅ 2-8 players complete full games end-to-end
✅ All game logic tested (TDD)
✅ Win/loss determination works correctly
✅ End-game summary table shows results (no polish)
✅ Ugly but fully functional with proper HTML structure
✅ Test coverage >80% for game logic

---

