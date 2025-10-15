// @ts-check
import { describe, test, expect } from 'vitest';

/**
 * @typedef {import('../src/browser/deck.js').Card} Card
 */

// Since evaluateTurnCorrectness is not exported, we'll test it through the integration
// by importing the necessary dependencies and recreating the logic
import { evaluatePokerHand } from '../src/browser/poker.js';
import { determineWinLoss } from '../src/browser/winCondition.js';

/**
 * Helper function to evaluate token correctness for a specific turn
 * (Mirrors the internal function in endGameRenderer.js)
 * @param {any[]} players - All players with their data
 * @param {any} gameState - Game state with community cards
 * @param {number} turn - Turn number (1-4)
 * @returns {Object.<string, boolean>} Map of playerId to isCorrect for this turn
 */
function evaluateTurnCorrectness(players, gameState, turn) {
  // Determine how many community cards are available at this turn
  const communityCardCounts = [0, 3, 4, 5]; // Turn 1=0, Turn 2=3, Turn 3=4, Turn 4=5
  const communityCount = communityCardCounts[turn - 1];
  const communityCards = gameState.communityCards.slice(0, communityCount);

  // Evaluate each player's hand at this turn
  const playersWithHands = players.map(p => {
    const allCards = [...(p.holeCards || []), ...communityCards];
    const hand = evaluatePokerHand(allCards);
    return {
      id: p.id,
      name: p.name,
      holeCards: p.holeCards,
      currentToken: p.tokenHistory[turn - 1],
      tokenHistory: p.tokenHistory,
      hand
    };
  });

  // Determine win/loss for this turn's state
  const turnResult = determineWinLoss(playersWithHands);

  return turnResult.correctness;
}

describe('End Game Renderer - Turn Correctness Evaluation', () => {

  describe('Turn 1 - Hole Cards Only', () => {
    test('should evaluate correctness with only 2 hole cards', () => {
      const gameState = {
        communityCards: [
          { rank: 'K', suit: '♠' },
          { rank: 'Q', suit: '♠' },
          { rank: 'J', suit: '♠' },
          { rank: '10', suit: '♦' },
          { rank: '9', suit: '♥' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'A', suit: '♠' }, { rank: 'A', suit: '♥' }], // Pair of Aces
          tokenHistory: [2, null, null, null]
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: 'K', suit: '♥' }, { rank: 'Q', suit: '♦' }], // High Card King
          tokenHistory: [1, null, null, null]
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 1);

      // Alice has pair (stronger), should have token 2
      // Bob has high card (weaker), should have token 1
      expect(correctness['p1']).toBe(true);
      expect(correctness['p2']).toBe(true);
    });

    test('should detect incorrect token selection at turn 1', () => {
      const gameState = {
        communityCards: [
          { rank: '5', suit: '♠' },
          { rank: '6', suit: '♠' },
          { rank: '7', suit: '♠' },
          { rank: '8', suit: '♦' },
          { rank: '9', suit: '♥' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'A', suit: '♠' }, { rank: 'A', suit: '♥' }], // Pair of Aces
          tokenHistory: [1, null, null, null] // WRONG - should be 2
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: 'K', suit: '♥' }, { rank: 'Q', suit: '♦' }], // High Card King
          tokenHistory: [2, null, null, null] // WRONG - should be 1
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 1);

      // Both players have swapped tokens incorrectly
      expect(correctness['p1']).toBe(false);
      expect(correctness['p2']).toBe(false);
    });
  });

  describe('Turn 2 - Flop (3 community cards)', () => {
    test('should evaluate correctness with hole + flop', () => {
      const gameState = {
        communityCards: [
          { rank: 'A', suit: '♦' },
          { rank: 'A', suit: '♣' },
          { rank: 'K', suit: '♠' },
          { rank: '10', suit: '♦' },
          { rank: '9', suit: '♥' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'A', suit: '♠' }, { rank: 'A', suit: '♥' }], // Four Aces
          tokenHistory: [null, 3, null, null]
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: 'K', suit: '♥' }, { rank: 'K', suit: '♦' }], // Full House K over A
          tokenHistory: [null, 2, null, null]
        },
        {
          id: 'p3',
          name: 'Charlie',
          holeCards: [{ rank: '5', suit: '♠' }, { rank: '6', suit: '♦' }], // Pair of Aces (with board)
          tokenHistory: [null, 1, null, null]
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 2);

      // Alice: Four Aces (strongest) - token 3 ✓
      // Bob: Full House (middle) - token 2 ✓
      // Charlie: Pair of Aces (weakest) - token 1 ✓
      expect(correctness['p1']).toBe(true);
      expect(correctness['p2']).toBe(true);
      expect(correctness['p3']).toBe(true);
    });

    test('should detect when hand changes dramatically after flop', () => {
      const gameState = {
        communityCards: [
          { rank: '5', suit: '♠' },
          { rank: '5', suit: '♥' },
          { rank: '5', suit: '♦' },
          { rank: '10', suit: '♦' },
          { rank: '9', suit: '♥' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'A', suit: '♠' }, { rank: 'A', suit: '♥' }], // Full House A over 5
          tokenHistory: [2, 2, null, null] // Correct at turn 1, still correct at turn 2
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: 'K', suit: '♥' }, { rank: 'Q', suit: '♦' }], // Three 5s
          tokenHistory: [1, 1, null, null] // Correct at turn 1, still correct at turn 2
        }
      ];

      const turn1Correctness = evaluateTurnCorrectness(players, gameState, 1);
      const turn2Correctness = evaluateTurnCorrectness(players, gameState, 2);

      // Turn 1 (only hole cards): Alice has pair, Bob has high card
      expect(turn1Correctness['p1']).toBe(true);
      expect(turn1Correctness['p2']).toBe(true);

      // Turn 2 (after flop with three 5s): Alice has full house, Bob has three of a kind
      expect(turn2Correctness['p1']).toBe(true);
      expect(turn2Correctness['p2']).toBe(true);
    });
  });

  describe('Turn 3 - Turn Card (4 community cards)', () => {
    test('should evaluate correctness with 4 community cards', () => {
      const gameState = {
        communityCards: [
          { rank: '9', suit: '♠' },
          { rank: '10', suit: '♠' },
          { rank: 'J', suit: '♠' },
          { rank: 'Q', suit: '♠' }, // 4 cards to straight flush
          { rank: '2', suit: '♥' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'K', suit: '♠' }, { rank: 'A', suit: '♠' }], // Royal Flush potential
          tokenHistory: [null, null, 2, null]
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: '8', suit: '♠' }, { rank: '7', suit: '♦' }], // Straight
          tokenHistory: [null, null, 1, null]
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 3);

      // Alice: Straight flush K high (stronger)
      // Bob: Straight Q high (weaker)
      expect(correctness['p1']).toBe(true);
      expect(correctness['p2']).toBe(true);
    });
  });

  describe('Turn 4 - River (5 community cards)', () => {
    test('should evaluate final hand correctness', () => {
      const gameState = {
        communityCards: [
          { rank: 'A', suit: '♠' },
          { rank: 'K', suit: '♠' },
          { rank: 'Q', suit: '♠' },
          { rank: 'J', suit: '♠' },
          { rank: '10', suit: '♠' } // Royal Flush on board
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: '2', suit: '♥' }, { rank: '3', suit: '♦' }], // Royal Flush (from board)
          tokenHistory: [null, null, null, 1]
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: '4', suit: '♣' }, { rank: '5', suit: '♥' }], // Royal Flush (from board)
          tokenHistory: [null, null, null, 2]
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 4);

      // Both players have identical hands (royal flush from board)
      // They can swap tokens and both be correct
      expect(correctness['p1']).toBe(true);
      expect(correctness['p2']).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle 3 players with different rankings', () => {
      const gameState = {
        communityCards: [
          { rank: 'K', suit: '♠' },
          { rank: 'Q', suit: '♠' },
          { rank: 'J', suit: '♠' },
          { rank: '2', suit: '♦' },
          { rank: '3', suit: '♥' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'A', suit: '♠' }, { rank: '10', suit: '♠' }], // Royal Flush
          tokenHistory: [null, null, 3, null]
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: 'K', suit: '♥' }, { rank: 'K', suit: '♦' }], // Three Kings
          tokenHistory: [null, null, 2, null]
        },
        {
          id: 'p3',
          name: 'Charlie',
          holeCards: [{ rank: '5', suit: '♠' }, { rank: '6', suit: '♦' }], // High Card King
          tokenHistory: [null, null, 1, null]
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 3);

      expect(correctness['p1']).toBe(true);
      expect(correctness['p2']).toBe(true);
      expect(correctness['p3']).toBe(true);
    });

    test('should detect wrong tokens even with one mistake', () => {
      const gameState = {
        communityCards: [
          { rank: '2', suit: '♠' },
          { rank: '3', suit: '♠' },
          { rank: '4', suit: '♠' },
          { rank: '7', suit: '♦' },
          { rank: '8', suit: '♥' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'A', suit: '♠' }, { rank: 'K', suit: '♠' }], // Flush A high
          tokenHistory: [null, null, 3, null] // Correct
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: 'Q', suit: '♠' }, { rank: 'J', suit: '♠' }], // Flush Q high
          tokenHistory: [null, null, 1, null] // WRONG - should be 2
        },
        {
          id: 'p3',
          name: 'Charlie',
          holeCards: [{ rank: '9', suit: '♦' }, { rank: '10', suit: '♥' }], // High Card 10
          tokenHistory: [null, null, 2, null] // WRONG - should be 1
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 3);

      expect(correctness['p1']).toBe(true);  // Correct
      expect(correctness['p2']).toBe(false); // Wrong
      expect(correctness['p3']).toBe(false); // Wrong
    });

    test('should handle identical hands that can swap tokens', () => {
      const gameState = {
        communityCards: [
          { rank: 'K', suit: '♠' },
          { rank: 'K', suit: '♥' },
          { rank: 'Q', suit: '♦' },
          { rank: 'J', suit: '♣' },
          { rank: '10', suit: '♠' }
        ]
      };

      const players = [
        {
          id: 'p1',
          name: 'Alice',
          holeCards: [{ rank: 'A', suit: '♠' }, { rank: '9', suit: '♥' }], // Pair of K, A kicker
          tokenHistory: [null, null, null, 2] // Either token works
        },
        {
          id: 'p2',
          name: 'Bob',
          holeCards: [{ rank: 'A', suit: '♦' }, { rank: '8', suit: '♣' }], // Pair of K, A kicker
          tokenHistory: [null, null, null, 1] // Either token works
        }
      ];

      const correctness = evaluateTurnCorrectness(players, gameState, 4);

      // Both players have identical hands (Pair of K with A-Q-J kickers)
      // They can have either token and both be correct
      expect(correctness['p1']).toBe(true);
      expect(correctness['p2']).toBe(true);
    });
  });
});
