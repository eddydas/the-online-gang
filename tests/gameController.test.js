// @ts-check
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GameController } from '../src/browser/gameController.js';

describe('GameController', () => {
  describe('sendMessage', () => {
    test('should add timestamp to messages without timestamp', () => {
      const controller = new GameController();

      // Mock connection manager
      const mockSendMessage = vi.fn();
      controller.connectionManager = {
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      };

      const messageWithoutTimestamp = {
        type: 'JOIN_REQUEST',
        payload: { playerId: 'test-player', playerName: 'Test' }
      };

      controller.sendMessage(messageWithoutTimestamp);

      // Verify sendMessage was called with timestamp added
      expect(mockSendMessage).toHaveBeenCalledOnce();
      const sentMessage = mockSendMessage.mock.calls[0][0];

      expect(sentMessage).toHaveProperty('type', 'JOIN_REQUEST');
      expect(sentMessage).toHaveProperty('payload');
      expect(sentMessage).toHaveProperty('timestamp');
      expect(typeof sentMessage.timestamp).toBe('number');
      expect(sentMessage.timestamp).toBeGreaterThan(0);
    });

    test('should preserve existing timestamp if present', () => {
      const controller = new GameController();

      // Mock connection manager
      const mockSendMessage = vi.fn();
      controller.connectionManager = {
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      };

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

  describe('message validation', () => {
    test('all message types should include timestamp', () => {
      const controller = new GameController();

      const mockSendMessage = vi.fn();
      controller.connectionManager = {
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      };

      // Test various message types
      const messageTypes = [
        { type: 'JOIN_REQUEST', payload: { playerId: 'p1', playerName: 'Player 1' } },
        { type: 'LOBBY_UPDATE', payload: { lobbyState: [] } },
        { type: 'PLAYER_READY', payload: { playerId: 'p1', isReady: true } },
        { type: 'TOKEN_ACTION', payload: { type: 'select', playerId: 'p1', tokenNumber: 1 } },
        { type: 'PROCEED_TURN', payload: { playerId: 'p1' } }
      ];

      messageTypes.forEach((message) => {
        mockSendMessage.mockClear();
        controller.sendMessage(message);

        const sentMessage = mockSendMessage.mock.calls[0][0];
        expect(sentMessage).toHaveProperty('timestamp');
        expect(typeof sentMessage.timestamp).toBe('number');
      });
    });
  });
});
