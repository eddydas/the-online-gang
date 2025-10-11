// @ts-check

/**
 * Generates a shareable link with the peer ID embedded
 * @param {string} peerId - The peer ID to embed in the link
 * @param {string} [baseUrl] - Base URL (defaults to window.location.href)
 * @returns {string} Shareable link with peer ID
 * @throws {Error} If no baseUrl provided and window is undefined
 */
export function generateShareableLink(peerId, baseUrl) {
  // Use provided baseUrl or fallback to window.location.href
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.href : '');

  if (!url) {
    throw new Error('No base URL available - provide baseUrl or run in browser environment');
  }

  const urlObj = new URL(url);
  urlObj.searchParams.set('peer', peerId);

  return urlObj.toString();
}

/**
 * Parses peer ID from URL query parameter
 * @param {string} [url] - URL to parse (defaults to window.location.href)
 * @returns {string|null} Peer ID if found, null otherwise
 */
export function parsePeerIdFromUrl(url) {
  // Use provided url or fallback to window.location.href
  const urlString = url || (typeof window !== 'undefined' ? window.location.href : '');

  try {
    const urlObj = new URL(urlString);
    const peerId = urlObj.searchParams.get('peer');

    // Return null if peer param is empty string
    return peerId && peerId.trim() !== '' ? peerId : null;
  } catch (e) {
    // Invalid URL
    return null;
  }
}
