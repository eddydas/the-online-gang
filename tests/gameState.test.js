// @ts-check
import { createInitialState,
  advancePhase,
  setPlayerReady,
  allPlayersReady,
  startGame,
  handleTokenAction,
  resetForNextGame
 } from '../src/browser/gameState.js';

/**
 * @typedef {import('../src/browser/tokens.js').TokenAction} TokenAction
 */

describe('Game State Machine', () => {

  describe('State Initialization', () => {
    test('should create initial lobby state', () => {
      const players = [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' }
      ];

      const state = createInitialState(players);

      expect(state.phase).toBe('LOBBY');
      expect(state.turn).toBe(0);
      expect(state.players).toEqual(players);
      expect(state.deck).toHaveLength(52);
      expect(state.communityCards).toEqual([]);
      expect(state.tokens).toEqual([]);
      expect(state.readyStatus).toEqual({});
    });

    test('should work with 2-8 players', () => {
      const players2 = [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }];
      const players8 = Array.from({ length: 8 }, (_, i) => ({ id: `p${i+1}`, name: `P${i+1}` }));

      expect(createInitialState(players2).players).toHaveLength(2);
      expect(createInitialState(players8).players).toHaveLength(8);
    });

    test('should randomize card back color', () => {
      const players = [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }];
      const state = createInitialState(players);

      expect(['blue', 'red']).toContain(state.cardBackColor);
    });
  });

  describe('Phase Transitions', () => {
    test('should transition from LOBBY to READY_UP on game start', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);

      state = startGame(state);

      expect(state.phase).toBe('READY_UP');
      expect(state.turn).toBe(1);
      expect(state.readyStatus).toEqual({ p1: false, p2: false });
    });

    test('should not transition from READY_UP until all players ready', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      state = setPlayerReady(state, 'p1', true);
      expect(allPlayersReady(state)).toBe(false);

      state = advancePhase(state);
      expect(state.phase).toBe('READY_UP'); // Should not advance
    });

    test('should transition from READY_UP to TOKEN_TRADING when all ready', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      expect(allPlayersReady(state)).toBe(true);

      state = advancePhase(state);
      expect(state.phase).toBe('TOKEN_TRADING');
    });

    test('should transition from TOKEN_TRADING to next turn directly', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);
      expect(state.turn).toBe(1);

      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // To TOKEN_TRADING

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

      state = advancePhase(state);

      // Should skip TURN_COMPLETE and go directly to next turn's READY_UP
      expect(state.phase).toBe('READY_UP');
      expect(state.turn).toBe(2);
    });

    test('should not transition from TOKEN_TRADING if not all tokens are owned', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // To TOKEN_TRADING

      // Only assign one token (not all)
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      });

      state = advancePhase(state);

      // Should remain in TOKEN_TRADING
      expect(state.phase).toBe('TOKEN_TRADING');
    });
  });

  describe('Turn Progression', () => {
    test('should advance turn directly from TOKEN_TRADING if turn < 4', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state); // Turn 1
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

      expect(state.turn).toBe(1);

      state = advancePhase(state); // Should go directly to READY_UP for turn 2

      expect(state.phase).toBe('READY_UP');
      expect(state.turn).toBe(2);
    });

    test('should go to END_GAME after turn 4', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      // Complete 4 turns
      for (let i = 1; i <= 4; i++) {
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

        state = advancePhase(state); // TURN_COMPLETE
        if (i < 4) {
          state = advancePhase(state); // READY_UP for next turn
        }
      }

      expect(state.turn).toBe(4);
      state = advancePhase(state);

      expect(state.phase).toBe('END_GAME');
    });

    test('should track turns 1 through 4', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      const turns = [];
      for (let i = 1; i <= 4; i++) {
        turns.push(state.turn);
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

        state = advancePhase(state); // TURN_COMPLETE
        if (i < 4) {
          state = advancePhase(state); // READY_UP
        }
      }

      expect(turns).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Card Dealing', () => {
    test('should deal hole cards when starting game', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);

      state = startGame(state);

      expect(state.players[0].holeCards).toHaveLength(2);
      expect(state.players[1].holeCards).toHaveLength(2);
    });

    test('should deal community cards based on turn', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state); // Turn 1

      expect(state.communityCards).toHaveLength(0); // Turn 1: no community cards

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

      state = advancePhase(state); // TURN_COMPLETE
      state = advancePhase(state); // READY_UP turn 2

      expect(state.communityCards).toHaveLength(3); // Turn 2: flop (3 cards)
    });
  });

  describe('Token System', () => {
    test('should generate tokens equal to player count', () => {
      const players = [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Carol' }
      ];
      let state = createInitialState(players);
      state = startGame(state);

      expect(state.tokens).toHaveLength(3);
      expect(state.tokens.map(t => t.number)).toEqual([1, 2, 3]);
    });

    test('should reset tokens to unowned when advancing to next turn', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state); // Turn 1

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // TOKEN_TRADING

      // Simulate token selection using handleTokenAction
      const action = {
        type: /** @type {const} */ ('select'),
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      };
      state = handleTokenAction(state, action);

      // Assign token 2 to p2
      state = handleTokenAction(state, {
        type: /** @type {const} */ ('select'),
        playerId: 'p2',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      });

      // Verify token is owned
      const token1Turn1 = state.tokens.find(t => t.number === 1);
      expect(token1Turn1?.ownerId).toBe('p1');
      expect(token1Turn1?.timestamp).toBeGreaterThan(0);

      // Advance to TURN_COMPLETE then to next turn
      state = advancePhase(state); // TURN_COMPLETE
      state = advancePhase(state); // READY_UP turn 2

      // Verify all tokens are reset (unowned)
      expect(state.turn).toBe(2);
      state.tokens.forEach(token => {
        expect(token.ownerId).toBeNull();
        expect(token.timestamp).toBe(0);
      });

      // Verify token numbers are preserved
      expect(state.tokens.map(t => t.number)).toEqual([1, 2]);
    });

    test('should reset tokens between all turns', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      for (let turn = 1; turn <= 3; turn++) {
        // Ready up
        state = setPlayerReady(state, 'p1', true);
        state = setPlayerReady(state, 'p2', true);
        state = advancePhase(state); // TOKEN_TRADING

        // Assign all tokens
        const action = {
          type: /** @type {const} */ ('select'),
          playerId: 'p1',
          tokenNumber: 1,
          timestamp: Date.now()
        };
        state = handleTokenAction(state, action);

        state = handleTokenAction(state, {
          type: /** @type {const} */ ('select'),
          playerId: 'p2',
          tokenNumber: 2,
          timestamp: Date.now() + 1
        });

        // Verify token is owned
        expect(state.tokens[0].ownerId).toBe('p1');

        // Advance phases
        state = advancePhase(state); // TURN_COMPLETE

        if (turn < 3) {
          state = advancePhase(state); // READY_UP next turn

          // Verify tokens are reset
          state.tokens.forEach(token => {
            expect(token.ownerId).toBeNull();
            expect(token.timestamp).toBe(0);
          });
        }
      }
    });
  });

  describe('Ready-Up Logic', () => {
    test('should initialize all players as not ready', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      expect(state.readyStatus).toEqual({ p1: false, p2: false });
      expect(allPlayersReady(state)).toBe(false);
    });

    test('should allow players to mark themselves ready', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      state = setPlayerReady(state, 'p1', true);

      expect(state.readyStatus['p1']).toBe(true);
      expect(state.readyStatus['p2']).toBe(false);
      expect(allPlayersReady(state)).toBe(false);
    });

    test('should detect when all players are ready', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);

      expect(allPlayersReady(state)).toBe(true);
    });

    test('should reset ready status for each turn', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);
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

      state = advancePhase(state); // TURN_COMPLETE
      state = advancePhase(state); // READY_UP turn 2

      expect(state.readyStatus).toEqual({ p1: false, p2: false });
    });
  });

  describe('Game Reset', () => {
    test('should reset game for next round after END_GAME', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      // Complete game to END_GAME
      for (let i = 1; i <= 4; i++) {
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

        state = advancePhase(state); // TURN_COMPLETE
        if (i < 4) {
          state = advancePhase(state); // READY_UP
        }
      }
      state = advancePhase(state); // END_GAME

      state = resetForNextGame(state);

      expect(state.phase).toBe('READY_UP');
      expect(state.turn).toBe(1);
      expect(state.communityCards).toEqual([]);
      expect(state.players[0].id).toBe('p1'); // Same player IDs
      expect(state.players[1].id).toBe('p2');
      expect(state.players[0].name).toBe('Alice'); // Same names
      expect(state.players[1].name).toBe('Bob');
      expect(state.players[0].holeCards).toHaveLength(2); // New cards dealt
    });
  });

  describe('State Immutability', () => {
    test('should not mutate original state', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      const state = createInitialState(players);
      const originalPhase = state.phase;

      const newState = startGame(state);

      expect(state.phase).toBe(originalPhase);
      expect(newState.phase).toBe('READY_UP');
      expect(newState).not.toBe(state);
    });
  });

  describe('Token Actions', () => {
    test('should handle token selection during TOKEN_TRADING phase', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      expect(state.phase).toBe('TOKEN_TRADING');

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

    test('should not apply token actions outside TOKEN_TRADING phase', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      // Still in READY_UP phase
      expect(state.phase).toBe('READY_UP');

      /** @type {TokenAction} */
      const action = {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: Date.now()
      };

      const newState = handleTokenAction(state, action);

      // State should be unchanged
      expect(newState).toBe(state);
      const token1 = newState.tokens.find(t => t.number === 1);
      expect(token1?.ownerId).toBeNull();
    });

    test('should handle token stealing', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
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
      expect(token1?.ownerId).toBe('p1');

      // P2 steals token 1
      /** @type {TokenAction} */
      action = {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: Date.now() + 1
      };
      state = handleTokenAction(state, action);

      token1 = state.tokens.find(t => t.number === 1);
      expect(token1?.ownerId).toBe('p2');
    });
  });

});
