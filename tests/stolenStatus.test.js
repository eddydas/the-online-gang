// @ts-check
import { describe, test, expect } from 'vitest';
import { createInitialState, startGame, advancePhase, setPlayerReady, handleTokenAction } from '../src/browser/gameState.js';

/**
 * @typedef {import('../src/browser/tokens.js').TokenAction} TokenAction
 */

/**
 * Tests for token stolen status tracking feature
 * Verifies that stolenBy field is correctly tracked during TOKEN_TRADING phase
 */

describe('Token Stolen Status Tracking', () => {

  describe('Basic Stolen Status', () => {
    test('should not set stolenBy when player selects unowned token', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      expect(state.phase).toBe('TOKEN_TRADING');

      // P1 selects unowned token 1
      /** @type {TokenAction} */
      const action = {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      };

      state = handleTokenAction(state, action);

      // No player should have stolenBy set (can be null or undefined)
      expect(state.players[0].stolenBy).toBeFalsy();
      expect(state.players[1].stolenBy).toBeFalsy();
    });

    test('should set stolenBy when player steals token from another player', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // P1 selects token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // P2 steals token 1 from P1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 1001
      });

      // P1 should have stolenBy set to P2
      const p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBe('p2');

      // P2 should not have stolenBy set (they acquired the token)
      const p2 = state.players.find(p => p.id === 'p2');
      expect(p2?.stolenBy).toBeNull();
    });

    test('should not set stolenBy when player returns token to pool', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // P1 selects token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // P1 clicks their own token to return it
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1001
      });

      // No player should have stolenBy set (token returned to pool)
      expect(state.players[0].stolenBy).toBeFalsy();
      expect(state.players[1].stolenBy).toBeFalsy();
    });
  });

  describe('Multiple Steals', () => {
    test('should update stolenBy when token is stolen multiple times', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false },
        { id: 'p3', name: 'Player 3', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = setPlayerReady(state, 'p3', true);
      state = advancePhase(state);

      // P1 selects token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // P2 steals token 1 from P1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 1001
      });

      let p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBe('p2');

      // P3 steals token 1 from P2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p3',
        tokenNumber: 1,
        timestamp: 1002
      });

      // P1's stolenBy should remain 'p2' (not updated when someone else steals)
      p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBe('p2');

      // P2's stolenBy should now be 'p3'
      const p2 = state.players.find(p => p.id === 'p2');
      expect(p2?.stolenBy).toBe('p3');

      // P3 should not have stolenBy set
      const p3 = state.players.find(p => p.id === 'p3');
      expect(p3?.stolenBy).toBeNull();
    });

    test('should handle chain of steals correctly', () => {
      const players = [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
        { id: 'charlie', name: 'Charlie' }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'alice', true);
      state = setPlayerReady(state, 'bob', true);
      state = setPlayerReady(state, 'charlie', true);
      state = advancePhase(state);

      // Alice takes token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 1,
        timestamp: 1000
      });

      // Bob takes token 2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'bob',
        tokenNumber: 2,
        timestamp: 1001
      });

      // Charlie steals token 1 from Alice
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'charlie',
        tokenNumber: 1,
        timestamp: 1002
      });

      let alice = state.players.find(p => p.id === 'alice');
      expect(alice?.stolenBy).toBe('charlie');

      // Alice steals token 2 from Bob
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'alice',
        tokenNumber: 2,
        timestamp: 1003
      });

      // Alice's stolenBy should now be null (she acquired a new token)
      alice = state.players.find(p => p.id === 'alice');
      expect(alice?.stolenBy).toBeNull();

      // Bob's stolenBy should be 'alice'
      const bob = state.players.find(p => p.id === 'bob');
      expect(bob?.stolenBy).toBe('alice');
    });
  });

  describe('StolenBy Clears on Acquisition', () => {
    test('should clear stolenBy when victim acquires a different token', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // P1 selects token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // P2 steals token 1 from P1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 1001
      });

      let p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBe('p2');

      // P1 acquires token 2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 2,
        timestamp: 1002
      });

      // P1's stolenBy should now be cleared
      p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBeNull();
    });

    test('should clear stolenBy when victim steals a token from someone else', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false },
        { id: 'p3', name: 'Player 3', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = setPlayerReady(state, 'p3', true);
      state = advancePhase(state);

      // P1 selects token 1, P3 selects token 3
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p3',
        tokenNumber: 3,
        timestamp: 1001
      });

      // P2 steals token 1 from P1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 1002
      });

      let p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBe('p2');

      // P1 steals token 3 from P3
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 3,
        timestamp: 1003
      });

      // P1's stolenBy should be cleared (acquired new token)
      p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBeNull();

      // P3's stolenBy should be set to 'p1'
      const p3 = state.players.find(p => p.id === 'p3');
      expect(p3?.stolenBy).toBe('p1');
    });
  });

  describe('StolenBy Reset Between Turns', () => {
    test('should reset all stolenBy fields when advancing to next turn', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING (Turn 1)
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // P1 selects token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // P2 steals token 1 from P1 and also takes token 2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 1001
      });

      let p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBe('p2');

      // P1 takes token 2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 2,
        timestamp: 1002
      });

      // Advance to next turn (TOKEN_TRADING -> READY_UP for turn 2)
      state = advancePhase(state);

      // All stolenBy fields should be cleared
      state.players.forEach(player => {
        expect(player.stolenBy).toBeNull();
      });

      expect(state.turn).toBe(2);
      expect(state.phase).toBe('READY_UP');
    });

    test('should reset stolenBy even if player still has same token next turn', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Turn 1 - TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // P1 takes token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // P2 steals token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 1001
      });

      // P1 takes token 2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 2,
        timestamp: 1002
      });

      let p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBeNull(); // Already cleared when P1 acquired token 2

      // Advance to turn 2
      state = advancePhase(state);
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // Turn 2 - P2 takes token 1 again, P1 takes token 2 again
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 2000
      });

      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 2,
        timestamp: 2001
      });

      // All stolenBy should be null (no stealing occurred this turn)
      state.players.forEach(player => {
        expect(player.stolenBy).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should only track stealing during TOKEN_TRADING phase', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      expect(state.phase).toBe('READY_UP');

      // Try to handle token action during READY_UP (should be ignored)
      const stateBefore = state;
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // State should be unchanged
      expect(state).toBe(stateBefore);
      expect(state.players[0].stolenBy).toBeUndefined();
    });

    test('should handle all players with no tokens stolen', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false },
        { id: 'p3', name: 'Player 3', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = setPlayerReady(state, 'p3', true);
      state = advancePhase(state);

      // Each player selects a different token (no stealing)
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 2,
        timestamp: 1001
      });

      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p3',
        tokenNumber: 3,
        timestamp: 1002
      });

      // No player should have stolenBy set
      state.players.forEach(player => {
        expect(player.stolenBy).toBeNull();
      });
    });

    test('should handle player stealing back their own token', () => {
      const players = [
        { id: 'p1', name: 'Player 1', isHost: true },
        { id: 'p2', name: 'Player 2', isHost: false }
      ];

      let state = createInitialState(players);
      state = startGame(state);

      // Advance to TOKEN_TRADING
      state = setPlayerReady(state, 'p1', true);
      state = setPlayerReady(state, 'p2', true);
      state = advancePhase(state);

      // P1 takes token 1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // P2 steals token 1 from P1
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p2',
        tokenNumber: 1,
        timestamp: 1001
      });

      let p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBe('p2');

      // P1 steals token 1 back from P2
      state = handleTokenAction(state, {
        type: 'select',
        playerId: 'p1',
        tokenNumber: 1,
        timestamp: 1002
      });

      // P1's stolenBy should be cleared (acquired token)
      p1 = state.players.find(p => p.id === 'p1');
      expect(p1?.stolenBy).toBeNull();

      // P2's stolenBy should be set to 'p1'
      const p2 = state.players.find(p => p.id === 'p2');
      expect(p2?.stolenBy).toBe('p1');
    });
  });
});
