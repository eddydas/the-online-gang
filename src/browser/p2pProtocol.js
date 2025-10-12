// @ts-check

/**
 * @typedef {Object} Message
 * @property {string} type - Message type
 * @property {*} payload - Message payload (can be any JSON-serializable type)
 * @property {number} timestamp - Unix timestamp in milliseconds
 */

/**
 * Message type constants
 */
export const MESSAGE_TYPES = {
  STATE_UPDATE: 'STATE_UPDATE',
  PLAYER_JOIN: 'PLAYER_JOIN',
  PLAYER_LEAVE: 'PLAYER_LEAVE',
  PLAYER_READY: 'PLAYER_READY',
  TURN_READY: 'TURN_READY',
  TOKEN_SELECT: 'TOKEN_SELECT',
  PHASE_ADVANCE: 'PHASE_ADVANCE',
  GAME_START: 'GAME_START',
  GAME_RESET: 'GAME_RESET',
  PING: 'PING',
  PONG: 'PONG'
};

/**
 * Creates a P2P message with standard structure
 * @param {string} type - Message type
 * @param {*} payload - Message payload
 * @returns {Message} Message object
 */
export function createMessage(type, payload) {
  return {
    type,
    payload,
    timestamp: Date.now()
  };
}

/**
 * Serializes a message to JSON string for transmission
 * @param {Message} message - Message to serialize
 * @returns {string} JSON string
 */
export function serializeMessage(message) {
  return JSON.stringify(message);
}

/**
 * Deserializes a JSON string to message object
 * @param {string} jsonString - JSON string to parse
 * @returns {Message|null} Message object or null if invalid
 */
export function deserializeMessage(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);

    if (!isValidMessage(parsed)) {
      return null;
    }

    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Validates message structure
 * @param {*} message - Object to validate
 * @returns {boolean} True if valid message structure
 */
export function isValidMessage(message) {
  if (!message || typeof message !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof message.type !== 'string') {
    return false;
  }

  if (!('payload' in message)) {
    return false;
  }

  // Timestamp is optional - host will assign it on receipt for client messages
  if ('timestamp' in message && typeof message.timestamp !== 'number') {
    return false;
  }

  return true;
}
