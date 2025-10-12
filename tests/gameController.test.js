// @ts-check
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GameController } from '../src/browser/gameController.js';

describe('GameController', () => {
  describe('sendMessage', () => {
    test('host should add timestamp to messages without timestamp', () => {
      const controller = new GameController();
      controller.isHost = true;

      // Mock connection manager
      const mockSendMessage = vi.fn();
      controller.connectionManager = {
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      };

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
      controller.connectionManager = {
        sendMessage: mockSendMessage,
        getConnections: vi.fn(() => [])
      };

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

  describe('handlePeerMessage', () => {
    test('host should assign timestamp to incoming client messages', () => {
      const controller = new GameController();
      controller.isHost = true;
      controller.lobbyState = [];

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
      controller.updateLobbyUI = vi.fn();

      const existingTimestamp = 1234567890;
      const messageFromHost = {
        type: 'LOBBY_UPDATE',
        payload: { lobbyState: [] },
        timestamp: existingTimestamp
      };

      controller.handlePeerMessage(messageFromHost);

      // Timestamp should remain unchanged
      expect(messageFromHost.timestamp).toBe(existingTimestamp);
    });
  });
});
