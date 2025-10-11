// @ts-check

const { MIN_PLAYERS, MAX_PLAYERS, MIN_TURN, MAX_TURN } = require('./constants');

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

/**
 * @typedef {Object} DealHoleCardsResult
 * @property {Card[][]} holeCards - Array of hands, each hand has 2 cards
 * @property {Card[]} remainingDeck - Deck after dealing
 */

/**
 * Deals 2 hole cards to each player
 * @param {Card[]} deck - The deck to deal from
 * @param {number} playerCount - Number of players
 * @returns {DealHoleCardsResult} Hole cards for each player and remaining deck
 */
function dealHoleCards(deck, playerCount) {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new Error(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
  }

  const deckCopy = [...deck];
  /** @type {Card[][]} */
  const holeCards = [];

  for (let i = 0; i < playerCount; i++) {
    const card1 = deckCopy.shift();
    const card2 = deckCopy.shift();
    if (!card1 || !card2) {
      throw new Error('Not enough cards in deck to deal hole cards');
    }
    holeCards.push([card1, card2]);
  }

  return {
    holeCards,
    remainingDeck: deckCopy
  };
}

/**
 * @typedef {Object} DealCommunityCardsResult
 * @property {Card[]} communityCards - Community cards dealt this turn
 * @property {Card[]} remainingDeck - Deck after dealing
 */

/**
 * Deals community cards based on turn number
 * Turn 1: 0 cards (hole cards only - no community cards yet)
 * Turn 2: 3 cards (the flop)
 * Turn 3: 1 card (the turn - 4th community card)
 * Turn 4: 1 card (the river - 5th community card)
 * @param {Card[]} deck - The deck to deal from
 * @param {number} turn - Current turn number
 * @returns {DealCommunityCardsResult} Community cards and remaining deck
 */
function dealCommunityCards(deck, turn) {
  if (turn < MIN_TURN || turn > MAX_TURN) {
    throw new Error(`Turn must be between ${MIN_TURN} and ${MAX_TURN}`);
  }

  const deckCopy = [...deck];
  /** @type {Card[]} */
  const communityCards = [];

  let cardsToDeal = 0;
  if (turn === 1) {
    cardsToDeal = 0; // Turn 1: Hole cards only, no community cards
  } else if (turn === 2) {
    cardsToDeal = 3; // Turn 2: The Flop (3 cards)
  } else if (turn === 3 || turn === 4) {
    cardsToDeal = 1; // Turn 3: The Turn, Turn 4: The River (1 card each)
  }

  for (let i = 0; i < cardsToDeal; i++) {
    const card = deckCopy.shift();
    if (!card) {
      throw new Error('Not enough cards in deck to deal community cards');
    }
    communityCards.push(card);
  }

  return {
    communityCards,
    remainingDeck: deckCopy
  };
}

module.exports = {
  RANKS,
  SUITS,
  createDeck,
  shuffleDeck,
  randomizeCardBackColor,
  dealHoleCards,
  dealCommunityCards
};
