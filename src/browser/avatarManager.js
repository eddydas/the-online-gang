// @ts-check

/**
 * Avatar Manager for player visual identity
 */

/**
 * Predefined color palette for avatars
 * High contrast colors that work well on poker green background
 */
const AVATAR_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#34495e', // Dark Blue-Gray
  '#e67e22', // Dark Orange
  '#95a5a6', // Gray
  '#16a085', // Dark Teal
  '#27ae60', // Dark Green
  '#8e44ad', // Dark Purple
];

/**
 * Get next available color that's not already in use
 * @param {string[]} usedColors - Array of hex color codes already in use
 * @returns {string} - Hex color code
 */
export function getNextAvailableColor(usedColors) {
  // Find first color not in use
  for (const color of AVATAR_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }

  // If all colors are used, return first color (fallback)
  return AVATAR_COLORS[0];
}

/**
 * Get initials from player name
 * @param {string} name - Player name
 * @returns {string} - Initials (1-2 characters)
 */
export function getInitials(name) {
  if (!name) return '?';

  // Split by spaces first to preserve word boundaries
  const words = name.trim().split(/\s+/).filter(word => word.length > 0);

  if (words.length === 0) return '?';

  if (words.length === 1) {
    // Single word: return first 2 characters (removing special chars)
    const cleaned = words[0].replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.substring(0, 2).toUpperCase();
  } else {
    // Multiple words: return first character of first 2 words
    const first = words[0][0] || '';
    const second = words[1][0] || '';
    return (first + second).toUpperCase();
  }
}

/**
 * Create avatar element
 * @param {{ id: string, name: string, avatarColor?: string }} player - Player object with id, name, and optional color
 * @param {string} [size='medium'] - 'small', 'medium', 'large'
 * @returns {HTMLElement}
 */
export function createAvatarElement(player, size = 'medium') {
  const avatar = document.createElement('div');
  avatar.className = `player-avatar ${size}`;
  avatar.dataset.playerId = player.id;
  avatar.setAttribute('aria-label', `Avatar for ${player.name}`);

  // Use player's assigned color if available, otherwise use first color as fallback
  const color = player.avatarColor || AVATAR_COLORS[0];
  avatar.style.setProperty('--avatar-color', color);

  const initials = document.createElement('span');
  initials.className = 'avatar-initials';
  initials.textContent = getInitials(player.name);

  avatar.appendChild(initials);

  return avatar;
}
