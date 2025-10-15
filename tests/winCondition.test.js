// @ts-check
import { determineWinLoss, sortPlayersByHandStrength } from '../src/browser/winCondition.js';
import { MAX_PLAYERS } from '../src/browser/constants.js';

describe('Win/Loss Determination', () => {

  describe('Player Sorting by Hand Strength', () => {
    test('should sort players from strongest to weakest hand', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: {
            rank: 2,
            name: 'Pair',
            tiebreakers: [14, 13, 12, 11],
            bestFive: [],
            primaryCards: [],
            description: 'Pair of Aces'
          },
          currentToken: 1
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: {
            rank: 3,
            name: 'Two Pair',
            tiebreakers: [13, 12, 11],
            bestFive: [],
            primaryCards: [],
            description: 'Two Pair, Kings and Queens'
          },
          currentToken: 2
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [14, 13, 12, 11, 10],
            bestFive: [],
            primaryCards: [],
            description: 'High Card, Ace'
          },
          currentToken: 3
        }
      ];

      const sorted = sortPlayersByHandStrength(players);

      expect(sorted[0].id).toBe('p2'); // Two Pair strongest
      expect(sorted[1].id).toBe('p1'); // Pair
      expect(sorted[2].id).toBe('p3'); // High Card weakest
    });

    test('should use tiebreakers when hand ranks are equal', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' }, // A-A-K-Q-J
          currentToken: 1
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 12, 11, 10], bestFive: [], primaryCards: [], description: 'Pair' }, // A-A-Q-J-10
          currentToken: 2
        }
      ];

      const sorted = sortPlayersByHandStrength(players);

      expect(sorted[0].id).toBe('p1'); // A-A-K beats A-A-Q
      expect(sorted[1].id).toBe('p2');
    });

    test('should detect identical hands (true ties)', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 3
        }
      ];

      const sorted = sortPlayersByHandStrength(players);

      // Both players tied, order doesn't matter for comparison
      expect(sorted).toHaveLength(2);
    });
  });

  describe('Token Order Validation', () => {
    test('should return WIN when all tokens match rankings', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 3, name: 'Two Pair', tiebreakers: [13, 12, 11], bestFive: [], primaryCards: [], description: 'Two Pair' },
          currentToken: 3 // Strongest, highest token
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 1 // Weakest, lowest token
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(true);
      expect(result.expectedTokens).toEqual([3, 2, 1]);
    });

    test('should return LOSS when any token mismatched', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 3, name: 'Two Pair', tiebreakers: [13, 12, 11], bestFive: [], primaryCards: [], description: 'Two Pair' },
          currentToken: 1 // WRONG! Should be 3
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 3 // WRONG! Should be 1
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(false);
      expect(result.correctness['p1']).toBe(false);
      expect(result.correctness['p3']).toBe(false);
    });

    test('should return correctness map for each player', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2 // Correct
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 2 // Wrong (duplicate)
        }
      ];

      const result = determineWinLoss(players);

      expect(result.correctness['p1']).toBe(true);
      expect(result.correctness['p2']).toBe(false);
      expect(result.isWin).toBe(false);
    });
  });

  describe('Tie Handling (Critical)', () => {
    test('should allow tied players to swap tokens and still WIN', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2 // Can be 2 or 3
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 3 // Can be 2 or 3
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(true);
      expect(result.correctness['p1']).toBe(true);
      expect(result.correctness['p2']).toBe(true);
      expect(result.correctness['p3']).toBe(true);
    });

    test('should allow tied players in swapped order', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 3 // Swapped
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2 // Swapped
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(true);
    });

    test('should reject tied players with wrong token range', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 1 // WRONG! Should be 2 or 3
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 3
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 2
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(false);
      expect(result.correctness['p1']).toBe(false);
    });

    test('should handle 3+ players tied', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 4
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 3
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2
        },
        {
          id: 'p4',
          name: 'Dave',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(true);
      expect(result.correctness['p1']).toBe(true);
      expect(result.correctness['p2']).toBe(true);
      expect(result.correctness['p3']).toBe(true);
      expect(result.correctness['p4']).toBe(true);
    });

    test('should handle tied players in 2nd/3rd place', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 3, name: 'Two Pair', tiebreakers: [13, 12, 11], bestFive: [], primaryCards: [], description: 'Two Pair' },
          currentToken: 4
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 3 // Can be 2 or 3
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2 // Can be 2 or 3
        },
        {
          id: 'p4',
          name: 'Dave',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(true);
    });
  });

  describe('Expected Token Order Generation', () => {
    test('should generate expected tokens for no ties', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 3, name: 'Two Pair', tiebreakers: [13, 12, 11], bestFive: [], primaryCards: [], description: 'Two Pair' },
          currentToken: 3
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      expect(result.expectedTokens).toEqual([3, 2, 1]);
    });

    test('should show expected range for tied players', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 3
        }
      ];

      const result = determineWinLoss(players);

      // Expected tokens should show the range for ties
      expect(result.expectedTokens).toEqual([2, 2]); // Same rank = same expected token (highest of range)
    });
  });

  describe('Edge Cases', () => {
    test('should handle 2 players minimum', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: { rank: 2, name: 'Pair', tiebreakers: [14, 13, 12, 11], bestFive: [], primaryCards: [], description: 'Pair' },
          currentToken: 2
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: { rank: 1, name: 'High Card', tiebreakers: [14, 13, 12, 11, 10], bestFive: [], primaryCards: [], description: 'High Card' },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      expect(result.isWin).toBe(true);
      expect(result.sortedPlayers).toHaveLength(2);
    });

    test('should handle 8 players maximum', () => {
      const players = [];
      for (let i = 1; i <= MAX_PLAYERS; i++) {
        players.push({
          id: `p${i}`,
          name: `Player${i}`,
          hand: { rank: i, name: 'Hand', tiebreakers: [i], bestFive: [], primaryCards: [], description: 'Hand' },
          currentToken: MAX_PLAYERS + 1 - i // Reverse order
        });
      }

      const result = determineWinLoss(players);

      expect(result.sortedPlayers).toHaveLength(MAX_PLAYERS);
      expect(result.expectedTokens).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    });
  });

  describe('Decisive Kicker Detection', () => {
    test('should identify decisive kicker when comparing high card hands', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [7, 6, 5, 3, 2], // 7-6-5-3-2
            bestFive: [
              { rank: '7', suit: '♠' },
              { rank: '6', suit: '♥' },
              { rank: '5', suit: '♦' },
              { rank: '3', suit: '♣' },
              { rank: '2', suit: '♠' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 7'
          },
          currentToken: 1
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [7, 6, 5, 4, 2], // 7-6-5-4-2
            bestFive: [
              { rank: '7', suit: '♦' },
              { rank: '6', suit: '♣' },
              { rank: '5', suit: '♥' },
              { rank: '4', suit: '♠' },
              { rank: '2', suit: '♥' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 7'
          },
          currentToken: 2
        }
      ];

      const result = determineWinLoss(players);

      // Both players should have [3] as decisive kicker index (4th card, 0-indexed position 3)
      // This is the first differing card: 3 vs 4
      expect(result.decisiveKickers['p1']).toEqual([3]);
      expect(result.decisiveKickers['p2']).toEqual([3]);
    });

    test('should identify multiple decisive kickers when player is between two others', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [7, 6, 5, 4, 2], // Strongest: 7-6-5-4-2
            bestFive: [
              { rank: '7', suit: '♠' },
              { rank: '6', suit: '♥' },
              { rank: '5', suit: '♦' },
              { rank: '4', suit: '♣' },
              { rank: '2', suit: '♠' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 7'
          },
          currentToken: 3
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [7, 6, 5, 3, 2], // Middle: 7-6-5-3-2
            bestFive: [
              { rank: '7', suit: '♦' },
              { rank: '6', suit: '♣' },
              { rank: '5', suit: '♥' },
              { rank: '3', suit: '♠' },
              { rank: '2', suit: '♥' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 7'
          },
          currentToken: 2
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [7, 6, 4, 3, 2], // Weakest: 7-6-4-3-2
            bestFive: [
              { rank: '7', suit: '♣' },
              { rank: '6', suit: '♠' },
              { rank: '4', suit: '♥' },
              { rank: '3', suit: '♦' },
              { rank: '2', suit: '♣' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 7'
          },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      // p1 differs from p2 at index 3 (4 vs 3)
      expect(result.decisiveKickers['p1']).toEqual([3]);

      // p2 differs from p1 at index 3 (3 vs 4) AND from p3 at index 2 (5 vs 4)
      expect(result.decisiveKickers['p2']).toEqual([2, 3]);

      // p3 differs from p2 at index 2 (4 vs 5)
      expect(result.decisiveKickers['p3']).toEqual([2]);
    });

    test('should have no decisive kickers when hands are identical', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: {
            rank: 2,
            name: 'Pair',
            tiebreakers: [14, 13, 12, 11],
            bestFive: [],
            primaryCards: [],
            description: 'Pair of Aces'
          },
          currentToken: 2
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: {
            rank: 2,
            name: 'Pair',
            tiebreakers: [14, 13, 12, 11],
            bestFive: [],
            primaryCards: [],
            description: 'Pair of Aces'
          },
          currentToken: 3
        }
      ];

      const result = determineWinLoss(players);

      // No decisive kickers because hands are identical
      expect(result.decisiveKickers['p1']).toEqual([]);
      expect(result.decisiveKickers['p2']).toEqual([]);
    });

    test('should have no decisive kickers when hands have different ranks', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: {
            rank: 3,
            name: 'Two Pair',
            tiebreakers: [13, 12, 11],
            bestFive: [],
            primaryCards: [],
            description: 'Two Pair'
          },
          currentToken: 2
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [14, 13, 12, 11, 10],
            bestFive: [],
            primaryCards: [],
            description: 'High Card'
          },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      // No decisive kickers because ranks are different (no tiebreaker comparison needed)
      expect(result.decisiveKickers['p1']).toEqual([]);
      expect(result.decisiveKickers['p2']).toEqual([]);
    });

    test('should identify decisive kicker at first tiebreaker position', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: {
            rank: 2,
            name: 'Pair',
            tiebreakers: [14, 13, 12, 11], // A-A-K-Q-J
            bestFive: [
              { rank: 'A', suit: '♠' },
              { rank: 'A', suit: '♥' },
              { rank: 'K', suit: '♦' },
              { rank: 'Q', suit: '♣' },
              { rank: 'J', suit: '♠' }
            ],
            primaryCards: [
              { rank: 'A', suit: '♠' },
              { rank: 'A', suit: '♥' }
            ], // The pair
            description: 'Pair of Aces'
          },
          currentToken: 2
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: {
            rank: 2,
            name: 'Pair',
            tiebreakers: [14, 12, 11, 10], // A-A-Q-J-10
            bestFive: [
              { rank: 'A', suit: '♦' },
              { rank: 'A', suit: '♣' },
              { rank: 'Q', suit: '♥' },
              { rank: 'J', suit: '♦' },
              { rank: '10', suit: '♠' }
            ],
            primaryCards: [
              { rank: 'A', suit: '♦' },
              { rank: 'A', suit: '♣' }
            ], // The pair
            description: 'Pair of Aces'
          },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      // Both players differ at bestFive index 2 (K vs Q, first kicker after the pair)
      // Note: tiebreaker index 1, but bestFive index 2 because pair occupies indices 0-1
      expect(result.decisiveKickers['p1']).toEqual([2]);
      expect(result.decisiveKickers['p2']).toEqual([2]);
    });

    test('should work with 4 players with various decisive kickers', () => {
      const players = [
        {
          id: 'p1',
          name: 'Alice',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [10, 9, 7, 5, 3], // 10-9-7-5-3
            bestFive: [
              { rank: '10', suit: '♠' },
              { rank: '9', suit: '♥' },
              { rank: '7', suit: '♦' },
              { rank: '5', suit: '♣' },
              { rank: '3', suit: '♠' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 10'
          },
          currentToken: 4
        },
        {
          id: 'p2',
          name: 'Bob',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [10, 9, 7, 4, 3], // 10-9-7-4-3
            bestFive: [
              { rank: '10', suit: '♦' },
              { rank: '9', suit: '♣' },
              { rank: '7', suit: '♥' },
              { rank: '4', suit: '♠' },
              { rank: '3', suit: '♥' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 10'
          },
          currentToken: 3
        },
        {
          id: 'p3',
          name: 'Carol',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [10, 9, 6, 4, 3], // 10-9-6-4-3
            bestFive: [
              { rank: '10', suit: '♣' },
              { rank: '9', suit: '♠' },
              { rank: '6', suit: '♦' },
              { rank: '4', suit: '♥' },
              { rank: '3', suit: '♦' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 10'
          },
          currentToken: 2
        },
        {
          id: 'p4',
          name: 'Dave',
          hand: {
            rank: 1,
            name: 'High Card',
            tiebreakers: [10, 8, 6, 4, 3], // 10-8-6-4-3
            bestFive: [
              { rank: '10', suit: '♥' },
              { rank: '8', suit: '♦' },
              { rank: '6', suit: '♣' },
              { rank: '4', suit: '♦' },
              { rank: '3', suit: '♣' }
            ],
            primaryCards: [], // High card has no primary cards
            description: 'High Card, 10'
          },
          currentToken: 1
        }
      ];

      const result = determineWinLoss(players);

      // p1 differs from p2 at index 3 (5 vs 4)
      expect(result.decisiveKickers['p1']).toEqual([3]);

      // p2 differs from p1 at index 3 (4 vs 5) AND from p3 at index 2 (7 vs 6)
      expect(result.decisiveKickers['p2']).toEqual([2, 3]);

      // p3 differs from p2 at index 2 (6 vs 7) AND from p4 at index 1 (9 vs 8)
      expect(result.decisiveKickers['p3']).toEqual([1, 2]);

      // p4 differs from p3 at index 1 (8 vs 9)
      expect(result.decisiveKickers['p4']).toEqual([1]);
    });
  });

});
