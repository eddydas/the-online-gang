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
    /** @type {Array<Function>} */
    this._connectionStateCallbacks = [];
    /** @type {Array<Function>} */
    this._disconnectCallbacks = [];
    /** @type {string | null} */
    this.hostPeerId = null;
    /** @type {ReturnType<typeof setInterval> | null} */
    this._reconnectInterval = null;
    /** @type {number} */
    this._reconnectStartTime = 0;
    /** @type {number} */
    this.RECONNECT_MAX_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
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

      // Emit disconnect event with peer ID (host only)
      if (this.isHost && conn.peer) {
        this._emitPeerDisconnect(conn.peer);
      }
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
   * Register a callback for connection state changes
   * @param {Function} callback - Function to call when connection state changes
   */
  onConnectionStateChange(callback) {
    this._connectionStateCallbacks.push(callback);
  }

  /**
   * Register a callback for peer disconnections (host only)
   * @param {Function} callback - Function to call with disconnected peer ID
   */
  onPeerDisconnect(callback) {
    this._disconnectCallbacks.push(callback);
  }

  /**
   * Emit connection state change event
   * @private
   * @param {string} state - Connection state ('connecting' | 'connected' | 'disconnected' | 'reconnecting')
   */
  _emitConnectionState(state) {
    this._connectionStateCallbacks.forEach(callback => callback(state));
  }

  /**
   * Emit peer disconnect event (host only)
   * @private
   * @param {string} peerId - Peer ID of disconnected peer
   */
  _emitPeerDisconnect(peerId) {
    this._disconnectCallbacks.forEach(callback => callback(peerId));
  }

  /**
   * Initialize as client and connect to host
   * @param {string} hostPeerId - Host's peer ID to connect to
   * @param {string} [requestedPeerId] - Optional peer ID to reuse (for client refresh recovery)
   * @returns {Promise<void>}
   */
  async joinAsClient(hostPeerId, requestedPeerId) {
    if (this.peer) {
      throw new Error('Already initialized');
    }

    this.hostPeerId = hostPeerId;

    return new Promise((resolve, reject) => {
      // Pass requested peer ID to Peer constructor if provided
      this.peer = requestedPeerId ? new Peer(requestedPeerId) : this.peerFactory();
      this.isHost = false;

      this.peer.on('open', (/** @type {string} */ id) => {
        this.peerId = id;
        this._emitConnectionState('connecting');

        // Connect to host
        const conn = this.peer.connect(hostPeerId);
        this._setupConnection(conn);

        conn.on('open', () => {
          this._emitConnectionState('connected');
          resolve();
        });

        conn.on('error', (/** @type {*} */ error) => {
          reject(error);
        });

        conn.on('close', () => {
          // Connection closed - start reconnection
          this._startReconnection();
        });
      });

      this.peer.on('error', (/** @type {*} */ error) => {
        // Check if error is due to peer ID already taken
        if (error && error.type === 'unavailable-id') {
          alert(`Error: Peer ID "${requestedPeerId}" is already in use. This is very rare and should be investigated.`);
        }
        reject(error);
      });
    });
  }

  /**
   * Start reconnection attempts (client only)
   * @private
   */
  _startReconnection() {
    if (this.isHost || !this.hostPeerId) return;
    if (this._reconnectInterval) return; // Already reconnecting

    this._emitConnectionState('reconnecting');
    this._reconnectStartTime = Date.now();

    // Try to reconnect immediately
    this._attemptReconnect();

    // Then retry every 1 second
    this._reconnectInterval = setInterval(() => {
      const elapsed = Date.now() - this._reconnectStartTime;

      if (elapsed >= this.RECONNECT_MAX_DURATION) {
        // Give up after 1 hour
        this._stopReconnection();
        return;
      }

      this._attemptReconnect();
    }, 1000);
  }

  /**
   * Attempt to reconnect to host
   * @private
   */
  _attemptReconnect() {
    if (!this.peer || !this.hostPeerId) return;

    try {
      const conn = this.peer.connect(this.hostPeerId);
      this._setupConnection(conn);

      conn.on('open', () => {
        this._stopReconnection();
        this._emitConnectionState('connected');
      });

      conn.on('close', () => {
        // Will be handled by reconnection interval
      });
    } catch (error) {
      // Ignore connection errors during reconnection
      console.error('Reconnection attempt failed:', error);
    }
  }

  /**
   * Stop reconnection attempts
   * @private
   */
  _stopReconnection() {
    if (this._reconnectInterval) {
      clearInterval(this._reconnectInterval);
      this._reconnectInterval = null;
    }
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
    this._stopReconnection();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections = [];
    this.peerId = null;
    this.isHost = false;
    this.hostPeerId = null;
  }
}
