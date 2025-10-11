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

/**
 * @typedef {Object} DealHoleCardsResult
 * @property {Card[][]} holeCards - Array of hands, each hand has 2 cards
 * @property {Card[]} remainingDeck - Deck after dealing
 */

/**
 * Deals 2 hole cards to each player
 * @param {Card[]} deck - The deck to deal from
 * @param {number} playerCount - Number of players (2-8)
 * @returns {DealHoleCardsResult} Hole cards for each player and remaining deck
 */
function dealHoleCards(deck, playerCount) {
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
 * Turn 1: 3 cards (flop)
 * Turn 2: 1 card (turn)
 * Turn 3: 1 card (river)
 * Turn 4: 0 cards (no more dealing)
 * @param {Card[]} deck - The deck to deal from
 * @param {number} turn - Current turn number (1-4)
 * @returns {DealCommunityCardsResult} Community cards and remaining deck
 */
function dealCommunityCards(deck, turn) {
  const deckCopy = [...deck];
  /** @type {Card[]} */
  const communityCards = [];

  let cardsToDeal = 0;
  if (turn === 1) {
    cardsToDeal = 3; // Flop
  } else if (turn === 2 || turn === 3) {
    cardsToDeal = 1; // Turn or River
  } else {
    cardsToDeal = 0; // Turn 4, no more cards
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
