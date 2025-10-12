// @ts-check
import {
  createMessage,
  serializeMessage,
  deserializeMessage,
  isValidMessage
} from '../src/browser/p2pProtocol.js';

describe('P2P Message Protocol', () => {

  describe('createMessage', () => {
    test('should create STATE_UPDATE message', () => {
      const payload = { phase: 'LOBBY', players: [] };

      const message = createMessage('STATE_UPDATE', payload);

      expect(message.type).toBe('STATE_UPDATE');
      expect(message.payload).toEqual(payload);
      expect(message.timestamp).toBeTypeOf('number');
      expect(message.timestamp).toBeGreaterThan(0);
    });

    test('should create PLAYER_JOIN message', () => {
      const payload = { playerId: 'p1', name: 'Alice' };

      const message = createMessage('PLAYER_JOIN', payload);

      expect(message.type).toBe('PLAYER_JOIN');
      expect(message.payload).toEqual(payload);
    });

    test('should create PLAYER_READY message', () => {
      const payload = { playerId: 'p1', ready: true };

      const message = createMessage('PLAYER_READY', payload);

      expect(message.type).toBe('PLAYER_READY');
      expect(message.payload).toEqual(payload);
    });

    test('should create TOKEN_SELECT message', () => {
      const payload = { playerId: 'p1', tokenNumber: 3 };

      const message = createMessage('TOKEN_SELECT', payload);

      expect(message.type).toBe('TOKEN_SELECT');
      expect(message.payload).toEqual(payload);
    });

    test('should include timestamp in milliseconds', () => {
      const beforeTime = Date.now();
      const message = createMessage('PING', {});
      const afterTime = Date.now();

      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('serializeMessage', () => {
    test('should serialize message to JSON string', () => {
      const message = {
        type: 'STATE_UPDATE',
        payload: { turn: 1 },
        timestamp: 1234567890
      };

      const serialized = serializeMessage(message);

      expect(typeof serialized).toBe('string');
      expect(JSON.parse(serialized)).toEqual(message);
    });

    test('should handle complex nested payloads', () => {
      const message = {
        type: 'STATE_UPDATE',
        payload: {
          players: [
            { id: 'p1', name: 'Alice', cards: [{ rank: 'A', suit: '♠' }] }
          ],
          deck: [],
          tokens: [{ number: 1, owner: null }]
        },
        timestamp: Date.now()
      };

      const serialized = serializeMessage(message);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(message);
    });

    test('should handle null and undefined in payload', () => {
      const message = {
        type: 'TEST',
        payload: { a: null, b: undefined, c: 'value' },
        timestamp: Date.now()
      };

      const serialized = serializeMessage(message);
      const parsed = JSON.parse(serialized);

      // JSON.stringify removes undefined, keeps null
      expect(parsed.payload.a).toBeNull();
      expect(parsed.payload.b).toBeUndefined();
      expect(parsed.payload.c).toBe('value');
    });
  });

  describe('deserializeMessage', () => {
    test('should deserialize JSON string to message object', () => {
      const original = {
        type: 'PLAYER_JOIN',
        payload: { playerId: 'p1', name: 'Bob' },
        timestamp: 1234567890
      };
      const jsonString = JSON.stringify(original);

      const message = deserializeMessage(jsonString);

      expect(message).toEqual(original);
    });

    test('should return null for invalid JSON', () => {
      const invalidJson = 'not valid json {';

      const message = deserializeMessage(invalidJson);

      expect(message).toBeNull();
    });

    test('should return null for non-object JSON', () => {
      const jsonString = '"just a string"';

      const message = deserializeMessage(jsonString);

      expect(message).toBeNull();
    });

    test('should return null for JSON missing required fields', () => {
      const incomplete = JSON.stringify({ type: 'TEST' }); // Missing payload

      const message = deserializeMessage(incomplete);

      expect(message).toBeNull();
    });
  });

  describe('isValidMessage', () => {
    test('should validate correct message structure', () => {
      const message = {
        type: 'STATE_UPDATE',
        payload: { test: 'data' },
        timestamp: Date.now()
      };

      expect(isValidMessage(message)).toBe(true);
    });

    test('should reject message without type', () => {
      const message = {
        payload: {},
        timestamp: Date.now()
      };

      expect(isValidMessage(message)).toBe(false);
    });

    test('should reject message without payload', () => {
      const message = {
        type: 'TEST',
        timestamp: Date.now()
      };

      expect(isValidMessage(message)).toBe(false);
    });

    test('should accept message without timestamp (client messages)', () => {
      const message = {
        type: 'TEST',
        payload: {}
      };

      expect(isValidMessage(message)).toBe(true);
    });

    test('should reject message with non-number timestamp', () => {
      const message = {
        type: 'TEST',
        payload: {},
        timestamp: '1234567890'
      };

      expect(isValidMessage(message)).toBe(false);
    });

    test('should reject null or undefined', () => {
      expect(isValidMessage(null)).toBe(false);
      expect(isValidMessage(undefined)).toBe(false);
    });

    test('should allow any payload type (object, array, primitive)', () => {
      expect(isValidMessage({ type: 'T1', payload: {}, timestamp: 1 })).toBe(true);
      expect(isValidMessage({ type: 'T2', payload: [], timestamp: 1 })).toBe(true);
      expect(isValidMessage({ type: 'T3', payload: 'string', timestamp: 1 })).toBe(true);
      expect(isValidMessage({ type: 'T4', payload: 123, timestamp: 1 })).toBe(true);
      expect(isValidMessage({ type: 'T5', payload: null, timestamp: 1 })).toBe(true);
    });
  });

  describe('Message Type Constants', () => {
    test('should support all defined message types', () => {
      const types = [
        'STATE_UPDATE',
        'PLAYER_JOIN',
        'PLAYER_LEAVE',
        'PLAYER_READY',
        'TURN_READY',
        'TOKEN_SELECT',
        'TOKEN_STEAL',
        'PHASE_ADVANCE',
        'GAME_START',
        'GAME_RESET',
        'PING',
        'PONG'
      ];

      types.forEach(type => {
        const message = createMessage(type, {});
        expect(message.type).toBe(type);
        expect(isValidMessage(message)).toBe(true);
      });
    });
  });

  describe('Round-trip serialization', () => {
    test('should maintain data integrity through serialize -> deserialize', () => {
      const original = createMessage('STATE_UPDATE', {
        phase: 'TOKEN_TRADING',
        turn: 2,
        players: [
          { id: 'p1', name: 'Alice', ready: true }
        ],
        communityCards: [
          { rank: 'A', suit: '♠' },
          { rank: 'K', suit: '♥' }
        ]
      });

      const serialized = serializeMessage(original);
      const deserialized = deserializeMessage(serialized);

      expect(deserialized).toEqual(original);
    });
  });

});
