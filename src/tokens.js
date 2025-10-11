// @ts-check

/**
 * @typedef {Object} Token
 * @property {number} number - Token number (1 to N)
 * @property {string|null} ownerId - Player ID who owns this token
 * @property {number} timestamp - When token was last selected
 */

/**
 * @typedef {Object} TokenAction
 * @property {'select'|'steal'} type - Action type
 * @property {string} playerId - Player performing action
 * @property {number} tokenNumber - Token number
 * @property {number} timestamp - Action timestamp
 */

/**
 * Generates N tokens for the game
 * @param {number} playerCount - Number of players (2-8)
 * @returns {Token[]} Array of tokens numbered 1 to N
 */
function generateTokens(playerCount) {
  /** @type {Token[]} */
  const tokens = [];

  for (let i = 1; i <= playerCount; i++) {
    tokens.push({
      number: i,
      ownerId: null,
      timestamp: 0
    });
  }

  return tokens;
}

/**
 * Applies a token action (select or steal) with conflict resolution
 * @param {Token[]} tokens - Current token state
 * @param {TokenAction} action - Selection or steal action
 * @returns {Token[]} Updated token state (new array)
 */
function applyTokenAction(tokens, action) {
  const tokensCopy = tokens.map(t => ({ ...t }));
  const token = tokensCopy.find(t => t.number === action.tokenNumber);

  if (!token) {
    throw new Error(`Token ${action.tokenNumber} not found`);
  }

  // Release any token currently owned by this player
  const currentToken = tokensCopy.find(t => t.ownerId === action.playerId);
  if (currentToken && currentToken.number !== action.tokenNumber) {
    currentToken.ownerId = null;
    currentToken.timestamp = 0;
  }

  // Handle conflict resolution
  if (action.type === 'select') {
    // If same player owns the token, always update timestamp
    if (token.ownerId === action.playerId) {
      token.timestamp = action.timestamp;
    }
    // For 'select', earlier timestamp wins (conflict resolution)
    else if (token.ownerId === null || action.timestamp < token.timestamp) {
      token.ownerId = action.playerId;
      token.timestamp = action.timestamp;
    }
    // If different player and later timestamp, keep existing owner
  } else if (action.type === 'steal') {
    // For 'steal', always take the token (explicit steal)
    token.ownerId = action.playerId;
    token.timestamp = action.timestamp;
  }

  return tokensCopy;
}

/**
 * Initializes empty token history for a player (4 turns)
 * @returns {(number|null)[]} Array of 4 nulls
 */
function initializePlayerTokenHistory() {
  return [null, null, null, null];
}

/**
 * Updates token history for a specific turn
 * @param {(number|null)[]} history - Current history array
 * @param {number} turn - Turn number (1-4)
 * @param {number} tokenNumber - Token number selected
 * @returns {(number|null)[]} Updated history (new array)
 */
function updateTokenHistory(history, turn, tokenNumber) {
  const historyCopy = [...history];
  historyCopy[turn - 1] = tokenNumber;
  return historyCopy;
}

module.exports = {
  generateTokens,
  applyTokenAction,
  initializePlayerTokenHistory,
  updateTokenHistory
};
