// @ts-check

/**
 * Game configuration constants
 * These can be adjusted for different game variants
 */

/**
 * Minimum number of players allowed in a game
 * @type {number}
 */
const MIN_PLAYERS = 2;

/**
 * Maximum number of players allowed in a game
 * Can be increased if game design changes (would need more tokens)
 * @type {number}
 */
const MAX_PLAYERS = 8;

/**
 * Number of turns in a complete game
 * @type {number}
 */
const TOTAL_TURNS = 4;

/**
 * Minimum valid turn number
 * @type {number}
 */
const MIN_TURN = 1;

/**
 * Maximum valid turn number
 * @type {number}
 */
const MAX_TURN = 4;

module.exports = {
  MIN_PLAYERS,
  MAX_PLAYERS,
  TOTAL_TURNS,
  MIN_TURN,
  MAX_TURN
};
