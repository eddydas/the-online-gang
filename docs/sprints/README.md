# The Online Gang - Sprint Planning

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

## Sprint Documents

### [Sprint 1: Core Game Engine + End Game](./sprint-1.md) (Week 1-2)
**Goal:** Complete playable game with win/loss determination and basic end-game table

**Key Deliverables:**
- ✅ Test infrastructure (Vitest)
- ✅ Card system with poker hand evaluation
- ✅ Token system with trading mechanics
- ✅ Win/loss determination
- ✅ Functional end-game summary table
- ✅ P2P connection (peer.js)
- ✅ Game state machine
- ✅ Basic lobby system

**Coverage:** >80% for game logic

---

### [Sprint 2: Visual Design & UX](./sprint-2.md) (Week 3)
**Goal:** Make it look like a professional game

**Key Deliverables:**
- ✅ Poker table layout (green felt, wood border)
- ✅ Card visual design (minimalist face, checker backs)
- ✅ Token visual design (poker chips with stars)
- ✅ UI components styling
- ✅ End-game summary table styling
- ✅ Responsive design (mobile + desktop)

**Coverage:** >75%

---

### [Sprint 3: Animations & Sound](./sprint-3.md) (Week 4)
**Goal:** Make it feel smooth and engaging

**Key Deliverables:**
- ✅ Card dealing animations (0.6s, staggered)
- ✅ Token selection/stealing animations
- ✅ End-game table card fly-in animations
- ✅ Sound system (pitch variation on tokens)
- ✅ Avatar system (20 fun emojis)
- ✅ Mute/unmute functionality

**Coverage:** >75%

---

### [Sprint 4: Enhanced Features & Polish](./sprint-4.md) (Week 5)
**Goal:** Add essential features and prepare for production

**Key Deliverables:**
- ✅ Hand strength assistant (yellow highlights)
- ✅ Poker hand ranking guide modal
- ✅ Game history timeline (green/red dots)
- ✅ Copy game link button
- ✅ Rules menu modal
- ✅ Comprehensive integration testing
- ✅ Mobile optimization
- ✅ Bug fixes and performance tuning

**Coverage:** >90% overall

---

### [Post-MVP: Deferred Features](./post-mvp.md)
**Features deferred to after initial release:**
- Reconnection & persistence (host/client disconnect recovery)
- Advanced host controls (kick player functionality)
- Accessibility features (keyboard nav, screen reader)
- Additional polish and optimizations

---

## Quick Reference

### Test Coverage Goals
- **Sprint 1:** >80% (game logic)
- **Sprint 2:** >75% (with UI)
- **Sprint 3:** >75% (with animations)
- **Sprint 4:** >90% (final)

### Key Milestones
- **Week 2:** Fully functional game (ugly but working)
- **Week 3:** Professional-looking game
- **Week 4:** Polished with animations and sound
- **Week 5:** Production-ready with all features

### TDD Workflow
1. Write failing test
2. Run test (red)
3. Write minimal code
4. Run test (green)
5. Refactor
6. Repeat

---

## Navigation
- [Overview](./00-overview.md)
- [Sprint 1](./sprint-1.md) - Core Engine
- [Sprint 2](./sprint-2.md) - Visual Design
- [Sprint 3](./sprint-3.md) - Animations & Sound
- [Sprint 4](./sprint-4.md) - Polish & Testing
- [Post-MVP](./post-mvp.md) - Future Features
