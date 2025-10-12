// @ts-check
import { ConnectionManager } from '../src/browser/p2pConnection.js';

describe('P2P Connection Manager', () => {

  describe('Constructor', () => {
    test('should create instance with default peer factory', () => {
      const manager = new ConnectionManager();

      expect(manager).toBeDefined();
      expect(manager.isHost).toBe(false);
      expect(manager.peerId).toBeNull();
    });

    test('should accept custom peer factory for testing', () => {
      const mockPeerFactory = vi.fn();
      const manager = new ConnectionManager(mockPeerFactory);

      expect(manager).toBeDefined();
    });
  });

  describe('createHost', () => {
    test('should initialize as host and return peer ID', async () => {
      const mockPeer = {
        id: 'test-host-123',
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('test-host-123'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      const peerId = await manager.createHost();

      expect(peerId).toBe('test-host-123');
      expect(manager.isHost).toBe(true);
      expect(manager.peerId).toBe('test-host-123');
      expect(mockPeerFactory).toHaveBeenCalled();
    });

    test('should set up connection listener for host', async () => {
      const mockPeer = {
        id: 'host-id',
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('host-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.createHost();

      // Should listen for 'connection' event
      const calls = mockPeer.on.mock.calls;
      const connectionCall = calls.find(call => call[0] === 'connection');
      expect(connectionCall).toBeDefined();
    });

    test('should throw error if already initialized', async () => {
      const mockPeer = {
        id: 'host-id',
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('host-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.createHost();

      await expect(manager.createHost()).rejects.toThrow('Already initialized');
    });
  });

  describe('joinAsClient', () => {
    test('should initialize as client and connect to host', async () => {
      const mockConnection = {
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback());
          }
        }),
        send: vi.fn(),
        close: vi.fn()
      };

      const mockPeer = {
        id: 'client-id',
        connect: vi.fn(() => mockConnection),
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('client-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.joinAsClient('host-peer-id');

      expect(manager.isHost).toBe(false);
      expect(manager.peerId).toBe('client-id');
      expect(mockPeer.connect).toHaveBeenCalledWith('host-peer-id');
    });

    test('should throw error if already initialized', async () => {
      const mockConnection = {
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback());
          }
        })
      };

      const mockPeer = {
        id: 'client-id',
        connect: vi.fn(() => mockConnection),
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('client-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.joinAsClient('host-id');

      await expect(manager.joinAsClient('another-host')).rejects.toThrow('Already initialized');
    });
  });

  describe('sendMessage', () => {
    test('should send message to all connections (host)', async () => {
      let connectionCallback;
      const mockConnection = {
        on: vi.fn(),
        send: vi.fn()
      };

      const mockPeer = {
        id: 'host-id',
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('host-id'));
          } else if (event === 'connection') {
            connectionCallback = callback;
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.createHost();

      // Simulate incoming connection
      connectionCallback(mockConnection);

      manager.sendMessage({ type: 'TEST', payload: {} });

      // Should send to connection (implementation will handle serialization)
      expect(mockConnection.send).toHaveBeenCalled();
    });

    test('should send message to host (client)', async () => {
      const mockConnection = {
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback());
          }
        }),
        send: vi.fn()
      };

      const mockPeer = {
        id: 'client-id',
        connect: vi.fn(() => mockConnection),
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('client-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.joinAsClient('host-id');

      manager.sendMessage({ type: 'TEST', payload: {} });

      expect(mockConnection.send).toHaveBeenCalled();
    });
  });

  describe('onMessage', () => {
    test('should register message callback', () => {
      const mockPeer = {
        id: 'test-id',
        on: vi.fn(),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      const callback = vi.fn();
      manager.onMessage(callback);

      expect(manager._messageCallbacks).toContain(callback);
    });

    test('should call callback when message received', async () => {
      let dataCallback;
      const mockConnection = {
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback());
          } else if (event === 'data') {
            dataCallback = callback;
          }
        }),
        send: vi.fn()
      };

      const mockPeer = {
        id: 'client-id',
        connect: vi.fn(() => mockConnection),
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('client-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      const callback = vi.fn();
      manager.onMessage(callback);

      await manager.joinAsClient('host-id');

      // Simulate receiving data
      if (dataCallback) {
        const message = JSON.stringify({ type: 'TEST', payload: {}, timestamp: Date.now() });
        dataCallback(message);

        expect(callback).toHaveBeenCalled();
      }
    });
  });

  describe('destroy', () => {
    test('should clean up peer and connections', async () => {
      const mockPeer = {
        id: 'test-id',
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('test-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.createHost();
      manager.destroy();

      expect(mockPeer.destroy).toHaveBeenCalled();
      expect(manager.peer).toBeNull();
    });
  });

  describe('getConnections', () => {
    test('should return array of active connections', async () => {
      const mockPeer = {
        id: 'host-id',
        on: vi.fn((event, callback) => {
          if (event === 'open') {
            setImmediate(() => callback('host-id'));
          }
        }),
        destroy: vi.fn()
      };

      const mockPeerFactory = vi.fn(() => mockPeer);
      const manager = new ConnectionManager(mockPeerFactory);

      await manager.createHost();

      const connections = manager.getConnections();

      expect(Array.isArray(connections)).toBe(true);
    });
  });

});
