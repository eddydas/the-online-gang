# The Online Gang - TDD Fast-Track MVP Plan

## Overview
**Approach: Test-Driven Development from Day 1**
- Write tests first, then implementation
- Unit tests for all game logic
- End-game table is CORE, not polish
- Front-load functionality, defer only visual polish

**Timeline:** 5 weeks to production-ready MVP
**Team Size:** 1-2 developers
**Platform:** Web (Safari primary)

---

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

## Sprint 2: Visual Design & UX (Week 3)

### Sprint Goal
**Make it look like a professional game**

### Issues

#### 2.1 Poker Table Layout
- **Priority:** HIGH
- **Estimate:** 8 hours
- **Tasks:**
  - Green felt table with wood border
  - Gray background with watermark
  - Circular player positioning around table
  - Responsive layout (desktop + mobile vertical table)
  - Proper spacing and visual hierarchy
  - Players positioned left on mobile

#### 2.2 Card Visual Design
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - Minimalist card face (rank + suit only)
  - Checker pattern card backs (use game's randomized color)
  - Face-up/face-down states
  - Red/black suit colors
  - High contrast for mobile
  - Proper card sizing (responsive)

#### 2.3 Token Visual Design
- **Priority:** HIGH
- **Estimate:** 8 hours
- **Tasks:**
  - Poker chip UI (circular)
  - Star patterns for numbers (1-8 stars, distinguishable layouts)
  - Turn-based colors (white/yellow/orange/red)
  - Turn-based stripes (1/2/3/4 stripes)
  - Token pool center layout
  - Token history display per player
  - "Taken by X" placeholder styling

#### 2.4 UI Components Styling
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - Top bar (menu, help, mute buttons with icons)
  - Phase indicator styling (prominent, clear)
  - Player avatar areas (emoji placeholders)
  - Copy link button (host only, prominent)
  - Hand strength text display styling
  - "Ready" button styling
  - Lobby UI polish

#### 2.5 End-Game Summary Table Styling
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - Table styling (displayed on poker table surface)
  - Column headers and borders
  - Green/red highlighting for token validation
  - WIN/LOSS banner styling (prominent)
  - Responsive table layout for mobile
  - Proper typography and spacing

#### 2.6 Visual Testing
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - Visual regression testing setup (optional)
  - CSS-only tests (layout, responsive breakpoints)
  - Safari rendering verification
  - Mobile viewport testing
  - Color contrast validation

### **Sprint 2 Deliverable:**
✅ Game looks professional and polished
✅ All UI elements properly styled
✅ Responsive design works on mobile
✅ No animations yet, but visually complete
✅ Presentable to stakeholders

---

## Sprint 3: Animations & Sound (Week 4)

### Sprint Goal
**Make it feel smooth and engaging**

### Issues

#### 3.1 Card Animations
- **Priority:** HIGH
- **Estimate:** 8 hours
- **Tasks:**
  - Card dealing animation (deck → destination, 0.6s)
  - Card flip animation (back → face)
  - Staggered dealing (0.1-0.15s delays between cards)
  - Smooth CSS transitions
  - **Tests:** Animation completion callbacks

#### 3.2 Token Animations
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - Token selection (pool → player, 0.6s)
  - Token stealing (player → player, 0.6s)
  - Placeholder appear/disappear
  - Hover effects
  - **Tests:** Animation state management

#### 3.3 End-Game Table Animations
- **Priority:** MEDIUM
- **Estimate:** 6 hours
- **Tasks:**
  - Cards fly from poker table into summary table positions
  - Card flip on reveal
  - Staggered card animations
  - WIN/LOSS banner appear animation
  - Smooth table transition

#### 3.4 Sound System (TDD)
- **Priority:** MEDIUM
- **Estimate:** 6 hours
- **Tests First:**
  - ✅ Play sound on token selection
  - ✅ Pitch variation based on token number (higher = higher pitch)
  - ✅ Mute/unmute state persistence
  - ✅ Sound queue management
- **Implementation:**
  - Token selection sound with pitch variation
  - Mute/unmute toggle
  - Audio context setup
  - Optional: card deal sounds
  - Session-based mute preference

#### 3.5 Avatar System
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - Create 20 fun emoji pool
  - Random emoji assignment on join
  - Randomize button in lobby (only when not ready)
  - Display emoji with player name
  - **Tests:** Random selection, uniqueness (optional)

#### 3.6 Animation Testing
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - Performance testing (60fps target)
  - Mobile animation smoothness
  - Animation callback tests
  - Timing validation

### **Sprint 3 Deliverable:**
✅ Smooth 60fps animations
✅ Engaging sound effects
✅ Avatar system complete
✅ Game feels polished and professional

---

## Sprint 4: Enhanced Features & Polish (Week 5)

### Sprint Goal
**Add essential features and prepare for production**

### Issues

#### 4.1 Hand Strength Assistant (TDD)
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tests First:**
  - ✅ Identify cards in best 5-card hand
  - ✅ Update when community cards revealed
  - ✅ Correct hand name display
- **Implementation:**
  - Yellow border on cards in best hand
  - Hand name text above cards
  - Real-time updates per turn
  - Highlight both hole and community cards

#### 4.2 Poker Hand Ranking Guide
- **Priority:** HIGH
- **Estimate:** 4 hours
- **Tasks:**
  - "?" button in top bar
  - Modal with all 10 poker hand rankings
  - Visual examples for each hand
  - Mobile-friendly modal
  - Accessible during all game phases
  - **Tests:** Modal open/close, content rendering

#### 4.3 Game History System (TDD)
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tests First:**
  - ✅ Track win/loss per game
  - ✅ Display last 20 games (dots)
  - ✅ Calculate total wins/losses
  - ✅ Reset on session end
- **Implementation:**
  - Visual timeline (green/red dots)
  - "X out of Y games won" text
  - Session-based tracking (no persistence)
  - Display in top bar

#### 4.4 Copy Game Link (Host)
- **Priority:** HIGH
- **Estimate:** 3 hours
- **Tasks:**
  - Prominent "Copy Game Link" button (always visible to host)
  - Copy to clipboard functionality
  - Success feedback (toast/checkmark)
  - Works in lobby and during game
  - **Tests:** Clipboard API integration

#### 4.5 Rules Menu
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - Menu button in top bar
  - Modal with comprehensive game rules
  - How to play instructions
  - Token trading explanation
  - Win/loss conditions
  - Mobile-friendly modal

#### 4.6 Integration Testing
- **Priority:** CRITICAL
- **Estimate:** 12 hours
- **Tasks:**
  - End-to-end game flow tests (2, 4, 8 players)
  - All win scenarios (correct tokens)
  - All loss scenarios (incorrect tokens)
  - Tie scenarios (identical hands)
  - Token trading edge cases
  - Late joiner flow
  - Play multiple consecutive games
  - **Goal:** >90% test coverage overall

#### 4.7 Mobile Optimization & Testing
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - Safari iOS testing (iPhone, iPad)
  - Touch interaction optimization
  - Vertical table layout refinement
  - Performance profiling (60fps validation)
  - Font scaling for readability
  - Vision Pro Safari testing (if available)

#### 4.8 Bug Fixes & Performance
- **Priority:** HIGH
- **Estimate:** 8 hours
- **Tasks:**
  - Fix issues discovered in testing
  - Performance optimization (state sync, rendering)
  - Memory leak checks
  - Network latency handling
  - Error boundaries for graceful failures

### **Sprint 4 Deliverable:**
✅ All essential features complete
✅ Comprehensive test coverage (>90%)
✅ No critical bugs
✅ Smooth performance on mobile Safari
✅ Production-ready for real users
✅ Fully documented codebase

---

## DEFERRED to Post-MVP (Future Sprints)

### Reconnection & Persistence
- Host disconnect/reconnect (30-min localStorage window)
- Client disconnect/reconnect with state restoration
- Session persistence across page refreshes
- Network interruption recovery

### Advanced Host Controls
- Kick player functionality
- Game abandonment on kick
- Player timeout handling

### Additional Features
- Accessibility (keyboard navigation, screen reader support)
- Advanced error recovery
- Performance optimization for low-end devices
- Additional sound effects variety
- In-game chat/emotes
- Tutorial mode

---

## Test-Driven Development Workflow

### For Each Feature:
1. **Write failing test** - Define expected behavior
2. **Run test** - Confirm it fails (red)
3. **Write minimal code** - Make test pass
4. **Run test** - Confirm it passes (green)
5. **Refactor** - Improve code quality
6. **Run test** - Confirm still passes (green)
7. **Commit** - Save working code

### Test Categories:
- **Unit Tests:** Game logic, poker evaluation, state management
- **Integration Tests:** P2P communication, game flow, multi-player scenarios
- **UI Tests:** Component rendering, user interactions (optional)
- **E2E Tests:** Full game walkthroughs (Sprint 4)

### Coverage Goals:
- Sprint 1: >80% coverage (game logic)
- Sprint 2: Maintain >75% (new UI code)
- Sprint 3: Maintain >75% (animation logic)
- Sprint 4: >90% overall coverage

---

## Risk Management

### Deferred Risks (Acceptable for MVP)
- **Reconnection failures** → Users refresh to rejoin
- **Host disconnect** → Game ends, start new session
- **Network issues** → Accept occasional drops

### Critical Risks (Must Address)
- **Poker hand bugs** → TDD catches edge cases early
- **State sync issues** → Integration tests validate P2P
- **Mobile performance** → Continuous testing from Sprint 2

---

## Success Metrics

### Sprint 1 (Week 2)
- [ ] 8 players complete full game end-to-end
- [ ] Win/loss correctly determined
- [ ] End-game table displays results
- [ ] >80% test coverage for game logic

### Sprint 2 (Week 3)
- [ ] Game looks professional
- [ ] Mobile layout works
- [ ] Visual design complete

### Sprint 3 (Week 4)
- [ ] Animations at 60fps
- [ ] Sound system works
- [ ] Feels polished

### Sprint 4 (Week 5)
- [ ] All features complete
- [ ] >90% test coverage
- [ ] No critical bugs
- [ ] Production-ready

---

## Day 1 Kickoff (8 hours)

### Morning (4 hours)
1. **Project setup** (1h)
   - Create index.html, app.js, styles.css, tests/
   - Add peer.js CDN
   - Configure test framework

2. **TDD: Deck creation** (3h)
   - Write tests for 52-card deck
   - Implement deck generation
   - Write shuffle tests
   - Implement Fisher-Yates shuffle

### Afternoon (4 hours)
3. **TDD: Poker hand evaluation basics** (4h)
   - Write tests for pair detection
   - Implement pair logic
   - Write tests for two pair
   - Implement two pair logic

**Day 1 Goal:** Test infrastructure running, deck system tested and working

---

## Timeline Summary

- **Week 1-2:** Core engine + end-game table (functional, tested)
- **Week 3:** Professional visual design
- **Week 4:** Animations and sound polish
- **Week 5:** Enhanced features, full testing, production-ready

**Total: 5 weeks to production MVP with >90% test coverage**
