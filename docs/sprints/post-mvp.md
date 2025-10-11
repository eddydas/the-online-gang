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
