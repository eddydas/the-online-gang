// @ts-check
import { broadcastState, applyStateUpdate } from '../src/browser/p2pSync.js';

describe('P2P State Synchronization', () => {

  describe('broadcastState', () => {
    test('should create STATE_UPDATE messages for all connections', () => {
      const state = {
        phase: 'TOKEN_TRADING',
        turn: 2,
        players: [{ id: 'p1', name: 'Alice' }]
      };

      const mockConnections = [
        { send: vi.fn() },
        { send: vi.fn() },
        { send: vi.fn() }
      ];

      broadcastState(state, mockConnections);

      // Should send to all connections
      expect(mockConnections[0].send).toHaveBeenCalledTimes(1);
      expect(mockConnections[1].send).toHaveBeenCalledTimes(1);
      expect(mockConnections[2].send).toHaveBeenCalledTimes(1);

      // Should send JSON string
      const sentData = mockConnections[0].send.mock.calls[0][0];
      expect(typeof sentData).toBe('string');

      // Should contain STATE_UPDATE message
      const message = JSON.parse(sentData);
      expect(message.type).toBe('STATE_UPDATE');
      expect(message.payload).toEqual(state);
      expect(message.timestamp).toBeTypeOf('number');
    });

    test('should handle empty connections array', () => {
      const state = { phase: 'LOBBY' };
      const mockConnections = [];

      // Should not throw
      expect(() => broadcastState(state, mockConnections)).not.toThrow();
    });

    test('should handle connection send failures gracefully', () => {
      const state = { phase: 'LOBBY' };
      const mockConnections = [
        { send: vi.fn(() => { throw new Error('Connection closed'); }) },
        { send: vi.fn() }
      ];

      // Should not throw and should continue to other connections
      expect(() => broadcastState(state, mockConnections)).not.toThrow();
      expect(mockConnections[1].send).toHaveBeenCalled();
    });

    test('should send identical message to all connections', () => {
      const state = { phase: 'READY_UP', turn: 1 };
      const mockConnections = [
        { send: vi.fn() },
        { send: vi.fn() }
      ];

      broadcastState(state, mockConnections);

      const message1 = mockConnections[0].send.mock.calls[0][0];
      const message2 = mockConnections[1].send.mock.calls[0][0];

      expect(message1).toBe(message2);
    });
  });

  describe('applyStateUpdate', () => {
    test('should replace local state with received state (host authority)', () => {
      const localState = {
        phase: 'LOBBY',
        turn: 0,
        players: []
      };

      const receivedState = {
        phase: 'TOKEN_TRADING',
        turn: 2,
        players: [{ id: 'p1', name: 'Alice' }]
      };

      const newState = applyStateUpdate(localState, receivedState);

      expect(newState).toEqual(receivedState);
      expect(newState).not.toBe(receivedState); // Should be new object
    });

    test('should not mutate original state', () => {
      const localState = { phase: 'LOBBY', turn: 0 };
      const receivedState = { phase: 'READY_UP', turn: 1 };

      const originalLocalPhase = localState.phase;

      applyStateUpdate(localState, receivedState);

      expect(localState.phase).toBe(originalLocalPhase);
    });

    test('should handle null/undefined received state', () => {
      const localState = { phase: 'LOBBY' };

      expect(applyStateUpdate(localState, null)).toEqual(localState);
      expect(applyStateUpdate(localState, undefined)).toEqual(localState);
    });

    test('should handle empty received state', () => {
      const localState = { phase: 'LOBBY', players: [] };
      const receivedState = {};

      const newState = applyStateUpdate(localState, receivedState);

      expect(newState).toEqual(receivedState);
    });

    test('should deep clone nested objects', () => {
      const localState = {
        players: [{ id: 'p1', name: 'Alice' }]
      };

      const receivedState = {
        players: [{ id: 'p2', name: 'Bob' }]
      };

      const newState = applyStateUpdate(localState, receivedState);

      // Mutating newState should not affect receivedState
      newState.players[0].name = 'Charlie';
      expect(receivedState.players[0].name).toBe('Bob');
    });

    test('should preserve all fields from received state', () => {
      const localState = {
        phase: 'LOBBY',
        turn: 0
      };

      const receivedState = {
        phase: 'TOKEN_TRADING',
        turn: 2,
        players: [{ id: 'p1' }],
        tokens: [{ number: 1 }],
        communityCards: [],
        newField: 'test'
      };

      const newState = applyStateUpdate(localState, receivedState);

      expect(newState).toEqual(receivedState);
      expect(newState.newField).toBe('test');
    });
  });

  describe('Integration: broadcast and apply', () => {
    test('should maintain state consistency across broadcast and apply', () => {
      const hostState = {
        phase: 'TOKEN_TRADING',
        turn: 3,
        players: [
          { id: 'p1', name: 'Alice', ready: true },
          { id: 'p2', name: 'Bob', ready: false }
        ],
        tokens: [
          { number: 1, owner: 'p1' },
          { number: 2, owner: null }
        ]
      };

      const mockConnection = { send: vi.fn() };

      // Host broadcasts
      broadcastState(hostState, [mockConnection]);

      // Client receives and applies
      const sentMessage = mockConnection.send.mock.calls[0][0];
      const receivedMessage = JSON.parse(sentMessage);
      const clientState = applyStateUpdate({}, receivedMessage.payload);

      // Client state should match host state
      expect(clientState).toEqual(hostState);
    });
  });

});
