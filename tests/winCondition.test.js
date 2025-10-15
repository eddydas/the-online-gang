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

});
