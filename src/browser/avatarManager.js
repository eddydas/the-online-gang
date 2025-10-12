// @ts-check

/**
 * Avatar Manager for player visual identity
 */

/**
 * Predefined color palette for avatars
 * High contrast colors that work well on poker green background
 */
const AVATAR_COLORS = [
  '#3498db', // Blue
  '#e74c3c', // Red
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e67e22', // Dark Orange
  '#34495e', // Dark Blue-Gray
];

/**
 * Get initials from player name
 * @param {string} name - Player name
 * @returns {string} - Initials (1-2 characters)
 */
export function getInitials(name) {
  if (!name) return '?';

  // Remove special characters
  const cleanName = name.replace(/[^a-zA-Z\s]/g, '');

  const words = cleanName.trim().split(/\s+/);

  if (words.length === 0) return '?';

  if (words.length === 1) {
    // Single word: return first 2 characters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words: return first letter of first 2 words
    return (words[0][0] + words[1][0]).toUpperCase();
  }
}

/**
 * Get deterministic color for player
 * Same player ID always gets same color
 * @param {string} playerId - Player ID
 * @returns {string} - Hex color code
 */
export function getAvatarColor(playerId) {
  // Simple hash function for deterministic color
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Create avatar element
 * @param {{ id: string, name: string }} player - Player object with id and name
 * @param {string} [size='medium'] - 'small', 'medium', 'large'
 * @returns {HTMLElement}
 */
export function createAvatarElement(player, size = 'medium') {
  const avatar = document.createElement('div');
  avatar.className = `player-avatar ${size}`;
  avatar.dataset.playerId = player.id;
  avatar.setAttribute('aria-label', `Avatar for ${player.name}`);

  const color = getAvatarColor(player.id);
  avatar.style.setProperty('--avatar-color', color);

  const initials = document.createElement('span');
  initials.className = 'avatar-initials';
  initials.textContent = getInitials(player.name);

  avatar.appendChild(initials);

  return avatar;
}
