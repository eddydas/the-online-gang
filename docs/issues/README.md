# Sprint 1 Issues - Core Game Engine + End Game

**Sprint Goal:** Complete playable game with win/loss determination and basic end-game table

**Timeline:** Week 1-2
**Target Coverage:** >80% for game logic

---

## Issue Overview

### Issue 1.2: Card System (TDD)
**File:** `1.2-card-system.md`
**Priority:** CRITICAL
**Estimate:** 12 hours
**Status:** TODO

Implement card deck with dealing functionality (2 hole + 5 community cards).

---

### Issue 1.3: Poker Hand Evaluation (TDD)
**File:** `1.3-poker-evaluation.md`
**Priority:** CRITICAL
**Estimate:** 12 hours
**Status:** TODO

Recognize all 10 poker hands, compare with kickers, detect ties.

---

### Issue 1.4: Token System (TDD)
**File:** `1.4-token-system.md`
**Priority:** CRITICAL
**Estimate:** 10 hours
**Status:** TODO

Token selection, stealing, conflict resolution, history tracking.

---

### Issue 1.5: Win/Loss Determination (TDD)
**File:** `1.5-win-loss-determination.md`
**Priority:** CRITICAL
**Estimate:** 10 hours
**Status:** TODO

Validate tokens against hand rankings, handle ties (critical edge case).

---

### Issue 1.6: End-Game Summary Table (UI)
**File:** `1.6-end-game-table.md`
**Priority:** CRITICAL
**Estimate:** 8 hours
**Status:** TODO

Display results table after Turn 4 (CORE feature, no animations).

---

### Issue 1.7: P2P Foundation (peer.js)
**File:** `1.7-p2p-foundation.md`
**Priority:** CRITICAL
**Estimate:** 8 hours
**Status:** TODO

Set up P2P with host authority, support 2-8 players.

---

### Issue 1.8: Game State Machine (TDD)
**File:** `1.8-game-state-machine.md`
**Priority:** CRITICAL
**Estimate:** 10 hours
**Status:** TODO

Phase transitions, turn progression, ready-up logic.

---

### Issue 1.9: Turn Flow UI
**File:** `1.9-turn-flow-ui.md`
**Priority:** CRITICAL
**Estimate:** 8 hours
**Status:** TODO

Ready-up phase, token trading phase, turn completion UI.

---

### Issue 1.10: Lobby System
**File:** `1.10-lobby-system.md`
**Priority:** CRITICAL
**Estimate:** 6 hours
**Status:** TODO

Player join, name input, ready toggle, start game button.

---

## Total Estimate: 84 hours

## Dependencies

```
1.2 (Cards) ──┐
              ├─→ 1.3 (Poker) ──┐
              │                  │
              │                  ├─→ 1.5 (Win/Loss) ──┐
              │                  │                      │
1.4 (Tokens) ─┴──────────────────┘                      │
                                                         │
1.7 (P2P) ──────────────────────────────────────────────┤
                                                         │
1.8 (State Machine) ─────────────────────────────────────┤
                                                         │
                              ┌──────────────────────────┘
                              │
                              ├─→ 1.9 (Turn Flow UI)
                              │
                              ├─→ 1.10 (Lobby UI)
                              │
                              └─→ 1.6 (End Game Table)
```

## Recommended Order

1. **1.2 - Card System** (foundation)
2. **1.3 - Poker Evaluation** (depends on cards)
3. **1.4 - Token System** (parallel with poker)
4. **1.5 - Win/Loss** (depends on poker + tokens)
5. **1.7 - P2P Foundation** (can be parallel)
6. **1.8 - Game State Machine** (integrates all logic)
7. **1.10 - Lobby System** (depends on P2P + state)
8. **1.9 - Turn Flow UI** (depends on state)
9. **1.6 - End-Game Table** (depends on win/loss + state)

---

## Sprint 1 Deliverables

- ✅ 2-8 players complete full games end-to-end
- ✅ All game logic tested (TDD)
- ✅ Win/loss determination works correctly
- ✅ End-game summary table shows results (no polish)
- ✅ Ugly but fully functional with proper HTML structure
- ✅ Test coverage >80% for game logic

---

## Notes

- **Test coverage:** Issue 1.1 (Test Infrastructure) already complete
- **Type safety:** All issues must use JSDoc + TypeScript
- **TDD approach:** Write tests before implementation
- **No animations:** Deferred to Sprint 3
- **Basic styling only:** Full polish in Sprint 2
