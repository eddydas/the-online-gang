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
