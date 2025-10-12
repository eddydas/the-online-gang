// @ts-check

/**
 * Card rendering module - creates DOM elements for playing cards
 */

/**
 * @typedef {import('./deck.js').Card} Card
 */

/**
 * Get suit color
 * @param {string} suit - Card suit (♠, ♥, ♦, ♣)
 * @returns {string} - CSS color
 */
function getSuitColor(suit) {
  return (suit === '♥' || suit === '♦') ? '#e74c3c' : '#000';
}

/**
 * Create a card element
 * @param {Card} card - The card to render
 * @param {boolean} faceDown - Whether card is face down
 * @returns {HTMLElement} - Card DOM element
 */
export function createCardElement(card, faceDown = false) {
  const cardEl = document.createElement('div');
  cardEl.className = 'card' + (faceDown ? ' face-down' : '');

  if (faceDown) {
    // Card back with checker pattern
    cardEl.innerHTML = `
      <div class="card-back"></div>
    `;
  } else {
    // Card face with rank and suit
    const color = getSuitColor(card.suit);
    cardEl.innerHTML = `
      <div class="card-face" style="color: ${color}">
        <div class="card-corner card-top-left">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit">${card.suit}</div>
        </div>
        <div class="card-center">
          <div class="card-suit-large">${card.suit}</div>
        </div>
        <div class="card-corner card-bottom-right">
          <div class="card-rank">${card.rank}</div>
          <div class="card-suit">${card.suit}</div>
        </div>
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
  container.className = 'hole-cards';

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
  container.className = 'community-cards';

  const cardElements = createCardElements(cards, false);
  cardElements.forEach(cardEl => container.appendChild(cardEl));
}

/**
 * Highlight specific cards (for showing best hand)
 * @param {HTMLElement} container - Container with card elements
 * @param {number[]} indices - Indices of cards to highlight
 */
export function highlightCards(container, indices) {
  const cards = container.querySelectorAll('.card');
  cards.forEach((card, i) => {
    if (indices.includes(i)) {
      card.classList.add('highlighted');
    } else {
      card.classList.remove('highlighted');
    }
  });
}

/**
 * Add card styles to document
 */
export function addCardStyles() {
  if (document.getElementById('card-styles')) return;

  const style = document.createElement('style');
  style.id = 'card-styles';
  style.textContent = `
    .card {
      width: 80px;
      height: 112px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      position: relative;
      display: inline-block;
      margin: 0 4px;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    }

    .card.highlighted {
      border: 3px solid #f39c12;
      box-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
    }

    .card-face {
      width: 100%;
      height: 100%;
      padding: 8px;
      position: relative;
    }

    .card-corner {
      position: absolute;
      font-weight: bold;
      line-height: 1;
    }

    .card-top-left {
      top: 8px;
      left: 8px;
      text-align: left;
    }

    .card-bottom-right {
      bottom: 8px;
      right: 8px;
      text-align: right;
      transform: rotate(180deg);
    }

    .card-rank {
      font-size: 18px;
      font-weight: bold;
    }

    .card-suit {
      font-size: 16px;
    }

    .card-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .card-suit-large {
      font-size: 48px;
      opacity: 0.3;
    }

    .card.face-down {
      background: linear-gradient(45deg, #2c3e50 25%, #34495e 25%, #34495e 50%, #2c3e50 50%, #2c3e50 75%, #34495e 75%, #34495e);
      background-size: 20px 20px;
    }

    .card-back {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    }

    .hole-cards, .community-cards {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 10px;
    }

    .community-cards {
      margin: 20px 0;
    }
  `;

  document.head.appendChild(style);
}
