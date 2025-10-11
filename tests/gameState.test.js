// @ts-check
import { createInitialState,
  advancePhase,
  setPlayerReady,
  allPlayersReady,
  startGame,
  resetForNextGame
 } from '../src/browser/gameState.js';

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

    test('should transition from TOKEN_TRADING to TURN_COMPLETE', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state);
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // To TOKEN_TRADING

      state = advancePhase(state);

      expect(state.phase).toBe('TURN_COMPLETE');
    });
  });

  describe('Turn Progression', () => {
    test('should advance turn from TURN_COMPLETE if turn < 4', () => {
      const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
      let state = createInitialState(players);
      state = startGame(state); // Turn 1
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state); // TOKEN_TRADING
      state = advancePhase(state); // TURN_COMPLETE

      expect(state.turn).toBe(1);

      state = advancePhase(state); // Should go to READY_UP for turn 2

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

});
