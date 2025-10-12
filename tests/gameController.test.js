// @ts-check
import { describe, test, expect, vi } from 'vitest';
import { GameController } from '../src/browser/gameController.js';

describe('GameController', () => {
  describe('sendMessage', () => {
    test('host should add timestamp to messages without timestamp', () => {
      const controller = new GameController();
      controller.isHost = true;

      // Mock connection manager
      const mockSendMessage = vi.fn();
      controller.connectionManager = /** @type {any} */ ({
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      });

      const messageWithoutTimestamp = {
        type: 'LOBBY_UPDATE',
        payload: { lobbyState: [] }
      };

      controller.sendMessage(messageWithoutTimestamp);

      // Verify sendMessage was called with timestamp added
      expect(mockSendMessage).toHaveBeenCalledOnce();
      const sentMessage = mockSendMessage.mock.calls[0][0];

      expect(sentMessage).toHaveProperty('type', 'LOBBY_UPDATE');
      expect(sentMessage).toHaveProperty('payload');
      expect(sentMessage).toHaveProperty('timestamp');
      expect(typeof sentMessage.timestamp).toBe('number');
      expect(sentMessage.timestamp).toBeGreaterThan(0);
    });

    test('client should NOT add timestamp to outgoing messages', () => {
      const controller = new GameController();
      controller.isHost = false;

      // Mock connection manager
      const mockSendMessage = vi.fn();
      controller.connectionManager = /** @type {any} */ ({
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      });

      const messageWithoutTimestamp = {
        type: 'JOIN_REQUEST',
        payload: { playerId: 'test-player', playerName: 'Test' }
      };

      controller.sendMessage(messageWithoutTimestamp);

      // Verify message was sent WITHOUT timestamp (host will assign it)
      expect(mockSendMessage).toHaveBeenCalledOnce();
      const sentMessage = mockSendMessage.mock.calls[0][0];

      expect(sentMessage).toHaveProperty('type', 'JOIN_REQUEST');
      expect(sentMessage).toHaveProperty('payload');
      expect(sentMessage).not.toHaveProperty('timestamp');
    });

    test('should preserve existing timestamp if present', () => {
      const controller = new GameController();
      controller.isHost = true;

      // Mock connection manager
      const mockSendMessage = vi.fn();
      controller.connectionManager = /** @type {any} */ ({
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      });

      const existingTimestamp = 1234567890;
      const messageWithTimestamp = {
        type: 'STATE_UPDATE',
        payload: { phase: 'TOKEN_TRADING' },
        timestamp: existingTimestamp
      };

      controller.sendMessage(messageWithTimestamp);

      // Verify original timestamp is preserved
      expect(mockSendMessage).toHaveBeenCalledOnce();
      const sentMessage = mockSendMessage.mock.calls[0][0];

      expect(sentMessage.timestamp).toBe(existingTimestamp);
    });

    test('should not send if connection manager is null', () => {
      const controller = new GameController();

      // No connection manager
      controller.connectionManager = null;

      // Should not throw
      expect(() => {
        controller.sendMessage({ type: 'TEST', payload: {} });
      }).not.toThrow();
    });
  });

  describe('handlePeerMessage', () => {
    test('host should assign timestamp to incoming client messages', () => {
      const controller = new GameController();
      controller.isHost = true;
      controller.lobbyState = [];

      /** @type {any} */
      const messageWithoutTimestamp = {
        type: 'JOIN_REQUEST',
        payload: { playerId: 'client-1', playerName: 'Client 1' }
      };

      // Message should not have timestamp initially
      expect(messageWithoutTimestamp).not.toHaveProperty('timestamp');

      controller.handlePeerMessage(messageWithoutTimestamp);

      // After handling, message should have timestamp assigned by host
      expect(messageWithoutTimestamp.timestamp).toBeDefined();
      expect(typeof messageWithoutTimestamp.timestamp).toBe('number');
      expect(messageWithoutTimestamp.timestamp).toBeGreaterThan(0);
    });

    test('client should not modify incoming message timestamps', () => {
      const controller = new GameController();
      controller.isHost = false;

      // Set up delegate to track if it's called
      const delegateMock = { onLobbyStateChange: vi.fn() };
      controller.setDelegate(delegateMock);

      const existingTimestamp = 1234567890;
      const messageFromHost = {
        type: 'LOBBY_UPDATE',
        payload: { lobbyState: [] },
        timestamp: existingTimestamp
      };

      controller.handlePeerMessage(messageFromHost);

      // Timestamp should remain unchanged
      expect(messageFromHost.timestamp).toBe(existingTimestamp);

      // Delegate should have been called
      expect(delegateMock.onLobbyStateChange).toHaveBeenCalled();
    });
  });

  describe('handleTokenAction', () => {
    test('host should update UI after handling token action', () => {
      const controller = new GameController();
      controller.isHost = true;
      controller.myPlayerId = 'host-id';

      // Create minimal game state with tokens
      controller.gameState = /** @type {any} */ ({
        phase: 'TOKEN_TRADING',
        turn: 1,
        players: [
          { id: 'host-id', name: 'Host', holeCards: [], tokenHistory: [null, null, null, null] },
          { id: 'player-2', name: 'Player 2', holeCards: [], tokenHistory: [null, null, null, null] }
        ],
        tokens: [
          { number: 1, ownerId: null, timestamp: 0 },
          { number: 2, ownerId: null, timestamp: 0 }
        ],
        readyStatus: {},
        communityCards: []
      });

      // Mock connection manager
      controller.connectionManager = /** @type {any} */ ({
        sendMessage: vi.fn(),
        getConnections: vi.fn(() => [])
      });

      // Mock updateGameUI to avoid DOM calls
      const updateGameUIMock = vi.fn();
      controller.updateGameUI = updateGameUIMock;

      // Simulate token action
      const tokenAction = {
        type: /** @type {const} */ ('select'),
        playerId: 'player-2',
        tokenNumber: 1,
        timestamp: Date.now()
      };

      controller.handleTokenAction(tokenAction);

      // Verify updateGameUI was called
      expect(updateGameUIMock).toHaveBeenCalledOnce();

      // Verify token ownership was updated
      const token1 = controller.gameState?.tokens.find(t => t.number === 1);
      expect(token1?.ownerId).toBe('player-2');
    });

    test('host should broadcast state after handling token action', () => {
      const controller = new GameController();
      controller.isHost = true;
      controller.myPlayerId = 'host-id';

      // Create minimal game state
      controller.gameState = /** @type {any} */ ({
        phase: 'TOKEN_TRADING',
        turn: 1,
        players: [
          { id: 'host-id', name: 'Host', holeCards: [], tokenHistory: [null, null, null, null] }
        ],
        tokens: [
          { number: 1, ownerId: null, timestamp: 0 }
        ],
        readyStatus: {},
        communityCards: []
      });

      // Mock connection manager
      const mockConnection = { send: vi.fn() };
      controller.connectionManager = /** @type {any} */ ({
        sendMessage: vi.fn(),
        getConnections: vi.fn(() => [mockConnection])
      });

      // Mock updateGameUI to avoid DOM calls
      controller.updateGameUI = vi.fn();

      // Simulate token action
      const tokenAction = {
        type: /** @type {const} */ ('select'),
        playerId: 'host-id',
        tokenNumber: 1,
        timestamp: Date.now()
      };

      controller.handleTokenAction(tokenAction);

      // Verify state was broadcast
      expect(mockConnection.send).toHaveBeenCalled();
    });

    test('client should not handle token actions', () => {
      const controller = new GameController();
      controller.isHost = false;

      // Create minimal game state
      controller.gameState = /** @type {any} */ ({
        tokens: [
          { number: 1, ownerId: null, timestamp: 0 }
        ]
      });

      // Simulate token action
      const tokenAction = {
        type: /** @type {const} */ ('select'),
        playerId: 'client-id',
        tokenNumber: 1,
        timestamp: Date.now()
      };

      controller.handleTokenAction(tokenAction);

      // Token should remain unchanged (client doesn't process actions)
      const token1 = controller.gameState?.tokens.find(t => t.number === 1);
      expect(token1?.ownerId).toBeNull();
    });

    test('host should update token history in real-time when token selected', () => {
      const controller = new GameController();
      controller.isHost = true;
      controller.myPlayerId = 'host-id';

      controller.gameState = /** @type {any} */ ({
        phase: 'TOKEN_TRADING',
        turn: 2,
        players: [
          { id: 'player-1', name: 'Player 1', holeCards: [], tokenHistory: [3, null, null, null] },
          { id: 'player-2', name: 'Player 2', holeCards: [], tokenHistory: [1, null, null, null] }
        ],
        tokens: [
          { number: 1, ownerId: null, timestamp: 0 },
          { number: 2, ownerId: null, timestamp: 0 }
        ],
        readyStatus: {},
        communityCards: []
      });

      controller.connectionManager = /** @type {any} */ ({
        sendMessage: vi.fn(),
        getConnections: vi.fn(() => [])
      });
      controller.updateGameUI = vi.fn();

      const tokenAction = {
        type: /** @type {const} */ ('select'),
        playerId: 'player-1',
        tokenNumber: 2,
        timestamp: Date.now()
      };

      controller.handleTokenAction(tokenAction);

      // Verify token history was updated for turn 2
      const player1 = controller.gameState?.players.find(p => p.id === 'player-1');
      expect(player1?.tokenHistory).toEqual([3, 2, null, null]);
    });

    test('host should clear token history when token returned to unowned', () => {
      const controller = new GameController();
      controller.isHost = true;
      controller.myPlayerId = 'host-id';

      controller.gameState = /** @type {any} */ ({
        phase: 'TOKEN_TRADING',
        turn: 1,
        players: [
          { id: 'player-1', name: 'Player 1', holeCards: [], tokenHistory: [2, null, null, null] }
        ],
        tokens: [
          { number: 2, ownerId: 'player-1', timestamp: 1000 }
        ],
        readyStatus: {},
        communityCards: []
      });

      controller.connectionManager = /** @type {any} */ ({
        sendMessage: vi.fn(),
        getConnections: vi.fn(() => [])
      });
      controller.updateGameUI = vi.fn();

      // Player clicks their own token to return it
      const tokenAction = {
        type: /** @type {const} */ ('select'),
        playerId: 'player-1',
        tokenNumber: 2,
        timestamp: Date.now()
      };

      controller.handleTokenAction(tokenAction);

      // Token history should be cleared for turn 1
      const player1 = controller.gameState?.players.find(p => p.id === 'player-1');
      expect(player1?.tokenHistory).toEqual([null, null, null, null]);
    });

    test('host should handle multiple players selecting different tokens', () => {
      const controller = new GameController();
      controller.isHost = true;
      controller.myPlayerId = 'host-id';

      controller.gameState = /** @type {any} */ ({
        phase: 'TOKEN_TRADING',
        turn: 3,
        players: [
          { id: 'player-1', name: 'Player 1', holeCards: [], tokenHistory: [1, 2, null, null] },
          { id: 'player-2', name: 'Player 2', holeCards: [], tokenHistory: [3, 1, null, null] },
          { id: 'player-3', name: 'Player 3', holeCards: [], tokenHistory: [2, 3, null, null] }
        ],
        tokens: [
          { number: 1, ownerId: null, timestamp: 0 },
          { number: 2, ownerId: null, timestamp: 0 },
          { number: 3, ownerId: null, timestamp: 0 }
        ],
        readyStatus: {},
        communityCards: []
      });

      controller.connectionManager = /** @type {any} */ ({
        sendMessage: vi.fn(),
        getConnections: vi.fn(() => [])
      });
      controller.updateGameUI = vi.fn();

      // Player 1 selects token 3
      controller.handleTokenAction({
        type: /** @type {const} */ ('select'),
        playerId: 'player-1',
        tokenNumber: 3,
        timestamp: Date.now()
      });

      // Player 2 selects token 2
      controller.handleTokenAction({
        type: /** @type {const} */ ('select'),
        playerId: 'player-2',
        tokenNumber: 2,
        timestamp: Date.now() + 1
      });

      // Player 3 selects token 1
      controller.handleTokenAction({
        type: /** @type {const} */ ('select'),
        playerId: 'player-3',
        tokenNumber: 1,
        timestamp: Date.now() + 2
      });

      const player1 = controller.gameState?.players.find(p => p.id === 'player-1');
      const player2 = controller.gameState?.players.find(p => p.id === 'player-2');
      const player3 = controller.gameState?.players.find(p => p.id === 'player-3');

      expect(player1?.tokenHistory).toEqual([1, 2, 3, null]);
      expect(player2?.tokenHistory).toEqual([3, 1, 2, null]);
      expect(player3?.tokenHistory).toEqual([2, 3, 1, null]);
    });
  });
});
