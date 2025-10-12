// @ts-check

import {  TOTAL_TURNS  } from "./constants.js";

/**
 * @typedef {Object} Token
 * @property {number} number - Token number (1 to N)
 * @property {string|null} ownerId - Player ID who owns this token
 * @property {number} timestamp - When token was last selected
 */

/**
 * @typedef {Object} TokenAction
 * @property {'select'} type - Action type (always 'select')
 * @property {string} playerId - Player performing action
 * @property {number} tokenNumber - Token number
 * @property {number} timestamp - Action timestamp
 */

/**
 * Generates N tokens for the game
 * @param {number} playerCount - Number of players
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
 * Applies a token selection with conflict resolution
 * Clicking your own token returns it to unowned.
 * Later timestamp wins conflicts. If timestamps equal, lower player ID wins.
 * @param {Token[]} tokens - Current token state
 * @param {TokenAction} action - Selection action
 * @returns {Token[]} Updated token state (new array)
 */
function applyTokenAction(tokens, action) {
  const tokensCopy = tokens.map(t => ({ ...t }));
  const token = tokensCopy.find(t => t.number === action.tokenNumber);

  if (!token) {
    throw new Error(`Token ${action.tokenNumber} not found`);
  }

  // If clicking your own token, return it to unowned
  if (token.ownerId === action.playerId) {
    token.ownerId = null;
    token.timestamp = 0;
    return tokensCopy;
  }

  // Release any token currently owned by this player
  const currentToken = tokensCopy.find(t => t.ownerId === action.playerId);
  if (currentToken && currentToken.number !== action.tokenNumber) {
    currentToken.ownerId = null;
    currentToken.timestamp = 0;
  }

  // Take the token with conflict resolution:
  // - Later timestamp wins
  // - If timestamps equal, lower player ID wins (lexicographical)
  const shouldTakeToken =
    token.ownerId === null || // Token is unowned
    action.timestamp > token.timestamp || // Later timestamp wins
    (action.timestamp === token.timestamp && action.playerId < token.ownerId); // Tie-breaker

  if (shouldTakeToken) {
    token.ownerId = action.playerId;
    token.timestamp = action.timestamp;
  }

  return tokensCopy;
}

/**
 * Initializes empty token history for a player (TOTAL_TURNS turns)
 * @returns {(number|null)[]} Array of TOTAL_TURNS nulls
 */
function initializePlayerTokenHistory() {
  return Array(TOTAL_TURNS).fill(null);
}

/**
 * Updates token history for a specific turn
 * @param {(number|null)[]} history - Current history array
 * @param {number} turn - Turn number (1 to TOTAL_TURNS)
 * @param {number} tokenNumber - Token number selected
 * @returns {(number|null)[]} Updated history (new array)
 */
function updateTokenHistory(history, turn, tokenNumber) {
  const historyCopy = [...history];
  historyCopy[turn - 1] = tokenNumber;
  return historyCopy;
}

/**
 * Resets all tokens to unowned state
 * @param {Token[]} tokens - Current token array
 * @returns {Token[]} Tokens with all owners cleared (new array)
 */
function resetTokens(tokens) {
  return tokens.map(token => ({
    ...token,
    ownerId: null,
    timestamp: 0
  }));
}

export {
  generateTokens,
  applyTokenAction,
  initializePlayerTokenHistory,
  updateTokenHistory,
  resetTokens
};
