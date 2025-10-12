# The Online Gang 🎮

A peer-to-peer multiplayer cooperative card game built with vanilla JavaScript and peer.js. Players work together to correctly assess their poker hand strengths through token trading.

## 🎯 Game Overview

**The Online Gang** is a cooperative Texas Hold'em-style game where 2-8 players must correctly rank their hands by selecting numbered tokens. The twist: token trading is the only way to communicate hand strength!

- **Cooperative gameplay:** Everyone wins or everyone loses
- **No server required:** Fully peer-to-peer using WebRTC
- **Cross-platform:** Works on Safari (iOS, macOS, Vision Pro) and Chrome

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd theeddygang2

# Install dependencies
npm install
```

## 🧪 Running Tests

This project follows **Test-Driven Development (TDD)** practices with comprehensive test coverage.

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
Automatically re-runs tests when files change (great for development):
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Type Check JavaScript Files
We use JSDoc + TypeScript for type safety without compilation:
```bash
npm run typecheck
```

Expected output:
```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total

----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |     100 |      100 |     100 |     100 |
 deck.js  |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|
```

### Test Coverage Goals
- **Sprint 1:** >80% coverage (game logic)
- **Sprint 2-3:** >75% coverage
- **Sprint 4:** >90% overall coverage

## 📁 Project Structure

```
theeddygang2/
├── src/                    # Source code
│   └── deck.js            # Card deck module (example)
├── tests/                 # Test files
│   └── deck.test.js       # Deck module tests (example)
├── demo.html              # Visual mockup for presentations
├── vitest.config.js       # Vitest test configuration
├── package.json           # Dependencies and scripts
├── REQUIREMENTS.md        # Complete game requirements
├── TDD_MVP_PLAN.md       # Development sprint plan (5 weeks)
├── TESTING.md            # Testing guide and best practices
└── README.md             # This file
```

## 🛠️ Development Workflow (TDD)

### 1. Write a Failing Test
```javascript
// tests/poker.test.js
test('should recognize a pair of Aces', () => {
  const hand = [
    { rank: 'A', suit: '♠' },
    { rank: 'A', suit: '♥' },
    // ...
  ];
  const result = evaluateHand(hand);
  expect(result.ranking).toBe('Pair');
});
```

### 2. Run Tests (Watch It Fail)
```bash
npm test
```

### 3. Write Minimal Code to Pass
```javascript
// src/poker.js
function evaluateHand(hand) {
  // Implementation here
  return { ranking: 'Pair' };
}
```

### 4. Run Tests (Watch It Pass)
```bash
npm test
```

### 5. Refactor and Repeat

## 📚 Documentation

### Core Documentation
- **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)** - Complete game requirements and specifications
- **[docs/TESTING.md](docs/TESTING.md)** - Comprehensive testing guide
- **[docs/TYPE_SAFETY.md](docs/TYPE_SAFETY.md)** - JSDoc type safety guide (TypeScript-like types without compilation)

### Sprint Planning
- **[docs/sprints/README.md](docs/sprints/README.md)** - Sprint overview and index
- **[docs/sprints/sprint-1.md](docs/sprints/sprint-1.md)** - Sprint 1: Core Engine (Week 1-2)
- **[docs/sprints/sprint-2.md](docs/sprints/sprint-2.md)** - Sprint 2: Visual Design (Week 3)
- **[docs/sprints/sprint-3.md](docs/sprints/sprint-3.md)** - Sprint 3: Animations (Week 4)
- **[docs/sprints/sprint-4.md](docs/sprints/sprint-4.md)** - Sprint 4: Polish (Week 5)
- **[docs/sprints/post-mvp.md](docs/sprints/post-mvp.md)** - Post-MVP features

## 🎨 Visual Demo

Open `demo.html` in Safari to see a visual mockup of the game (non-functional, for presentation purposes).

## 🧑‍💻 Development Status

**Current Sprint:** Sprint 1 - Core Game Engine + End Game (Week 1-2)

### Completed
- ✅ Test infrastructure setup (Vitest)
- ✅ Example deck module with 100% coverage
- ✅ Project structure and documentation

### Next Steps
- [ ] Poker hand evaluation (TDD)
- [ ] Token system (TDD)
- [ ] Win/loss determination (TDD)
- [ ] P2P connection setup
- [ ] Basic UI implementation

## 🤝 Contributing

### Code Style
- Vanilla JavaScript (ES6+)
- No transpiling (Babel-free)
- No frameworks (React, Vue, etc.)
- Test-first development (TDD)

### Git Workflow
```bash
# Run tests before committing
npm test

# Ensure coverage meets threshold
npm run test:coverage
```

## 📋 npm Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Type check JavaScript files with TypeScript |
| `npm run lint` | Run type checking (alias for typecheck) |

## 🎯 Key Features

- **Peer-to-peer:** No server needed, direct WebRTC connections
- **2-8 players:** Scalable from small to large groups
- **Cooperative:** Everyone wins together or loses together
- **Token trading:** Unique communication mechanic
- **Mobile-first:** Optimized for Safari on iOS and Vision Pro
- **Fully tested:** >90% code coverage target

## 📄 License

ISC

## 🙏 Acknowledgments

Built with [peer.js](https://peerjs.com/) for P2P connectivity.

---

**Ready to start developing?** Run `npm test` to verify your setup!
