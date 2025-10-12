// @ts-check
import { describe, test, expect, vi } from 'vitest';
import { createInitialState, startGame, advancePhase, setPlayerReady, handleTokenAction } from '../src/browser/gameState.js';
import { broadcastState } from '../src/browser/p2pSync.js';
import { determineWinLoss } from '../src/browser/winCondition.js';
import { evaluateHand } from '../src/browser/poker.js';

/**
 * @typedef {import('../src/browser/tokens.js').TokenAction} TokenAction
 */

/**
 * Integration tests for full multiplayer game scenarios
 * These tests verify that different modules work together correctly
 */

describe('Integration Tests - Game Flow', () => {

  describe('Basic Game Setup', () => {
    test('should create initial lobby state with multiple players', () => {
      const players = [
        { id: 'host', name: 'Alice', isHost: true },
        { id: 'client1', name: 'Bob', isHost: false },
        { id: 'client2', name: 'Charlie', isHost: false }
      ];

      const state = createInitialState(players);

      expect(state.phase).toBe('LOBBY');
      expect(state.players).toHaveLength(3);
      expect(state.turn).toBe(0);
      expect(state.communityCards).toHaveLength(0);
      expect(state.cardBackColor).toMatch(/^(blue|red)$/);
    });

    test('should start game and deal cards', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      expect(state.phase).toBe('READY_UP');
      expect(state.turn).toBe(1);
      expect(state.tokens).toHaveLength(2);

      // Verify cards dealt
      state.players.forEach(player => {
        expect(player.holeCards).toBeDefined();
        expect(player.holeCards).toHaveLength(2);
      });

      // Turn 1 has 0 community cards
      expect(state.communityCards).toHaveLength(0);
    });

    test('should enforce player count limits', () => {
      // Too few players
      expect(() => {
        createInitialState([{ id: 'p1', name: 'Solo' }]);
      }).toThrow('Player count must be between 2 and 8');

      // Too many players
      const tooMany = Array.from({ length: 9 }, (_, i) => ({
        id: `p${i}`,
        name: `Player ${i}`
      }));
      expect(() => {
        createInitialState(tooMany);
      }).toThrow('Player count must be between 2 and 8');
    });
  });

  describe('Ready-Up Mechanics', () => {
    test('should track player ready status', () => {
      const players = [
        { id: 'p1', name: 'P1', isHost: true },
        { id: 'p2', name: 'P2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Initially not ready
      expect(state.readyStatus['p1']).toBe(false);
      expect(state.readyStatus['p2']).toBe(false);

      // Player 1 ready
      state = setPlayerReady(state, 'p1', true);
      expect(state.readyStatus['p1']).toBe(true);
      expect(state.readyStatus['p2']).toBe(false);

      // Player 2 ready
      state = setPlayerReady(state, 'p2', true);
      expect(state.readyStatus['p1']).toBe(true);
      expect(state.readyStatus['p2']).toBe(true);
    });

    test('should advance phase after all ready', () => {
      const players = [
        { id: 'p1', name: 'P1', isHost: true },
        { id: 'p2', name: 'P2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);
      expect(state.phase).toBe('READY_UP');

      // Both ready
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);

      // Advance to TOKEN_TRADING
      state = advancePhase(state);
      expect(state.phase).toBe('TOKEN_TRADING');
    });
  });

  describe('Token System Integration', () => {
    test('should handle token selection with tokens array', () => {
      const players = [
        { id: 'p1', name: 'P1', isHost: true },
        { id: 'p2', name: 'P2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      expect(state.tokens).toHaveLength(2);
      expect(state.tokens[0].ownerId).toBeNull();

      // Apply token action using handleTokenAction
      /** @type {TokenAction} */
      const action = {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      };

      state = handleTokenAction(state, action);

      const token1 = state.tokens.find(t => t.number === 1);
      expect(token1).toBeDefined();
      expect(token1?.ownerId).toBe('p1');
    });

    test('should handle token stealing with tokens array', () => {
      const players = [
        { id: 'p1', name: 'P1', isHost: true },
        { id: 'p2', name: 'P2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // P1 selects token 1
      /** @type {TokenAction} */
      let action = {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      };
      state = handleTokenAction(state, action);

      let token1 = state.tokens.find(t => t.number === 1);
      expect(token1).toBeDefined();
      expect(token1?.ownerId).toBe('p1');

      // P2 steals token 1
      /** @type {TokenAction} */
      action = {
        type: 'steal',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: Date.now() + 1
      };
      state = handleTokenAction(state, action);

      token1 = state.tokens.find(t => t.number === 1);
      expect(token1).toBeDefined();
      expect(token1?.ownerId).toBe('p2');
    });
  });

  describe('P2P State Synchronization', () => {
    test('should broadcast state to all connections', () => {
      const mockConnections = [
        { send: vi.fn(), id: 'c1' },
        { send: vi.fn(), id: 'c2' }
      ];

      const players = [
        { id: 'host', name: 'Host', isHost: true },
        { id: 'c1', name: 'Client1', isHost: false },
        { id: 'c2', name: 'Client2', isHost: false }
      ];

      const state = createInitialState(players);

      broadcastState(state, mockConnections);

      expect(mockConnections[0].send).toHaveBeenCalled();
      expect(mockConnections[1].send).toHaveBeenCalled();

      const sentData = mockConnections[0].send.mock.calls[0][0];
      const parsed = JSON.parse(sentData);

      expect(parsed.type).toBe('STATE_UPDATE');
      expect(parsed.payload.phase).toBe('LOBBY');
      expect(parsed.payload.players).toHaveLength(3);
    });

    test('should handle broadcast errors gracefully', () => {
      const mockConnections = [
        { send: vi.fn() },
        { send: vi.fn(() => { throw new Error('Connection lost'); }) },
        { send: vi.fn() }
      ];

      const state = createInitialState([
        // @ts-ignore - test data includes extra properties
        { id: 'p1', name: 'P1', isHost: true },
        // @ts-ignore - test data includes extra properties
        { id: 'p2', name: 'P2', isHost: false }
      ]);

      // Should not throw
      expect(() => {
        broadcastState(state, mockConnections);
      }).not.toThrow();

      // Good connections still got state
      expect(mockConnections[0].send).toHaveBeenCalled();
      expect(mockConnections[2].send).toHaveBeenCalled();
    });
  });

  describe('Win Condition Integration', () => {
    test('should evaluate hands and determine winner', () => {
      // Create players with known cards for testing
      const communityCards = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♠' },
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♠' },
        { rank: '10', suit: '♠' }
      ];

      const players = [
        {
          id: 'p1',
          name: 'P1',
          holeCards: [
            { rank: '9', suit: '♠' },
            { rank: '8', suit: '♠' }
          ],
          tokenHistory: [1, 1, 1, 1],
          currentToken: 1
        },
        {
          id: 'p2',
          name: 'P2',
          holeCards: [
            { rank: '2', suit: '♥' },
            { rank: '3', suit: '♦' }
          ],
          tokenHistory: [2, 2, 2, 2],
          currentToken: 2
        }
      ];

      // Evaluate hands for each player
      const playersWithHands = players.map(player => ({
        ...player,
        hand: evaluateHand([...player.holeCards, ...communityCards])
      }));

      const result = determineWinLoss(playersWithHands);

      expect(result.isWin).toBe(true);
      expect(result.sortedPlayers).toHaveLength(2);

      // P1 should have Royal Flush (best hand)
      expect(result.sortedPlayers[0].id).toBe('p1');
      expect(result.sortedPlayers[0].hand.name).toBe('Royal Flush');
    });

    test('should detect loss when tokens are wrong', () => {
      const communityCards = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♥' },
        { rank: '5', suit: '♠' }
      ];

      const players = [
        {
          id: 'p1',
          name: 'P1',
          holeCards: [
            { rank: 'A', suit: '♦' },
            { rank: 'A', suit: '♣' }
          ],
          tokenHistory: [3, 3, 3, 3], // Wrong! P1 has three of a kind (AAA), strongest hand, should be 1
          currentToken: 3
        },
        {
          id: 'p2',
          name: 'P2',
          holeCards: [
            { rank: 'K', suit: '♦' },
            { rank: 'K', suit: '♣' }
          ],
          tokenHistory: [1, 1, 1, 1], // Wrong! P2 has pair of Kings, weakest hand, should be 3
          currentToken: 1
        },
        {
          id: 'p3',
          name: 'P3',
          holeCards: [
            { rank: 'Q', suit: '♦' },
            { rank: 'Q', suit: '♣' }
          ],
          tokenHistory: [2, 2, 2, 2], // Correct - middle hand
          currentToken: 2
        }
      ];

      // Evaluate hands for each player
      const playersWithHands = players.map(player => ({
        ...player,
        hand: evaluateHand([...player.holeCards, ...communityCards])
      }));

      const result = determineWinLoss(playersWithHands);

      expect(result.isWin).toBe(false);
      // P1 has AAA (strongest) but has token 3 (should be 1)
      expect(result.sortedPlayers[0].id).toBe('p1');
      expect(result.sortedPlayers[0].hand.name).toBe('Three of a Kind');
      // P2 has KK, should be middle or weakest depending on tiebreakers
      // P3 has QQ, should be middle or weakest depending on tiebreakers
    });
  });

  describe('Phase Transitions', () => {
    test('should progress through multiple turns', () => {
      const players = [
        { id: 'p1', name: 'P1', isHost: true },
        { id: 'p2', name: 'P2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      expect(state.turn).toBe(1);
      expect(state.communityCards).toHaveLength(0);

      // Turn 1 -> Turn 2
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // TOKEN_TRADING

      // Assign all tokens
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      });
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      });

      state = advancePhase(state); // Move to turn 2

      expect(state.turn).toBe(2);
      expect(state.communityCards).toHaveLength(3); // Flop

      // Turn 2 -> Turn 3
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // TOKEN_TRADING

      // Assign all tokens
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      });
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      });

      state = advancePhase(state); // Move to turn 3

      expect(state.turn).toBe(3);
      expect(state.communityCards).toHaveLength(4); // Turn

      // Turn 3 -> Turn 4
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // TOKEN_TRADING

      // Assign all tokens
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      });
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      });

      state = advancePhase(state); // Move to turn 4

      expect(state.turn).toBe(4);
      expect(state.communityCards).toHaveLength(5); // River
    });

    test('should reach END_GAME after turn 4', () => {
      const players = [
        { id: 'p1', name: 'P1', isHost: true },
        { id: 'p2', name: 'P2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Fast-forward through all 4 turns
      for (let turn = 1; turn <= 4; turn++) {
        state = setPlayerReady(state, 'p1', true);
        state = setPlayerReady(state, 'p2', true);
        state = advancePhase(state); // TOKEN_TRADING

        // Assign all tokens
        state = handleTokenAction(state, {
          type: 'select',
          playerId: 'p1',
          tokenNumber: 1,
          timestamp: Date.now()
        });
        state = handleTokenAction(state, {
          type: 'select',
          playerId: 'p2',
          tokenNumber: 2,
          timestamp: Date.now() + 1
        });


        if (turn < 4) {
          state = advancePhase(state); // Next READY_UP
        }
      }

      // After turn 4, advance to END_GAME
      state = advancePhase(state);
      expect(state.phase).toBe('END_GAME');
      expect(state.turn).toBe(4);
    });
  });

  describe('Complete Game Simulation', () => {
    test('should simulate full game from start to end with token trading and win evaluation', () => {
      // Setup: 3 players
      const players = [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
        { id: 'charlie', name: 'Charlie' }
      ];

      let state = createInitialState(players);
      expect(state.phase).toBe('LOBBY');

      // Start game
      state = startGame(state);
      expect(state.phase).toBe('READY_UP');
      expect(state.turn).toBe(1);
      expect(state.communityCards).toHaveLength(0); // Turn 1: no community cards yet

      // Override with predetermined cards for deterministic test
      // Alice: A♠ A♥ (Pair of Aces) → will make Four of a Kind with community AAXX
      // Bob: K♠ K♥ (Pair of Kings) → will make Three of a Kind with community AAK
      // Charlie: Q♠ J♠ (High cards) → will make Two Pair with community AAQJ
      state.players[0].holeCards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' }
      ];
      state.players[1].holeCards = [
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' }
      ];
      state.players[2].holeCards = [
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♠' }
      ];

      // Override community cards (will be dealt progressively)
      // Turn 2: A♦, A♣, K♦ (flop)
      // Turn 3: Q♥ (turn)
      // Turn 4: J♥ (river)
      // Final community: A♦, A♣, K♦, Q♥, J♥
      const predeterminedCommunity = [
        { rank: 'A', suit: '♦' },
        { rank: 'A', suit: '♣' },
        { rank: 'K', suit: '♦' },
        { rank: 'Q', suit: '♥' },
        { rank: 'J', suit: '♥' }
      ];

      // === TURN 1 ===
      // All players ready up
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);

      // Advance to TOKEN_TRADING
      state = advancePhase(state);
      expect(state.phase).toBe('TOKEN_TRADING');
      expect(state.tokens).toHaveLength(3);

      // Alice takes token 1
      /** @type {TokenAction} */
      let action = {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 1,
        timestamp: Date.now()
      };
      state = handleTokenAction(state, action);
      expect(state.tokens.find(t => t.number === 1)?.ownerId).toBe('alice');

      // Bob takes token 2
      action = {
        type: 'select',
        playerId: 'bob',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      };
      state = handleTokenAction(state, action);
      expect(state.tokens.find(t => t.number === 2)?.ownerId).toBe('bob');

      // Charlie steals token 1 from Alice
      action = {
        type: 'steal',
        playerId: 'charlie',
        tokenNumber: 1,
        timestamp: Date.now() + 2
      };
      state = handleTokenAction(state, action);
      expect(state.tokens.find(t => t.number === 1)?.ownerId).toBe('charlie');

      // Alice takes token 3
      action = {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 3,
        timestamp: Date.now() + 3
      };
      state = handleTokenAction(state, action);
      expect(state.tokens.find(t => t.number === 3)?.ownerId).toBe('alice');

      state = advancePhase(state); // Move to turn 2

      expect(state.turn).toBe(2);

      // Override community cards with predetermined flop
      state.communityCards = predeterminedCommunity.slice(0, 3); // A♦, A♣, K♦
      expect(state.communityCards).toHaveLength(3);

      // === TURN 2 ===
      // All players ready up
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);

      state = advancePhase(state); // TOKEN_TRADING
      expect(state.phase).toBe('TOKEN_TRADING');

      // Bob steals token 3 from Alice
      action = {
        type: 'steal',
        playerId: 'bob',
        tokenNumber: 3,
        timestamp: Date.now() + 10
      };
      state = handleTokenAction(state, action);
      expect(state.tokens.find(t => t.number === 3)?.ownerId).toBe('bob');

      // Alice takes token 2
      action = {
        type: 'steal',
        playerId: 'alice',
        tokenNumber: 2,
        timestamp: Date.now() + 11
      };
      state = handleTokenAction(state, action);
      expect(state.tokens.find(t => t.number === 2)?.ownerId).toBe('alice');

      // Charlie still has token 1 from stealing in turn 1 - but tokens were reset!
      // So Charlie needs to take token 1
      action = {
        type: 'select',
        playerId: 'charlie',
        tokenNumber: 1,
        timestamp: Date.now() + 12
      };
      state = handleTokenAction(state, action);
      expect(state.tokens.find(t => t.number === 1)?.ownerId).toBe('charlie');

      state = advancePhase(state); // Move to turn 3

      expect(state.turn).toBe(3);

      // Override community cards with turn card
      state.communityCards = predeterminedCommunity.slice(0, 4); // A♦, A♣, K♦, Q♥
      expect(state.communityCards).toHaveLength(4);

      // === TURN 3 ===
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);

      state = advancePhase(state); // TOKEN_TRADING

      // More token swapping
      action = {
        type: 'steal',
        playerId: 'charlie',
        tokenNumber: 2,
        timestamp: Date.now() + 20
      };
      state = handleTokenAction(state, action);

      action = {
        type: 'steal',
        playerId: 'alice',
        tokenNumber: 1,
        timestamp: Date.now() + 21
      };
      state = handleTokenAction(state, action);

      // Bob still needs token 3
      action = {
        type: 'select',
        playerId: 'bob',
        tokenNumber: 3,
        timestamp: Date.now() + 22
      };
      state = handleTokenAction(state, action);

      state = advancePhase(state); // Move to turn 4

      expect(state.turn).toBe(4);

      // Override community cards with river card
      state.communityCards = predeterminedCommunity.slice(0, 5); // A♦, A♣, K♦, Q♥, J♥
      expect(state.communityCards).toHaveLength(5);

      // === TURN 4 (Final Turn) ===
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);

      state = advancePhase(state); // TOKEN_TRADING

      // Final token selections - ensure correct ordering for a WIN
      // Alice has Four of a Kind (strongest) → should have token 3
      // Bob has Full House (middle) → should have token 2
      // Charlie has Two Pair (weakest) → should have token 1

      // Make sure final tokens are: Alice=3, Bob=2, Charlie=1
      // Current state: Alice has 1, Bob has 3, Charlie has 2

      // Bob steals token 2 from Charlie
      action = {
        type: 'steal',
        playerId: 'bob',
        tokenNumber: 2,
        timestamp: Date.now() + 30
      };
      state = handleTokenAction(state, action);

      // Alice steals token 3 from Bob
      action = {
        type: 'steal',
        playerId: 'alice',
        tokenNumber: 3,
        timestamp: Date.now() + 31
      };
      state = handleTokenAction(state, action);

      // Charlie steals token 1 from Alice
      action = {
        type: 'steal',
        playerId: 'charlie',
        tokenNumber: 1,
        timestamp: Date.now() + 32
      };
      state = handleTokenAction(state, action);

      // Verify final token ownership
      expect(state.tokens.find(t => t.number === 3)?.ownerId).toBe('alice');
      expect(state.tokens.find(t => t.number === 2)?.ownerId).toBe('bob');
      expect(state.tokens.find(t => t.number === 1)?.ownerId).toBe('charlie');

      // Record final token ownership
      const finalTokens = {
        alice: state.tokens.find(t => t.ownerId === 'alice')?.number,
        bob: state.tokens.find(t => t.ownerId === 'bob')?.number,
        charlie: state.tokens.find(t => t.ownerId === 'charlie')?.number
      };

      state = advancePhase(state); // END_GAME

      expect(state.phase).toBe('END_GAME');
      expect(state.turn).toBe(4);

      // === WIN/LOSS EVALUATION ===
      // Evaluate hands for all players
      const playersWithHands = state.players.map(player => {
        // TypeScript: ensure holeCards exists
        const holeCards = player.holeCards || [];
        const allCards = [...holeCards, ...state.communityCards];
        // Get token for this player
        const tokenId = /** @type {'alice' | 'bob' | 'charlie'} */ (player.id);
        const token = finalTokens[tokenId];

        return {
          ...player,
          hand: evaluateHand(allCards),
          currentToken: state.tokens.find(t => t.ownerId === player.id)?.number || 0,
          tokenHistory: [token, token, token, token]
        };
      });

      const result = determineWinLoss(playersWithHands);

      // Verify result structure
      expect(result).toHaveProperty('isWin');
      expect(result).toHaveProperty('sortedPlayers');
      expect(result.sortedPlayers).toHaveLength(3);

      // Verify players are sorted by hand strength (strongest first)
      const player1 = result.sortedPlayers[0];
      const player2 = result.sortedPlayers[1];
      const player3 = result.sortedPlayers[2];

      expect(player1.hand).toBeDefined();
      expect(player2.hand).toBeDefined();
      expect(player3.hand).toBeDefined();

      // Verify win/loss logic is consistent with token ordering
      // With predetermined cards:
      // Alice: A♠ A♥ + A♦ A♣ K♦ Q♥ J♥ = Four of a Kind (AAAA) - Token 3 ✓
      // Bob: K♠ K♥ + A♦ A♣ K♦ Q♥ J♥ = Full House (KKK AA) - Token 2 ✓
      // Charlie: Q♠ J♠ + A♦ A♣ K♦ Q♥ J♥ = Two Pair (QQ JJ) - Token 1 ✓

      // Tokens are correctly ordered 3 > 2 > 1, so this should be a WIN
      expect(result.isWin).toBe(true);

      // Verify exact hand rankings
      expect(player1.id).toBe('alice');
      expect(player1.hand.name).toBe('Four of a Kind');
      expect(player1.currentToken).toBe(3);

      expect(player2.id).toBe('bob');
      expect(player2.hand.name).toBe('Full House');
      expect(player2.currentToken).toBe(2);

      expect(player3.id).toBe('charlie');
      expect(player3.hand.name).toBe('Two Pair');
      expect(player3.currentToken).toBe(1);

      // Log the results for visibility
      console.log('Game Result:', result.isWin ? 'WIN' : 'LOSS');
      console.log('Player Rankings:');
      result.sortedPlayers.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name}: ${p.hand.name} (Token: ${p.currentToken})`);
      });
    });

    test('should simulate full game with incorrect tokens resulting in LOSS', () => {
      // Setup: 3 players
      const players = [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
        { id: 'charlie', name: 'Charlie' }
      ];

      let state = createInitialState(players);
      expect(state.phase).toBe('LOBBY');

      // Start game
      state = startGame(state);
      expect(state.phase).toBe('READY_UP');
      expect(state.turn).toBe(1);
      expect(state.communityCards).toHaveLength(0);

      // Override with predetermined cards for deterministic test
      // Alice: A♠ A♥ → will make Four of a Kind (AAAA) - strongest
      // Bob: K♠ K♥ → will make Full House (KKK AA) - middle
      // Charlie: Q♠ J♠ → will make Two Pair (QQ JJ) - weakest
      state.players[0].holeCards = [
        { rank: 'A', suit: '♠' },
        { rank: 'A', suit: '♥' }
      ];
      state.players[1].holeCards = [
        { rank: 'K', suit: '♠' },
        { rank: 'K', suit: '♥' }
      ];
      state.players[2].holeCards = [
        { rank: 'Q', suit: '♠' },
        { rank: 'J', suit: '♠' }
      ];

      // Community: A♦, A♣, K♦, Q♥, J♥
      const predeterminedCommunity = [
        { rank: 'A', suit: '♦' },
        { rank: 'A', suit: '♣' },
        { rank: 'K', suit: '♦' },
        { rank: 'Q', suit: '♥' },
        { rank: 'J', suit: '♥' }
      ];

      // === TURN 1 ===
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);
      state = advancePhase(state); // TOKEN_TRADING

      // Token selections (will be wrong at the end)
      /** @type {TokenAction} */
      let action = {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 2,
        timestamp: Date.now()
      };
      state = handleTokenAction(state, action);

      action = {
        type: 'select',
        playerId: 'bob',
        tokenNumber: 1,
        timestamp: Date.now() + 1
      };
      state = handleTokenAction(state, action);

      action = {
        type: 'select',
        playerId: 'charlie',
        tokenNumber: 3,
        timestamp: Date.now() + 2
      };
      state = handleTokenAction(state, action);

      state = advancePhase(state); // Move to turn 2

      // Override community cards with flop
      state.communityCards = predeterminedCommunity.slice(0, 3);

      // === TURN 2 ===
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);
      state = advancePhase(state); // TOKEN_TRADING

      // Some token swapping but keeping wrong order
      action = {
        type: 'steal',
        playerId: 'bob',
        tokenNumber: 3,
        timestamp: Date.now() + 10
      };
      state = handleTokenAction(state, action);

      action = {
        type: 'steal',
        playerId: 'charlie',
        tokenNumber: 1,
        timestamp: Date.now() + 11
      };
      state = handleTokenAction(state, action);

      // Alice needs token 2
      action = {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 2,
        timestamp: Date.now() + 12
      };
      state = handleTokenAction(state, action);

      state = advancePhase(state); // Move to turn 3

      // Override with turn card
      state.communityCards = predeterminedCommunity.slice(0, 4);

      // === TURN 3 ===
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);
      state = advancePhase(state); // TOKEN_TRADING

      action = {
        type: 'steal',
        playerId: 'alice',
        tokenNumber: 1,
        timestamp: Date.now() + 20
      };
      state = handleTokenAction(state, action);

      action = {
        type: 'steal',
        playerId: 'charlie',
        tokenNumber: 2,
        timestamp: Date.now() + 21
      };
      state = handleTokenAction(state, action);

      // Bob needs token 3
      action = {
        type: 'select',
        playerId: 'bob',
        tokenNumber: 3,
        timestamp: Date.now() + 22
      };
      state = handleTokenAction(state, action);

      state = advancePhase(state); // Move to turn 4

      // Override with river card
      state.communityCards = predeterminedCommunity.slice(0, 5);

      // === TURN 4 (Final Turn) ===
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);
      state = advancePhase(state); // TOKEN_TRADING

      // Final token selections - WRONG ORDER for LOSS
      // Alice has Four of a Kind (strongest) but gets token 1 (should be 3) ❌
      // Bob has Full House (middle) and gets token 3 (should be 2) ❌
      // Charlie has Two Pair (weakest) and gets token 2 (should be 1) ❌

      // Assign tokens (wrong order)
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 1,
        timestamp: Date.now()
      });
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'bob',
        tokenNumber: 3,
        timestamp: Date.now() + 1
      });
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'charlie',
        tokenNumber: 2,
        timestamp: Date.now() + 2
      });

      // Verify final token ownership (wrong order)
      expect(state.tokens.find(t => t.number === 1)?.ownerId).toBe('alice');
      expect(state.tokens.find(t => t.number === 3)?.ownerId).toBe('bob');
      expect(state.tokens.find(t => t.number === 2)?.ownerId).toBe('charlie');

      // Record final token ownership
      const finalTokens = {
        alice: state.tokens.find(t => t.ownerId === 'alice')?.number,
        bob: state.tokens.find(t => t.ownerId === 'bob')?.number,
        charlie: state.tokens.find(t => t.ownerId === 'charlie')?.number
      };

      state = advancePhase(state); // END_GAME

      expect(state.phase).toBe('END_GAME');
      expect(state.turn).toBe(4);

      // === WIN/LOSS EVALUATION ===
      const playersWithHands = state.players.map(player => {
        const holeCards = player.holeCards || [];
        const allCards = [...holeCards, ...state.communityCards];
        const tokenId = /** @type {'alice' | 'bob' | 'charlie'} */ (player.id);
        const token = finalTokens[tokenId];

        return {
          ...player,
          hand: evaluateHand(allCards),
          currentToken: state.tokens.find(t => t.ownerId === player.id)?.number || 0,
          tokenHistory: [token, token, token, token]
        };
      });

      const result = determineWinLoss(playersWithHands);

      // Verify result structure
      expect(result).toHaveProperty('isWin');
      expect(result).toHaveProperty('sortedPlayers');
      expect(result.sortedPlayers).toHaveLength(3);

      // Verify players are sorted by hand strength
      const player1 = result.sortedPlayers[0];
      const player2 = result.sortedPlayers[1];
      const player3 = result.sortedPlayers[2];

      expect(player1.hand).toBeDefined();
      expect(player2.hand).toBeDefined();
      expect(player3.hand).toBeDefined();

      // Alice: Four of a Kind but has token 1 (should be 3) ❌
      // Bob: Full House but has token 3 (should be 2) ❌
      // Charlie: Two Pair but has token 2 (should be 1) ❌
      // Tokens are WRONG, so this should be a LOSS
      expect(result.isWin).toBe(false);

      // Verify exact hand rankings
      expect(player1.id).toBe('alice');
      expect(player1.hand.name).toBe('Four of a Kind');
      expect(player1.currentToken).toBe(1); // Wrong! Should be 3

      expect(player2.id).toBe('bob');
      expect(player2.hand.name).toBe('Full House');
      expect(player2.currentToken).toBe(3); // Wrong! Should be 2

      expect(player3.id).toBe('charlie');
      expect(player3.hand.name).toBe('Two Pair');
      expect(player3.currentToken).toBe(2); // Wrong! Should be 1

      // Log the results
      console.log('Game Result:', result.isWin ? 'WIN' : 'LOSS');
      console.log('Player Rankings:');
      result.sortedPlayers.forEach((p, i) => {
        const expectedToken = 3 - i; // 3, 2, 1
        const isCorrect = p.currentToken === expectedToken;
        console.log(`  ${i + 1}. ${p.name}: ${p.hand.name} (Token: ${p.currentToken}) ${isCorrect ? '✓' : '❌'}`);
      });
    });
  });

  describe('Token Ownership Validation', () => {
    test('should block phase advancement when not all tokens are owned', () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
        { id: 'p3', name: 'Player 3' }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = setPlayerReady(state, 'p3', true);
      state = advancePhase(state);

      expect(state.phase).toBe('TOKEN_TRADING');
      expect(state.turn).toBe(1);

      // Only assign 2 out of 3 tokens (incomplete)
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      });
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      });

      // Verify token 3 is still unowned
      const token3 = state.tokens.find(t => t.number === 3);
      expect(token3?.ownerId).toBeNull();

      // Try to advance phase - should fail and remain in TOKEN_TRADING
      const newState = advancePhase(state);

      expect(newState.phase).toBe('TOKEN_TRADING'); // Should NOT advance
      expect(newState.turn).toBe(1); // Should remain in turn 1
      expect(newState).toBe(state); // Should return same state (no change)

      // Now assign the last token
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p3',
        tokenNumber: 3,
        timestamp: Date.now() + 2
      });

      // Verify all tokens are now owned
      state.tokens.forEach(token => {
        expect(token.ownerId).not.toBeNull();
      });

      // Now advance should succeed
      const advancedState = advancePhase(state);

      expect(advancedState.phase).toBe('READY_UP'); // Should advance successfully to next turn
      expect(advancedState).not.toBe(state); // Should be a new state
    });

    test('should allow advancement only after all tokens distributed across multiple attempts', () => {
      const players = [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = advancePhase(state);

      expect(state.phase).toBe('TOKEN_TRADING');

      // First attempt: Only alice selects
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 1,
        timestamp: Date.now()
      });

      // Try to advance - should fail
      let attemptedState = advancePhase(state);
      expect(attemptedState.phase).toBe('TOKEN_TRADING');

      // Bob selects token 2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'bob',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      });

      // Now advance should succeed
      attemptedState = advancePhase(state);
      expect(attemptedState.phase).toBe('READY_UP');
    });
  });

  describe('Card Back Color Consistency', () => {
    test('should maintain same card back color throughout game', () => {
      const players = [
        { id: 'p1', name: 'P1', isHost: true },
        { id: 'p2', name: 'P2', isHost: false }
      ];

      let state = createInitialState(players);
      const initialColor = state.cardBackColor;

      expect(['blue', 'red']).toContain(initialColor);

      // Progress through game
      state = startGame(state);
      expect(state.cardBackColor).toBe(initialColor);

      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);
      expect(state.cardBackColor).toBe(initialColor);

      state = advancePhase(state);
      expect(state.cardBackColor).toBe(initialColor);
    });
  });
});
