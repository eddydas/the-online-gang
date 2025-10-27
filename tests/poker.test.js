// @ts-check
import { evaluateHand, evaluatePokerHand, compareHands } from '../src/browser/poker.js';

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

    test('should detect identical Two Pair hands when kicker comes from shared community cards', () => {
      // Simulating the scenario from the bug report:
      // Community cards: 10♦, 9♠, 4♣, K♥, K♦
      // CC: hole cards 10♠, 2♥  -> Two Pair K-K-10-10, kicker should be 9
      const handCC = [
        { rank: '10', suit: '♠' },  // hole
        { rank: '2', suit: '♥' },   // hole
        { rank: '10', suit: '♦' },  // community
        { rank: '9', suit: '♠' },   // community
        { rank: '4', suit: '♣' },   // community
        { rank: 'K', suit: '♥' },   // community
        { rank: 'K', suit: '♦' }    // community
      ];

      // AT: hole cards 10♥, 9♦  -> Two Pair K-K-10-10, kicker should be 9
      const handAT = [
        { rank: '10', suit: '♥' },  // hole
        { rank: '9', suit: '♦' },   // hole (different from community 9♠)
        { rank: '10', suit: '♦' },  // community
        { rank: '9', suit: '♠' },   // community
        { rank: '4', suit: '♣' },   // community
        { rank: 'K', suit: '♥' },   // community
        { rank: 'K', suit: '♦' }    // community
      ];

      const resultCC = evaluateHand(handCC);
      const resultAT = evaluateHand(handAT);

      // Both should be Two Pair (K and 10)
      expect(resultCC.rank).toBe(3);
      expect(resultCC.name).toBe('Two Pair');
      expect(resultAT.rank).toBe(3);
      expect(resultAT.name).toBe('Two Pair');

      // Best 5 cards should be: K-K-10-10-9 for both
      // The kicker should be 9 (from community), NOT the hole cards (2 or 9)
      expect(resultCC.tiebreakers).toEqual([13, 10, 9]); // K, 10, 9
      expect(resultAT.tiebreakers).toEqual([13, 10, 9]); // K, 10, 9

      // Hands should be identical (tie)
      expect(compareHands(resultCC, resultAT)).toBe(0);
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

      // Should select A-A-K-K-5 (two highest pairs + highest remaining card)
      // The kicker is 5 (from the third pair), not 2
      const bestRanks = result.bestFive.map(c => c.rank).sort();
      expect(bestRanks.filter(r => r === 'A')).toHaveLength(2);
      expect(bestRanks.filter(r => r === 'K')).toHaveLength(2);
      expect(bestRanks.filter(r => r === '5')).toHaveLength(1); // One card from third pair
      expect(bestRanks).not.toContain('2'); // Should exclude the singleton
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
      expect(result.description).toContain('K');
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
      expect(result.description).toContain('Q');
      expect(result.description).toContain('8');
    });

    test('should describe Ace-low straight as Five high', () => {
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
      expect(result.description).toContain('5');
    });
  });

  describe('Critical Edge Cases', () => {
    test('should handle Two Pair without kicker (exactly 4 cards)', () => {
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'K', suit: '♣' }
      ];

      const result = evaluatePokerHand(cards);
      expect(result.rank).toBe(3); // Two Pair
      expect(result.name).toBe('Two Pair');
      expect(result.bestFive).toHaveLength(4); // Only 4 cards available
      expect(result.tiebreakers[2]).toBe(0); // No kicker, so 0
    });

    test('should handle Four of a Kind without kicker (exactly 4 cards)', () => {
      const cards = [
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'K', suit: '♣' }
      ];

      const result = evaluatePokerHand(cards);
      expect(result.rank).toBe(8); // Four of a Kind
      expect(result.name).toBe('Four of a Kind');
      expect(result.bestFive).toHaveLength(4); // Only 4 cards available
      expect(result.tiebreakers[1]).toBe(0); // No kicker, so 0
    });

    test('should handle Two Pair with kicker (5+ cards)', () => {
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♦' },
        { rank: 'K', suit: '♣' },
        { rank: 'Q', suit: '♠' }
      ];

      const result = evaluatePokerHand(cards);
      expect(result.rank).toBe(3); // Two Pair
      expect(result.name).toBe('Two Pair');
      expect(result.bestFive).toHaveLength(5);
      expect(result.tiebreakers[2]).toBeGreaterThan(0); // Has kicker
    });

    test('should NOT detect straight flush when straight and flush are different suits', () => {
      // Flush in spades, but straight uses mixed suits
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♠' },
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♠' },
        { rank: '3', suit: '♠' }, // 5 spades = flush
        { rank: '10', suit: '♥' }, // But 10 is not a spade
        { rank: '2', suit: '♦' }
      ];

      const result = evaluateHand(cards);
      // Should be Flush (rank 6), NOT Straight Flush (rank 9) or Royal Flush (rank 10)
      expect(result.rank).toBe(6);
      expect(result.name).toBe('Flush');
    });

    test('should detect ace-low straight flush', () => {
      const cards = [
        { rank: '5', suit: '♥' },
        { rank: '4', suit: '♥' },
        { rank: '3', suit: '♥' },
        { rank: '2', suit: '♥' },
        { rank: 'A', suit: '♥' },
        { rank: 'K', suit: '♠' },
        { rank: 'Q', suit: '♦' }
      ];

      const result = evaluateHand(cards);
      expect(result.rank).toBe(9);
      expect(result.name).toBe('Straight Flush');
    });

    test('should find best straight flush when 6 cards in flush suit', () => {
      const cards = [
        { rank: '9', suit: '♦' },
        { rank: '8', suit: '♦' },
        { rank: '7', suit: '♦' },
        { rank: '6', suit: '♦' },
        { rank: '5', suit: '♦' },
        { rank: '4', suit: '♦' }, // 6 diamonds
        { rank: 'A', suit: '♠' }
      ];

      const result = evaluateHand(cards);
      expect(result.rank).toBe(9); // Straight Flush
      expect(result.name).toBe('Straight Flush');
      // Should pick 9-8-7-6-5, not 8-7-6-5-4
    });

    test('should handle full house with two trips correctly', () => {
      // Should pick best trip + best pair
      const cards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' },
        { rank: 'A', suit: '♦' },
        { rank: 'K', suit: '♣' },
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: '2', suit: '♦' }
      ];

      const result = evaluateHand(cards);
      expect(result.rank).toBe(7); // Full House
      expect(result.bestFive).toHaveLength(5);
      // Should be AAA-KK (best trip + best pair)
      const ranks = result.bestFive.map(c => c.rank);
      expect(ranks.filter(r => r === 'A')).toHaveLength(3);
      expect(ranks.filter(r => r === 'K')).toHaveLength(2);
    });
  });

});
