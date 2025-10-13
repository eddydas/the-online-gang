// @ts-check
import { describe, test, expect, beforeEach } from 'vitest';
import {
  validatePlayerName,
  canStartGame,
  getLobbyPlayers,
  addPlayer,
  removePlayer,
  updatePlayerReady,
  updatePlayerName,
  isNameTaken
} from '../src/browser/lobby.js';

/**
 * @typedef {Object} LobbyPlayer
 * @property {string} id - Player ID
 * @property {string} name - Player name
 * @property {boolean} isReady - Ready status
 * @property {boolean} isHost - Whether player is host
 * @property {string} avatarColor - Avatar background color (hex code)
 */

describe('Lobby System', () => {

  describe('Player Name Validation', () => {
    test('should accept valid names (1-20 chars)', () => {
      expect(validatePlayerName('Alice')).toBe(true);
      expect(validatePlayerName('A')).toBe(true);
      expect(validatePlayerName('12345678901234567890')).toBe(true); // 20 chars
    });

    test('should reject empty names', () => {
      expect(validatePlayerName('')).toBe(false);
      expect(validatePlayerName('   ')).toBe(false);
    });

    test('should reject names over 20 characters', () => {
      expect(validatePlayerName('123456789012345678901')).toBe(false); // 21 chars
    });

    test('should trim whitespace', () => {
      expect(validatePlayerName('  Alice  ')).toBe(true);
    });
  });

  describe('Game Start Conditions', () => {
    test('should allow start with 2+ players', () => {
      const players = [
        { id: 'p1', name: 'Alice', isReady: true, isHost: true, avatarColor: '#e74c3c' },
        { id: 'p2', name: 'Bob', isReady: true, isHost: false, avatarColor: '#3498db' }
      ];
      expect(canStartGame(players)).toBe(true);
    });

    test('should not allow start with less than 2 players', () => {
      const players = [
        { id: 'p1', name: 'Alice', isReady: true, isHost: true, avatarColor: '#e74c3c' }
      ];
      expect(canStartGame(players)).toBe(false);
    });

    test('should not allow start if any player not ready', () => {
      const players = [
        { id: 'p1', name: 'Alice', isReady: true, isHost: true, avatarColor: '#e74c3c' },
        { id: 'p2', name: 'Bob', isReady: false, isHost: false, avatarColor: '#3498db' }
      ];
      expect(canStartGame(players)).toBe(false);
    });

    test('should allow start with 8 players all ready', () => {
      const players = Array.from({ length: 8 }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Player ${i + 1}`,
        isReady: true,
        isHost: i === 0,
        avatarColor: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'][i]
      }));
      expect(canStartGame(players)).toBe(true);
    });
  });

  describe('Lobby State Management', () => {
    /** @type {LobbyPlayer[]} */
    let lobbyState;

    beforeEach(() => {
      lobbyState = [];
    });

    test('should add player to lobby', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', true, '#e74c3c');
      expect(lobbyState).toHaveLength(1);
      expect(lobbyState[0].id).toBe('p1');
      expect(lobbyState[0].name).toBe('Alice');
      expect(lobbyState[0].isHost).toBe(true);
      expect(lobbyState[0].isReady).toBe(false);
    });

    test('should add multiple players', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', true, '#e74c3c');
      lobbyState = addPlayer(lobbyState, 'p2', 'Bob', false, '#3498db');
      lobbyState = addPlayer(lobbyState, 'p3', 'Charlie', false, '#2ecc71');
      expect(lobbyState).toHaveLength(3);
    });

    test('should remove player from lobby', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', true, '#e74c3c');
      lobbyState = addPlayer(lobbyState, 'p2', 'Bob', false, '#3498db');
      lobbyState = removePlayer(lobbyState, 'p2');
      expect(lobbyState).toHaveLength(1);
      expect(lobbyState[0].id).toBe('p1');
    });

    test('should update player ready status', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', false, '#e74c3c');
      expect(lobbyState[0].isReady).toBe(false);

      lobbyState = updatePlayerReady(lobbyState, 'p1', true);
      expect(lobbyState[0].isReady).toBe(true);

      lobbyState = updatePlayerReady(lobbyState, 'p1', false);
      expect(lobbyState[0].isReady).toBe(false);
    });

    test('should update player name', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', false, '#e74c3c');
      expect(lobbyState[0].name).toBe('Alice');

      lobbyState = updatePlayerName(lobbyState, 'p1', 'Alicia');
      expect(lobbyState[0].name).toBe('Alicia');
    });

    test('should not allow name update when ready', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', false, '#e74c3c');
      lobbyState = updatePlayerReady(lobbyState, 'p1', true);

      // Try to update name while ready - should fail
      lobbyState = updatePlayerName(lobbyState, 'p1', 'Alicia');
      expect(lobbyState[0].name).toBe('Alice'); // Name unchanged
    });

    test('should get all lobby players', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', true, '#e74c3c');
      lobbyState = addPlayer(lobbyState, 'p2', 'Bob', false, '#3498db');

      const players = getLobbyPlayers(lobbyState);
      expect(players).toHaveLength(2);
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
    });

    test('should detect if name is taken', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', true, '#e74c3c');
      lobbyState = addPlayer(lobbyState, 'p2', 'Bob', false, '#3498db');

      expect(isNameTaken(lobbyState, 'Alice')).toBe(true);
      expect(isNameTaken(lobbyState, 'Bob')).toBe(true);
      expect(isNameTaken(lobbyState, 'Charlie')).toBe(false);
    });

    test('should detect if name is taken case-insensitive', () => {
      lobbyState = addPlayer(lobbyState, 'p1', 'Alice', true, '#e74c3c');

      expect(isNameTaken(lobbyState, 'alice')).toBe(true);
      expect(isNameTaken(lobbyState, 'ALICE')).toBe(true);
      expect(isNameTaken(lobbyState, 'aLiCe')).toBe(true);
    });
  });

  describe('Player State Immutability', () => {
    test('should not mutate original state when adding player', () => {
      const original = [
        { id: 'p1', name: 'Alice', isReady: false, isHost: true, avatarColor: '#e74c3c' }
      ];

      const updated = addPlayer(original, 'p2', 'Bob', false, '#3498db');

      expect(original).toHaveLength(1);
      expect(updated).toHaveLength(2);
      expect(updated).not.toBe(original);
    });

    test('should not mutate original state when removing player', () => {
      const original = [
        { id: 'p1', name: 'Alice', isReady: false, isHost: true, avatarColor: '#e74c3c' },
        { id: 'p2', name: 'Bob', isReady: false, isHost: false, avatarColor: '#3498db' }
      ];

      const updated = removePlayer(original, 'p2');

      expect(original).toHaveLength(2);
      expect(updated).toHaveLength(1);
      expect(updated).not.toBe(original);
    });

    test('should not mutate original state when updating ready status', () => {
      const original = [
        { id: 'p1', name: 'Alice', isReady: false, isHost: true, avatarColor: '#e74c3c' }
      ];

      const updated = updatePlayerReady(original, 'p1', true);

      expect(original[0].isReady).toBe(false);
      expect(updated[0].isReady).toBe(true);
      expect(updated).not.toBe(original);
    });
  });

});
