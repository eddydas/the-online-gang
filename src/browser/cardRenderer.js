// @ts-check

/**
 * Card rendering module - creates DOM elements for playing cards
 * Minimalist design based on reference poker table
 */

/**
 * @typedef {import('./deck.js').Card} Card
 */

/**
 * Create a card element with minimalist design
 * @param {Card} card - The card to render
 * @param {boolean} faceDown - Whether card is face down
 * @returns {HTMLElement} - Card DOM element
 */
export function createCardElement(card, faceDown = false) {
  const cardEl = document.createElement('div');

  // Add data attributes for card identification
  cardEl.dataset.rank = card.rank;
  cardEl.dataset.suit = card.suit;

  if (faceDown) {
    // Card back
    cardEl.className = 'card card-back';
    cardEl.innerHTML = '<div class="card-inner"></div>';
  } else {
    // Card face - minimalist design (rank + suit only)
    const suitClass = (card.suit === '♥' || card.suit === '♦') ? 'red-suit' : 'black-suit';
    cardEl.className = `card ${suitClass}`;

    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="card-rank">${card.rank}</div>
        <div class="card-suit large">${card.suit}</div>
      </div>
    `;
  }

  return cardEl;
}

/**
 * Create multiple card elements
 * @param {Card[]} cards - Array of cards
 * @param {boolean} faceDown - Whether cards are face down
 * @returns {HTMLElement[]} - Array of card elements
 */
export function createCardElements(cards, faceDown = false) {
  return cards.map(card => createCardElement(card, faceDown));
}

/**
 * Render player's hole cards
 * @param {HTMLElement} container - Container element
 * @param {Card[]} cards - Player's 2 hole cards
 * @param {boolean} faceDown - Whether cards are face down
 */
export function renderHoleCards(container, cards, faceDown = false) {
  container.innerHTML = '';
  const cardElements = createCardElements(cards, faceDown);
  cardElements.forEach(cardEl => container.appendChild(cardEl));
}

/**
 * Render community cards
 * @param {HTMLElement} container - Container element
 * @param {Card[]} cards - Community cards (up to 5)
 */
export function renderCommunityCards(container, cards) {
  container.innerHTML = '';
  const cardElements = createCardElements(cards, false);
  cardElements.forEach(cardEl => container.appendChild(cardEl));
}

/**
 * Highlight specific cards (for showing best hand)
 * @param {Card[]} bestFiveCards - Array of cards to highlight
 */
export function highlightBestFive(bestFiveCards) {
  // Remove all existing highlights
  document.querySelectorAll('.card.best-five').forEach(card => {
    card.classList.remove('best-five');
  });

  // Add highlights to best five cards
  bestFiveCards.forEach(bestCard => {
    const cardEl = document.querySelector(
      `.card[data-rank="${bestCard.rank}"][data-suit="${bestCard.suit}"]`
    );
    if (cardEl) {
      cardEl.classList.add('best-five');
    }
  });
}
