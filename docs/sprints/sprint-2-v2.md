# Sprint 2 v2: Visual Polish + Essential UX Features

## Sprint Goal
**Transform the functional MVP into a polished, user-friendly game experience**

---

## Current State Assessment

### ✅ What's Complete (Sprint 1)
- Core game engine (deck, poker evaluation, token system)
- Win/loss determination with tie handling
- P2P multiplayer (2-8 players)
- Game state machine (phase transitions, turn flow)
- End-game summary table (functional but unstyled)
- Lobby system (basic)
- Basic ready-up and turn progression

### ❌ What's Missing (Critical Gaps)
1. **Visual Design:** Game looks functional but unpolished
2. **Animations:** No card dealing, token movement, or transition animations
3. **Sound Effects:** No audio feedback
4. **UI Polish:** Menu, help, mute buttons missing
5. **Hand Strength Assistant:** No yellow highlighting or hand name display
6. **Poker Rankings Guide:** No "?" button for hand rankings reference
7. **Game History:** No win/loss tracking visualization
8. **Avatar System:** Generic "Player X" names, no emoji avatars
9. **Copy Link UX:** Missing prominent share functionality
10. **Mobile Optimization:** Not tested/optimized for mobile Safari

---

## Sprint 2 v2 Plan (Week 3-4, ~80 hours)

### Phase 1: Visual Foundation (Week 3, Day 1-3)
**Goal:** Make the game look professional

#### 2.1 Poker Table & Layout Design
- **Priority:** CRITICAL
- **Estimate:** 10 hours
- **Tasks:**
  - [ ] Green felt poker table with wood border
  - [ ] Gray background with subtle "The Online Gang" watermark
  - [ ] Circular player positioning (desktop)
  - [ ] Vertical round table for mobile (players on left)
  - [ ] Proper spacing and visual hierarchy
  - [ ] Responsive breakpoints (mobile/tablet/desktop)
  - [ ] CSS Grid/Flexbox layout system

#### 2.2 Card Visual Design
- **Priority:** CRITICAL
- **Estimate:** 8 hours
- **Tasks:**
  - [ ] Minimalist card faces (rank + suit, high contrast)
  - [ ] Checker pattern card backs (blue/red randomized)
  - [ ] Face-up/face-down states
  - [ ] Red suits (♥ ♦) and black suits (♠ ♣) colors
  - [ ] Mobile-optimized sizing (legible on small screens)
  - [ ] Responsive card dimensions
  - [ ] Yellow border for "best five" highlighting

#### 2.3 Token Visual Design
- **Priority:** CRITICAL
- **Estimate:** 10 hours
- **Tasks:**
  - [ ] Poker chip UI (circular, 3D-like appearance)
  - [ ] Star patterns for numbers (1-8 stars, visually distinct layouts)
  - [ ] Turn-based outer ring colors:
    - Turn 1: White (1 stripe)
    - Turn 2: Yellow (2 stripes)
    - Turn 3: Orange (3 stripes)
    - Turn 4: Red (4 stripes)
  - [ ] Token pool layout (center of table)
  - [ ] Token history display per player (4 tokens visible)
  - [ ] "Taken by [Player]" placeholder styling
  - [ ] Hover/active states

#### 2.4 End-Game Summary Table Styling
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - [ ] Professional table design (displayed on poker surface)
  - [ ] Column headers and clean borders
  - [ ] Green highlight for correct tokens
  - [ ] Red highlight for incorrect tokens
  - [ ] Prominent WIN/LOSS banner (animated entrance)
  - [ ] Responsive table layout for mobile (scrollable if needed)
  - [ ] Typography and spacing polish
  - [ ] Mini card/token styling

---

### Phase 2: Essential UX Features (Week 3, Day 4-5)
**Goal:** Add missing critical UI elements

#### 2.5 Top Bar UI Components
- **Priority:** CRITICAL
- **Estimate:** 8 hours
- **Tasks:**
  - [ ] Top bar container (fixed position)
  - [ ] Menu button (☰ icon) → opens rules modal
  - [ ] Poker rankings button (? icon) → opens hand rankings modal
  - [ ] Mute/unmute button (🔊/🔇 icons)
  - [ ] Phase indicator (large, centered text)
  - [ ] Game history dots (green/red, last 20 games)
  - [ ] Win/loss counter text ("X out of Y games won")
  - [ ] Responsive layout for mobile

#### 2.6 Poker Hand Ranking Guide
- **Priority:** CRITICAL
- **Estimate:** 6 hours
- **Tasks:**
  - [ ] Modal component (overlay + content)
  - [ ] Display all 10 poker hand rankings:
    1. Royal Flush
    2. Straight Flush
    3. Four of a Kind
    4. Full House
    5. Flush
    6. Straight
    7. Three of a Kind
    8. Two Pair
    9. Pair
    10. High Card
  - [ ] Visual examples for each hand
  - [ ] Mobile-friendly modal (scrollable)
  - [ ] Close button (X) and click-outside-to-close
  - [ ] Accessible during all game phases

#### 2.7 Rules Menu Modal
- **Priority:** HIGH
- **Estimate:** 4 hours
- **Tasks:**
  - [ ] Modal component (reuse from 2.6)
  - [ ] Comprehensive game rules content:
    - How to play overview
    - Token trading explanation
    - Turn flow (4 turns: hole → flop → turn → river)
    - Win/loss conditions (cooperative success)
    - Tie handling rules
  - [ ] Plain language (no poker jargon)
  - [ ] Mobile-friendly layout

#### 2.8 Hand Strength Assistant
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - [ ] Real-time hand evaluation per turn
  - [ ] Yellow border highlight on cards in best 5-card hand
  - [ ] Hand name display above player's cards
    - Format: "Two Pair - Kings and 3s", "Flush - Hearts", etc.
  - [ ] Update when community cards are revealed
  - [ ] Highlight both hole cards and community cards
  - [ ] Mobile-optimized text sizing

---

### Phase 3: Avatar & Social Features (Week 4, Day 1-2)
**Goal:** Improve player identity and sharing

#### 2.9 Avatar System
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - [ ] Create emoji pool (20 fun, colorful emojis)
  - [ ] Random emoji assignment on player join
  - [ ] "Randomize" button in lobby (disabled when ready)
  - [ ] Display emoji + player name throughout game
  - [ ] Emoji visible in:
    - Lobby player list
    - Player avatars around table
    - End-game summary table
  - [ ] **Tests:** Random selection, no duplicates in same game

#### 2.10 Copy Game Link (Host)
- **Priority:** CRITICAL
- **Estimate:** 4 hours
- **Tasks:**
  - [ ] Prominent "Copy Game Link" button (host only)
  - [ ] Button visible in:
    - Lobby (pre-game)
    - During active gameplay (top bar or floating)
  - [ ] Clipboard API integration
  - [ ] Success feedback (✓ checkmark animation + "Copied!")
  - [ ] Fallback for older browsers (select text)
  - [ ] **Tests:** Clipboard write, success state

#### 2.11 Game History Tracking
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - [ ] Track win/loss per completed game
  - [ ] Visual timeline (green dots = win, red dots = loss)
  - [ ] Display last 20 games (dots in chronological order)
  - [ ] "X out of Y games won" summary text
  - [ ] Session-based tracking (reset on host disconnect)
  - [ ] Display in top bar (visible at all times)
  - [ ] **Tests:** Win/loss tracking, dot limit (20 max)

---

### Phase 4: Animations & Sound (Week 4, Day 3-5)
**Goal:** Make the game feel smooth and engaging

#### 2.12 Card Animations
- **Priority:** HIGH
- **Estimate:** 10 hours
- **Tasks:**
  - [ ] Deck visual element on table (card source)
  - [ ] Card dealing animation:
    - Fly from deck to destination (0.6s)
    - Flip animation (back → face)
    - Staggered delays (0.1-0.15s between cards)
  - [ ] Hole cards → player positions
  - [ ] Community cards → table center
  - [ ] End-game cards → summary table positions
  - [ ] CSS transitions/keyframes
  - [ ] **Tests:** Animation completion callbacks

#### 2.13 Token Animations
- **Priority:** HIGH
- **Estimate:** 8 hours
- **Tasks:**
  - [ ] Token selection animation (pool → player, 0.6s)
  - [ ] Token stealing animation (player → player, 0.6s)
  - [ ] Placeholder appear/disappear transitions
  - [ ] Hover effects (scale, glow)
  - [ ] Active state feedback
  - [ ] Smooth position transitions
  - [ ] **Tests:** Animation state management

#### 2.14 Sound System (TDD)
- **Priority:** MEDIUM
- **Estimate:** 8 hours
- **Tests First:**
  - [ ] Play sound on token selection/stealing
  - [ ] Pitch variation based on token strength change:
    - Higher pitch: Player took stronger token than last turn
    - Lower pitch: Player took weaker token than last turn
    - Neutral: Same strength or first turn
  - [ ] Mute/unmute state persistence (session)
  - [ ] Sound queue management (prevent overlap)
- **Implementation:**
  - [ ] Audio context setup (Web Audio API)
  - [ ] Token selection sound with pitch modulation
  - [ ] Mute/unmute toggle (persists in sessionStorage)
  - [ ] Optional: Card dealing sounds (if time permits)

---

## Testing & Quality Assurance

#### 2.15 Visual Regression & Mobile Testing
- **Priority:** CRITICAL
- **Estimate:** 8 hours
- **Tasks:**
  - [ ] Safari iOS testing (iPhone 12+, iPad)
  - [ ] Safari macOS testing (latest version)
  - [ ] Vision Pro Safari testing (if available)
  - [ ] Touch interaction validation
  - [ ] Responsive breakpoint verification
  - [ ] Font scaling and readability checks
  - [ ] Performance profiling (60fps target)
  - [ ] Network latency simulation (slow 3G)

#### 2.16 Bug Fixes & Polish
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - [ ] Fix issues discovered during testing
  - [ ] Animation performance optimization
  - [ ] Rendering performance (avoid reflows)
  - [ ] Memory leak checks
  - [ ] Error handling improvements
  - [ ] Edge case fixes

---

## Sprint 2 v2 Deliverables

### ✅ Must Have (Core Success Criteria)
- Professional visual design (poker table, cards, tokens)
- All UI components styled and polished
- Hand strength assistant (yellow highlights + hand name)
- Poker rankings guide (? button modal)
- Avatar system (emoji + player names)
- Copy game link button (host)
- Smooth animations (cards, tokens, transitions)
- Sound effects with mute toggle
- Mobile Safari optimization
- Responsive design (mobile/tablet/desktop)

### 🎯 Should Have (Important but Flexible)
- Game history visualization (dots + counter)
- Rules menu modal
- End-game table animations
- Additional sound effects
- Performance optimizations

### 📦 Deliverable Summary
At the end of Sprint 2 v2, the game should:
1. **Look professional** - polished UI matching high-quality game standards
2. **Feel smooth** - 60fps animations, responsive interactions
3. **Be user-friendly** - clear instructions, helpful guides, intuitive UX
4. **Work on mobile** - tested and optimized for Safari iOS
5. **Be ready for user testing** - polished enough to show real players

---

## Timeline Breakdown

### Week 3 (Days 1-5, ~40 hours)
- **Day 1-2:** Poker table, cards, tokens visual design (2.1, 2.2, 2.3)
- **Day 3:** End-game table styling + Top bar UI (2.4, 2.5)
- **Day 4:** Poker rankings guide + Rules menu (2.6, 2.7)
- **Day 5:** Hand strength assistant (2.8)

### Week 4 (Days 1-5, ~40 hours)
- **Day 1:** Avatar system + Copy link (2.9, 2.10)
- **Day 2:** Game history tracking (2.11)
- **Day 3-4:** Card & token animations (2.12, 2.13)
- **Day 5:** Sound system + Testing & polish (2.14, 2.15, 2.16)

---

## Risk Assessment & Mitigation

### High Risk Items
1. **Animations performance on mobile**
   - Mitigation: Use CSS transforms (GPU-accelerated), test early

2. **Sound API browser compatibility**
   - Mitigation: Web Audio API is well-supported; graceful degradation if needed

3. **Time constraints for all features**
   - Mitigation: Prioritize CRITICAL items first; defer MEDIUM items if needed

### Deferred to Sprint 3 (if needed)
- Advanced animations (particle effects, etc.)
- Additional sound varieties
- Complex visual effects
- Non-critical polish items

---

## Success Metrics

### Technical Metrics
- [ ] 60fps animations on iPhone 12+ (Safari iOS)
- [ ] <100ms UI response time for all interactions
- [ ] Zero critical bugs
- [ ] All CRITICAL tasks completed
- [ ] Responsive design works on 320px - 1920px viewports

### User Experience Metrics
- [ ] New players can understand game without explanation
- [ ] Poker rankings are accessible within 2 clicks
- [ ] Host can share game link within 3 seconds
- [ ] Token trading feels responsive and smooth
- [ ] Visual hierarchy guides players through each phase

### Quality Metrics
- [ ] Code passes type checking (`npm run typecheck`)
- [ ] No console errors in production build
- [ ] Lighthouse score >90 for Performance (mobile)
- [ ] Passes Safari rendering validation

---

## Notes for Team

1. **Focus on Mobile First:** Safari iOS is the primary target. Test early and often.

2. **Animation Performance:** Use `transform` and `opacity` for smooth 60fps animations. Avoid animating `width`, `height`, `top`, `left`.

3. **Sound Implementation:** Be mindful of autoplay policies. First sound must be triggered by user interaction.

4. **Accessibility Consideration:** While not a Sprint 2 requirement, use semantic HTML and consider keyboard navigation where possible.

5. **Test Coverage:** Maintain >80% test coverage for game logic (already achieved in Sprint 1). UI tests are optional but recommended for critical flows.

6. **Design Consistency:** Refer to REQUIREMENTS.md for color scheme (green felt, gray background) and visual theme guidelines.

---

## Handoff to Sprint 3

Sprint 3 will focus on:
- Advanced features (if any Sprint 2 items deferred)
- Reconnection & persistence (30-min localStorage window)
- Host controls (kick player, game abandonment)
- Production deployment & hosting
- Final bug fixes and optimization
