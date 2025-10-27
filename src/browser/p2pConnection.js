// @ts-check
import Peer from 'peerjs';
import { serializeMessage, deserializeMessage } from './p2pProtocol.js';

/**
 * Default peer factory (creates real Peer instance)
 * @returns {Peer} Peer instance
 */
function defaultPeerFactory() {
  return new Peer();
}

/**
 * ConnectionManager handles P2P connections using PeerJS
 * Supports both host (server) and client modes
 */
export class ConnectionManager {
  /**
   * @param {Function} [peerFactory] - Factory function for creating Peer (for testing)
   */
  constructor(peerFactory = defaultPeerFactory) {
    this.peerFactory = peerFactory;
    this.peer = null;
    this.peerId = null;
    this.isHost = false;
    /** @type {Array<*>} */
    this.connections = [];
    /** @type {Array<Function>} */
    this._messageCallbacks = [];
  }

  /**
   * Initialize as host (creates a peer and waits for connections)
   * @param {string} [requestedPeerId] - Optional peer ID to reuse (for host refresh recovery)
   * @returns {Promise<string>} Host's peer ID
   */
  async createHost(requestedPeerId) {
    if (this.peer) {
      throw new Error('Already initialized');
    }

    return new Promise((resolve, reject) => {
      // Pass requested peer ID to Peer constructor if provided
      this.peer = requestedPeerId ? new Peer(requestedPeerId) : this.peerFactory();
      this.isHost = true;

      this.peer.on('open', (/** @type {string} */ id) => {
        this.peerId = id;
        resolve(id);
      });

      this.peer.on('error', (/** @type {*} */ error) => {
        // Check if error is due to peer ID already taken
        if (error && error.type === 'unavailable-id') {
          alert(`Error: Peer ID "${requestedPeerId}" is already in use. This is very rare and should be investigated.`);
        }
        reject(error);
      });

      // Listen for incoming connections
      this.peer.on('connection', (/** @type {*} */ conn) => {
        this._setupConnection(conn);
      });
    });
  }

  /**
   * Initialize as client and connect to host
   * @param {string} hostPeerId - Host's peer ID to connect to
   * @returns {Promise<void>}
   */
  async joinAsClient(hostPeerId) {
    if (this.peer) {
      throw new Error('Already initialized');
    }

    return new Promise((resolve, reject) => {
      this.peer = this.peerFactory();
      this.isHost = false;

      this.peer.on('open', (/** @type {string} */ id) => {
        this.peerId = id;

        // Connect to host
        const conn = this.peer.connect(hostPeerId);
        this._setupConnection(conn);

        conn.on('open', () => {
          resolve();
        });

        conn.on('error', (/** @type {*} */ error) => {
          reject(error);
        });
      });

      this.peer.on('error', (/** @type {*} */ error) => {
        reject(error);
      });
    });
  }

  /**
   * Sets up event handlers for a connection
   * @private
   * @param {*} conn - PeerJS connection
   */
  _setupConnection(conn) {
    conn.on('open', () => {
      this.connections.push(conn);
    });

    conn.on('data', (/** @type {*} */ data) => {
      const message = deserializeMessage(data);
      if (message) {
        this._messageCallbacks.forEach(callback => callback(message));
      }
    });

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c !== conn);
    });

    conn.on('error', (/** @type {*} */ error) => {
      console.error('Connection error:', error);
    });
  }

  /**
   * Register a callback for received messages
   * @param {Function} callback - Function to call when message received
   */
  onMessage(callback) {
    this._messageCallbacks.push(callback);
  }

  /**
   * Send a message to connected peers
   * @param {*} message - Message object (already in protocol format)
   */
  sendMessage(message) {
    const serialized = serializeMessage(message);

    if (this.connections.length === 0) {
      return;
    }

    this.connections.forEach(conn => {
      try {
        conn.send(serialized);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    });
  }

  /**
   * Get all active connections
   * @returns {Array<*>} Array of connections
   */
  getConnections() {
    return [...this.connections];
  }

  /**
   * Clean up and destroy peer
   */
  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections = [];
    this.peerId = null;
    this.isHost = false;
  }
}
