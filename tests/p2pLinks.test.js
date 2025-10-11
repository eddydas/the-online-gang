// @ts-check
import { generateShareableLink, parsePeerIdFromUrl } from '../src/browser/p2pLinks.js';

describe('P2P Link Utilities', () => {

  describe('generateShareableLink', () => {
    test('should generate link with peer ID in query param (browser-style with trailing slash)', () => {
      const peerId = 'test-peer-123';
      const baseUrl = 'http://localhost:3000/'; // Browser-style URL

      const link = generateShareableLink(peerId, baseUrl);

      expect(link).toBe('http://localhost:3000/?peer=test-peer-123');
    });

    test('should handle baseUrl without trailing slash', () => {
      const peerId = 'test-peer-123';
      const baseUrl = 'http://localhost:3000'; // No trailing slash

      const link = generateShareableLink(peerId, baseUrl);

      // URL constructor normalizes this to include trailing slash
      expect(link).toBe('http://localhost:3000/?peer=test-peer-123');
    });

    test('should handle peer IDs with special characters', () => {
      const peerId = 'peer-with-dashes_and_underscores.123';
      const baseUrl = 'http://localhost:3000/';

      const link = generateShareableLink(peerId, baseUrl);

      expect(link).toBe('http://localhost:3000/?peer=peer-with-dashes_and_underscores.123');
    });

    test('should throw error if no base URL available', () => {
      const peerId = 'default-peer';

      // In test environment, window is undefined and no baseUrl provided
      expect(() => generateShareableLink(peerId)).toThrow();
    });

    test('should handle base URL with existing query params', () => {
      const peerId = 'test-peer';
      const baseUrl = 'http://localhost:3000/?existing=param'; // Browser-style

      const link = generateShareableLink(peerId, baseUrl);

      expect(link).toBe('http://localhost:3000/?existing=param&peer=test-peer');
    });

    test('should handle base URL with hash', () => {
      const peerId = 'test-peer';
      const baseUrl = 'http://localhost:3000/#section'; // Browser-style

      const link = generateShareableLink(peerId, baseUrl);

      expect(link).toBe('http://localhost:3000/?peer=test-peer#section');
    });
  });

  describe('parsePeerIdFromUrl', () => {
    test('should extract peer ID from URL with query param', () => {
      const url = 'http://localhost:3000?peer=test-peer-123';

      const peerId = parsePeerIdFromUrl(url);

      expect(peerId).toBe('test-peer-123');
    });

    test('should return null if no peer param exists', () => {
      const url = 'http://localhost:3000';

      const peerId = parsePeerIdFromUrl(url);

      expect(peerId).toBeNull();
    });

    test('should return null if peer param is empty', () => {
      const url = 'http://localhost:3000?peer=';

      const peerId = parsePeerIdFromUrl(url);

      expect(peerId).toBeNull();
    });

    test('should handle multiple query params', () => {
      const url = 'http://localhost:3000?foo=bar&peer=my-peer&baz=qux';

      const peerId = parsePeerIdFromUrl(url);

      expect(peerId).toBe('my-peer');
    });

    test('should handle URL with hash', () => {
      const url = 'http://localhost:3000?peer=test-peer#section';

      const peerId = parsePeerIdFromUrl(url);

      expect(peerId).toBe('test-peer');
    });

    test('should use window.location.href as default', () => {
      // Can't easily test this without mocking window.location
      // But we document the behavior
      const peerId = parsePeerIdFromUrl();

      // Will return null in test environment (no peer param)
      expect(peerId).toBeNull();
    });

    test('should handle peer IDs with special characters', () => {
      const url = 'http://localhost:3000?peer=peer-with-dashes_and_underscores.123';

      const peerId = parsePeerIdFromUrl(url);

      expect(peerId).toBe('peer-with-dashes_and_underscores.123');
    });
  });

});
