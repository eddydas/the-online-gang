// @ts-check
import { createMessage, serializeMessage } from './p2pProtocol.js';

/**
 * Broadcasts game state to all connected peers
 * @param {Object} state - Current game state
 * @param {Array} connections - Array of peer connections
 */
export function broadcastState(state, connections) {
  const message = createMessage('STATE_UPDATE', state);
  const serialized = serializeMessage(message);

  connections.forEach(connection => {
    try {
      connection.send(serialized);
    } catch (error) {
      // Connection may be closed or in error state
      // Log in development, but don't throw
      if (typeof console !== 'undefined') {
        console.warn('Failed to send state to connection:', error);
      }
    }
  });
}

/**
 * Applies received state update to local state
 * (Client-side: host has authority, replace local state)
 * @param {Object} localState - Current local state
 * @param {Object} receivedState - State received from host
 * @returns {Object} New state (deep clone of received state)
 */
export function applyStateUpdate(localState, receivedState) {
  // Handle null/undefined
  if (receivedState == null) {
    return { ...localState };
  }

  // Deep clone the received state to avoid mutation issues
  return JSON.parse(JSON.stringify(receivedState));
}
