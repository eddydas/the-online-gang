// @ts-check

/**
 * @typedef {Object} Card
 * @property {string} rank - Card rank (2-10, J, Q, K, A)
 * @property {string} suit - Card suit (♠, ♥, ♦, ♣)
 */

/**
 * @typedef {'blue' | 'red'} CardBackColor
 */

/**
 * Card ranks (2 through Ace)
 * @type {ReadonlyArray<string>}
 */
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Card suits
 * @type {ReadonlyArray<string>}
 */
const SUITS = ['♠', '♥', '♦', '♣'];

/**
 * Creates a standard 52-card deck
 * @returns {Card[]} Array of card objects with rank and suit
 */
function createDeck() {
  /** @type {Card[]} */
  const deck = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }

  return deck;
}

/**
 * Shuffles a deck using Fisher-Yates algorithm
 * @param {Card[]} deck - The deck to shuffle
 * @returns {Card[]} The shuffled deck (new array, original unchanged)
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Randomizes card back color for the game
 * @returns {CardBackColor} Either 'blue' or 'red'
 */
function randomizeCardBackColor() {
  return Math.random() < 0.5 ? 'blue' : 'red';
}

module.exports = {
  RANKS,
  SUITS,
  createDeck,
  shuffleDeck,
  randomizeCardBackColor
};
