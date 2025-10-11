// @ts-check
const { evaluateHand, compareHands } = require('../src/poker');

describe('Poker Hand Evaluation', () => {

  describe('Hand Type Recognition', () => {

    test('should recognize Royal Flush', () => {
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♠' },
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♠' },
        { rank: '10', suit: '♠' },
        { rank: '2', suit: '♥' },
        { rank: '3', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(10);
      expect(result.name).toBe('Royal Flush');
    });

    test('should recognize Straight Flush', () => {
      const cards = [
        { rank: '9', suit: '♥' },
        { rank: '8', suit: '♥' },
        { rank: '7', suit: '♥' },
        { rank: '6', suit: '♥' },
        { rank: '5', suit: '♥' },
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(9);
      expect(result.name).toBe('Straight Flush');
    });

    test('should recognize Four of a Kind', () => {
      const cards = [
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'K', suit: '♣' },
        { rank: '5', suit: '♠' },
        { rank: '3', suit: '♥' },
        { rank: '2', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(8);
      expect(result.name).toBe('Four of a Kind');
    });

    test('should recognize Full House', () => {
      const cards = [
        { rank: 'J', suit: '♠' },
        { rank: 'J', suit: '♥' },
        { rank: 'J', suit: '♦' },
        { rank: '4', suit: '♠' },
        { rank: '4', suit: '♣' },
        { rank: '2', suit: '♥' },
        { rank: '3', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(7);
      expect(result.name).toBe('Full House');
    });

    test('should recognize Flush', () => {
      const cards = [
        { rank: 'K', suit: '♦' },
        { rank: '10', suit: '♦' },
        { rank: '8', suit: '♦' },
        { rank: '6', suit: '♦' },
        { rank: '3', suit: '♦' },
        { rank: 'A', suit: '♠' },
        { rank: 'Q', suit: '♥' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(6);
      expect(result.name).toBe('Flush');
    });

    test('should recognize Straight', () => {
      const cards = [
        { rank: '9', suit: '♠' },
        { rank: '8', suit: '♥' },
        { rank: '7', suit: '♦' },
        { rank: '6', suit: '♣' },
        { rank: '5', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(5);
      expect(result.name).toBe('Straight');
    });

    test('should recognize Three of a Kind', () => {
      const cards = [
        { rank: '7', suit: '♠' },
        { rank: '7', suit: '♥' },
        { rank: '7', suit: '♦' },
        { rank: 'K', suit: '♣' },
        { rank: '5', suit: '♠' },
        { rank: '3', suit: '♥' },
        { rank: '2', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(4);
      expect(result.name).toBe('Three of a Kind');
    });

    test('should recognize Two Pair', () => {
      const cards = [
        { rank: 'Q', suit: '♠' },
        { rank: 'Q', suit: '♥' },
        { rank: '9', suit: '♦' },
        { rank: '9', suit: '♣' },
        { rank: '5', suit: '♠' },
        { rank: '3', suit: '♥' },
        { rank: '2', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(3);
      expect(result.name).toBe('Two Pair');
    });

    test('should recognize Pair', () => {
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'Q', suit: '♣' },
        { rank: 'J', suit: '♠' },
        { rank: '9', suit: '♥' },
        { rank: '7', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(2);
      expect(result.name).toBe('Pair');
    });

    test('should recognize High Card', () => {
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'Q', suit: '♦' },
        { rank: 'J', suit: '♣' },
        { rank: '9', suit: '♠' },
        { rank: '7', suit: '♥' },
        { rank: '5', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(1);
      expect(result.name).toBe('High Card');
    });
  });

  describe('Ace in Straights', () => {
    test('should recognize Ace-high straight (A-K-Q-J-10)', () => {
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'Q', suit: '♦' },
        { rank: 'J', suit: '♣' },
        { rank: '10', suit: '♠' },
        { rank: '2', suit: '♥' },
        { rank: '3', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(5);
      expect(result.name).toBe('Straight');
    });

    test('should recognize Ace-low straight (5-4-3-2-A)', () => {
      const cards = [
        { rank: '5', suit: '♠' },
        { rank: '4', suit: '♥' },
        { rank: '3', suit: '♦' },
        { rank: '2', suit: '♣' },
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'Q', suit: '♦' }
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(5);
      expect(result.name).toBe('Straight');
    });
  });

  describe('Kicker Logic', () => {
    test('should handle Pair with kickers (A-A-K beats A-A-Q)', () => {
      const hand1 = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'Q', suit: '♣' },
        { rank: 'J', suit: '♠' },
        { rank: '9', suit: '♥' },
        { rank: '7', suit: '♦' }
      ];
      const hand2 = [
        { rank: 'A', suit: '♣' },
        { rank: 'A', suit: '♦' },
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♥' },
        { rank: '10', suit: '♦' },
        { rank: '8', suit: '♣' },
        { rank: '6', suit: '♠' }
      ];

      const result1 = evaluateHand(hand1);
      const result2 = evaluateHand(hand2);

      expect(result1.rank).toBe(2); // Both are pairs
      expect(result2.rank).toBe(2);
      expect(compareHands(result1, result2)).toBeGreaterThan(0); // hand1 wins
    });

    test('should handle High Card with kickers', () => {
      const hand1 = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'Q', suit: '♦' },
        { rank: 'J', suit: '♣' },
        { rank: '8', suit: '♠' }, // Changed to 8
        { rank: '7', suit: '♥' },
        { rank: '5', suit: '♦' }
      ];
      const hand2 = [
        { rank: 'A', suit: '♣' },
        { rank: 'K', suit: '♦' },
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♥' },
        { rank: '7', suit: '♦' }, // Changed to 7
        { rank: '6', suit: '♣' },
        { rank: '4', suit: '♠' }
      ];

      const result1 = evaluateHand(hand1);
      const result2 = evaluateHand(hand2);

      expect(result1.rank).toBe(1); // Both high card
      expect(result2.rank).toBe(1);
      expect(compareHands(result1, result2)).toBeGreaterThan(0); // hand1 wins (A-K-Q-J-8 > A-K-Q-J-7)
    });
  });

  describe('Identical Hands Detection', () => {
    test('should detect identical Pair hands', () => {
      const hand1 = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'Q', suit: '♣' },
        { rank: 'J', suit: '♠' },
        { rank: '9', suit: '♥' },
        { rank: '7', suit: '♦' }
      ];
      const hand2 = [
        { rank: 'A', suit: '♣' },
        { rank: 'A', suit: '♦' },
        { rank: 'K', suit: '♠' },
        { rank: 'Q', suit: '♥' },
        { rank: 'J', suit: '♦' },
        { rank: '8', suit: '♣' },
        { rank: '6', suit: '♠' }
      ];

      const result1 = evaluateHand(hand1);
      const result2 = evaluateHand(hand2);

      expect(result1.rank).toBe(2);
      expect(result2.rank).toBe(2);
      expect(compareHands(result1, result2)).toBe(0); // Identical
    });
  });

  describe('Best 5 Cards from 7', () => {
    test('should select best 5 cards for Flush', () => {
      const cards = [
        { rank: 'A', suit: '♦' },
        { rank: 'K', suit: '♦' },
        { rank: 'Q', suit: '♦' },
        { rank: 'J', suit: '♦' },
        { rank: '9', suit: '♦' },
        { rank: '7', suit: '♦' }, // 6 diamonds
        { rank: '2', suit: '♠' }
      ];

      const result = evaluateHand(cards);
      expect(result.rank).toBe(6); // Flush
      expect(result.bestFive).toHaveLength(5);

      // Should select A-K-Q-J-9 (highest 5)
      const bestRanks = result.bestFive.map(c => c.rank).sort();
      expect(bestRanks).toContain('A');
      expect(bestRanks).toContain('K');
      expect(bestRanks).not.toContain('7'); // Should exclude lowest
    });

    test('should select best 5 cards for Two Pair', () => {
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'K', suit: '♣' },
        { rank: '5', suit: '♠' },
        { rank: '5', suit: '♥' }, // 3 pairs
        { rank: '2', suit: '♦' }
      ];

      const result = evaluateHand(cards);
      expect(result.rank).toBe(3); // Two Pair
      expect(result.bestFive).toHaveLength(5);

      // Should select A-A-K-K-2 (two highest pairs + highest kicker)
      const bestRanks = result.bestFive.map(c => c.rank).sort();
      expect(bestRanks.filter(r => r === 'A')).toHaveLength(2);
      expect(bestRanks.filter(r => r === 'K')).toHaveLength(2);
      expect(bestRanks).not.toContain('5'); // Should exclude lowest pair
    });
  });

  describe('Hand Description', () => {
    test('should generate description for Pair', () => {
      const cards = [
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'A', suit: '♦' },
        { rank: 'Q', suit: '♣' },
        { rank: 'J', suit: '♠' },
        { rank: '9', suit: '♥' },
        { rank: '7', suit: '♦' }
      ];

      const result = evaluateHand(cards);
      expect(result.description).toContain('Pair');
      expect(result.description).toContain('King');
    });

    test('should generate description for Full House', () => {
      const cards = [
        { rank: 'Q', suit: '♠' },
        { rank: 'Q', suit: '♥' },
        { rank: 'Q', suit: '♦' },
        { rank: '8', suit: '♣' },
        { rank: '8', suit: '♠' },
        { rank: '3', suit: '♥' },
        { rank: '2', suit: '♦' }
      ];

      const result = evaluateHand(cards);
      expect(result.description).toContain('Full House');
      expect(result.description).toContain('Queen');
      expect(result.description).toContain('Eight'); // "Eights" not "8"
    });
  });

});
