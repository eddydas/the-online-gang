// @ts-check

/**
 * End game screen renderer - displays summary table with results
 */

import { createCardElement } from './cardRenderer.js';
import { createTokenElement } from './tokenRenderer.js';
import { createAvatarElement } from './avatarManager.js';
import { cardsEqual } from './deck.js';
import { evaluatePokerHand } from './poker.js';
import { determineWinLoss } from './winCondition.js';

/**
 * @typedef {import('./deck.js').Card} Card
 * @typedef {import('./poker.js').HandResult} HandResult
 * @typedef {import('./gameState.js').Player} Player
 * @typedef {import('./tokens.js').Token} Token
 */

/**
 * Get token for player at specific turn
 * @param {any[]} tokenHistory - Player's token history array [turn1, turn2, turn3, turn4]
 * @param {number} turn - Turn number (1-4, 1-indexed)
 * @returns {number | null}
 */
function getTokenForTurn(tokenHistory, turn) {
  return tokenHistory[turn - 1] || null;
}

/**
 * Evaluate token correctness for a specific turn
 * @param {any[]} players - All players with their data
 * @param {any} gameState - Game state with community cards
 * @param {number} turn - Turn number (1-4)
 * @returns {Object.<string, boolean>} Map of playerId to isCorrect for this turn
 */
function evaluateTurnCorrectness(players, gameState, turn) {
  // Determine how many community cards are available at this turn
  const communityCardCounts = [0, 3, 4, 5]; // Turn 1=0, Turn 2=3, Turn 3=4, Turn 4=5
  const communityCount = communityCardCounts[turn - 1];
  const communityCards = gameState.communityCards.slice(0, communityCount);

  // Evaluate each player's hand at this turn
  const playersWithHands = players.map(p => {
    const allCards = [...(p.holeCards || []), ...communityCards];
    const hand = evaluatePokerHand(allCards);
    return {
      id: p.id,
      name: p.name,
      holeCards: p.holeCards,
      currentToken: p.tokenHistory[turn - 1],
      tokenHistory: p.tokenHistory,
      hand
    };
  });

  // Determine win/loss for this turn's state
  const turnResult = determineWinLoss(playersWithHands);

  return turnResult.correctness;
}

/**
 * Create end game summary table
 * @param {any} winLossResult - Result from determineWinLoss
 * @param {any} gameState - Current game state
 * @returns {HTMLElement}
 */
export function createEndGameTable(winLossResult, gameState) {
  const container = document.createElement('div');
  container.className = 'end-game-container';

  // WIN/LOSS announcement
  const announcement = document.createElement('div');
  announcement.className = 'end-game-announcement ' + (winLossResult.isWin ? 'win' : 'loss');
  announcement.innerHTML = `
    <h1>${winLossResult.isWin ? '🎉 VICTORY!' : '💔 DEFEAT'}</h1>
    <p>${winLossResult.isWin ? 'All players correctly ranked their hands!' : 'Some players misranked their hands.'}</p>
  `;
  container.appendChild(announcement);

  // Time travel slider
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'time-travel-slider-container';
  sliderContainer.innerHTML = `
    <div class="slider-label">
      Showing game results as of: Turn <span id="current-turn-display">4</span>
    </div>
    <div class="slider-wrapper">
      <input type="range" id="turn-slider" min="1" max="4" value="4" step="1" class="turn-slider">
      <div class="slider-markers">
        <span class="slider-marker">1</span>
        <span class="slider-marker">2</span>
        <span class="slider-marker">3</span>
        <span class="slider-marker">4</span>
      </div>
    </div>
  `;
  container.appendChild(sliderContainer);

  // Summary table
  const table = document.createElement('table');
  table.className = 'end-game-table';
  table.dataset.currentTurn = '4'; // Store current turn for reference

  // Body rows (one per player, sorted by hand strength)
  const tbody = document.createElement('tbody');

  // Evaluate correctness for all turns (1-4)
  /** @type {Object.<number, Object.<string, boolean>>} */
  const turnCorrectness = {};
  /** @type {Object.<number, any[]>} */
  const turnSortedPlayers = {};
  /** @type {Object.<number, any>} */
  const turnWinLossResults = {};

  for (let t = 1; t <= 4; t++) {
    turnCorrectness[t] = evaluateTurnCorrectness(gameState.players, gameState, t);

    // Evaluate and sort players for this turn
    const communityCardCounts = [0, 3, 4, 5];
    const communityCount = communityCardCounts[t - 1];
    const communityCards = gameState.communityCards.slice(0, communityCount);

    const playersWithHands = gameState.players.map((/** @type {any} */ p) => {
      const allCards = [...(p.holeCards || []), ...communityCards];
      const hand = evaluatePokerHand(allCards);
      return {
        id: p.id,
        name: p.name,
        holeCards: p.holeCards,
        currentToken: p.tokenHistory[t - 1],
        tokenHistory: p.tokenHistory,
        hand
      };
    });

    const turnResult = determineWinLoss(playersWithHands);
    turnSortedPlayers[t] = turnResult.sortedPlayers;
    turnWinLossResults[t] = turnResult;
  }

  winLossResult.sortedPlayers.forEach((/** @type {any} */ player) => {
    const row = document.createElement('tr');

    // Get player data from game state
    const gamePlayer = gameState.players.find((/** @type {any} */ p) => p.id === player.id);
    const isCorrect = winLossResult.correctness[player.id];

    // Get decisive kicker indices for this player
    const decisiveKickerIndices = winLossResult.decisiveKickers?.[player.id] || [];

    row.className = isCorrect ? 'correct-row' : 'incorrect-row';

    // Player avatar column (no name)
    const avatarCell = document.createElement('td');
    avatarCell.className = 'avatar-cell';

    const avatar = createAvatarElement(gamePlayer || player, 'small');
    avatarCell.appendChild(avatar);

    row.appendChild(avatarCell);

    // Token columns (Turn 1-4)
    for (let turn = 1; turn <= 4; turn++) {
      const tokenCell = document.createElement('td');
      tokenCell.className = 'token-cell';
      tokenCell.dataset.turn = String(turn); // Mark turn for opacity control

      const tokenNumber = getTokenForTurn(gamePlayer?.tokenHistory || [], turn);

      if (tokenNumber !== null) {
        // Create mini token element
        const miniToken = createTokenElement(
          { number: tokenNumber, ownerId: player.id, timestamp: 0 },
          turn,
          false
        );
        miniToken.classList.add('mini-token');

        // Highlight only incorrect tokens (all turns)
        const isTokenCorrect = turnCorrectness[turn][player.id];
        if (!isTokenCorrect) {
          tokenCell.classList.add('incorrect-token');
        }

        tokenCell.appendChild(miniToken);
      } else {
        tokenCell.textContent = '-';
      }

      row.appendChild(tokenCell);
    }

    // Cards column (2 hole + 5 community)
    const cardsCell = document.createElement('td');
    cardsCell.className = 'cards-cell';

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';

    // Add hole cards
    if (gamePlayer?.holeCards) {
      gamePlayer.holeCards.forEach((/** @type {Card} */ card, /** @type {number} */ holeIndex) => {
        const cardEl = createCardElement(card, false);
        cardEl.classList.add('mini-card');

        // Add unique identifier for this card
        cardEl.dataset.cardId = `${player.id}-hole-${holeIndex}`;
        cardEl.dataset.cardRank = card.rank;
        cardEl.dataset.cardSuit = card.suit;

        // Find which position this card is in bestFive (if any)
        const bestFiveIndex = player.hand?.bestFive?.findIndex((/** @type {Card} */ c) => cardsEqual(c, card));

        // Check if in primaryCards (highlight with yellow)
        const isInPrimaryCards = player.hand?.primaryCards?.some((/** @type {Card} */ c) => cardsEqual(c, card));

        // Check if this card is a decisive kicker (gray highlight)
        const isDecisiveKicker = bestFiveIndex !== undefined && bestFiveIndex >= 0 && decisiveKickerIndices.includes(bestFiveIndex);

        if (isInPrimaryCards) {
          cardEl.classList.add('best-five'); // Yellow highlight
        } else if (isDecisiveKicker) {
          cardEl.classList.add('kicker'); // Gray highlight (decisive kicker)
        } else if (bestFiveIndex === -1) {
          cardEl.classList.add('not-used'); // Dim (not used in ranking)
        }
        // else: in bestFive but not primary/decisive - normal opacity, no highlight

        cardsContainer.appendChild(cardEl);
      });

      // Add spacer between hole cards and community cards
      const spacer = document.createElement('div');
      spacer.className = 'card-spacer';
      cardsContainer.appendChild(spacer);
    }

    // Add community cards
    if (gameState.communityCards) {
      gameState.communityCards.forEach((/** @type {Card} */ card, /** @type {number} */ index) => {
        const cardEl = createCardElement(card, false);
        cardEl.classList.add('mini-card');

        // Add unique identifier for this card
        cardEl.dataset.cardId = `${player.id}-community-${index}`;
        cardEl.dataset.cardRank = card.rank;
        cardEl.dataset.cardSuit = card.suit;

        // Mark card with turn data for opacity control
        // Cards 0-2: Turn 2 (flop), Card 3: Turn 3 (turn), Card 4: Turn 4 (river)
        let cardTurn = 2;
        if (index === 3) cardTurn = 3;
        else if (index === 4) cardTurn = 4;
        cardEl.dataset.turn = String(cardTurn);

        // Find which position this card is in bestFive (if any)
        const bestFiveIndex = player.hand?.bestFive?.findIndex((/** @type {Card} */ c) => cardsEqual(c, card));

        // Check if in primaryCards (highlight with yellow)
        const isInPrimaryCards = player.hand?.primaryCards?.some((/** @type {Card} */ c) => cardsEqual(c, card));

        // Check if this card is a decisive kicker (gray highlight)
        const isDecisiveKicker = bestFiveIndex !== undefined && bestFiveIndex >= 0 && decisiveKickerIndices.includes(bestFiveIndex);

        if (isInPrimaryCards) {
          cardEl.classList.add('best-five'); // Yellow highlight
        } else if (isDecisiveKicker) {
          cardEl.classList.add('kicker'); // Gray highlight (decisive kicker)
        } else if (bestFiveIndex === -1) {
          cardEl.classList.add('not-used'); // Dim (not used in ranking)
        }
        // else: in bestFive but not primary/decisive - normal opacity, no highlight

        cardsContainer.appendChild(cardEl);
      });
    }

    cardsCell.appendChild(cardsContainer);
    row.appendChild(cardsCell);

    // Hand description column
    const handCell = document.createElement('td');
    handCell.className = 'hand-cell';

    // Store hand descriptions for all turns
    for (let t = 1; t <= 4; t++) {
      const turnPlayer = turnSortedPlayers[t].find((/** @type {any} */ p) => p.id === player.id);
      handCell.dataset[`turn${t}Desc`] = turnPlayer?.hand?.description || 'Unknown';
    }

    // Display Turn 4 description by default
    handCell.textContent = player.hand?.description || 'Unknown';
    row.appendChild(handCell);

    // Store player ID for row identification during re-sorting
    row.dataset.playerId = player.id;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // "Ready for Next Game" button with ready status display
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'end-game-actions';

  // Show ready status
  const readyStatus = gameState.readyStatus || {};
  const readyPlayers = Object.values(readyStatus).filter(r => r === true).length;
  const totalPlayers = gameState.players.length;

  buttonContainer.innerHTML = `
    <div id="ready-status" class="ready-status">
      Players Ready: ${readyPlayers} / ${totalPlayers}
    </div>
    <button id="next-game-button" class="next-game-btn">Ready for Next Game</button>
  `;
  container.appendChild(buttonContainer);

  // Set up time travel slider event handler
  const slider = container.querySelector('#turn-slider');
  const turnDisplay = container.querySelector('#current-turn-display');

  if (slider && turnDisplay) {
    // Apply initial highlighting for Turn 4 (default slider position)
    updateCardHighlighting(tbody, 4, turnWinLossResults[4]);

    slider.addEventListener('input', (e) => {
      const selectedTurn = parseInt((/** @type {HTMLInputElement} */ (e.target)).value);
      turnDisplay.textContent = String(selectedTurn);

      // Update opacity for tokens and cards based on selected turn
      updateTimeTravelView(table, selectedTurn);

      // Update card highlighting based on selected turn
      updateCardHighlighting(tbody, selectedTurn, turnWinLossResults[selectedTurn]);

      // Update hand descriptions
      updateHandDescriptions(tbody, selectedTurn);
    });
  }

  return container;
}

/**
 * Update opacity of cards and tokens based on selected turn
 * @param {HTMLElement} table - The end game table
 * @param {number} selectedTurn - Selected turn (1-4)
 */
function updateTimeTravelView(table, selectedTurn) {
  // Update token cells
  const tokenCells = table.querySelectorAll('.token-cell[data-turn]');
  tokenCells.forEach((cell) => {
    const htmlCell = /** @type {HTMLElement} */ (cell);
    const cellTurn = parseInt(htmlCell.dataset.turn || '4');
    if (cellTurn > selectedTurn) {
      htmlCell.style.opacity = '0.2';
    } else {
      htmlCell.style.opacity = '1';
    }
  });

  // Update community cards
  const cards = table.querySelectorAll('.mini-card[data-turn]');
  cards.forEach((card) => {
    const htmlCard = /** @type {HTMLElement} */ (card);
    const cardTurn = parseInt(htmlCard.dataset.turn || '4');
    if (cardTurn > selectedTurn) {
      htmlCard.style.opacity = '0.2';
    } else {
      htmlCard.style.opacity = '1';
    }
  });
}

/**
 * Update card highlighting based on selected turn
 * @param {HTMLElement} tbody - Table body element
 * @param {number} selectedTurn - Selected turn (1-4)
 * @param {any} turnResult - Win/loss result for this turn with hand evaluations
 */
function updateCardHighlighting(tbody, selectedTurn, turnResult) {
  const rows = tbody.querySelectorAll('tr');

  rows.forEach((row) => {
    const htmlRow = /** @type {HTMLElement} */ (row);
    const playerId = htmlRow.dataset.playerId;
    if (!playerId) return;

    // Find this player's data in turnResult
    const player = turnResult.sortedPlayers.find((/** @type {any} */ p) => p.id === playerId);
    if (!player) return;

    // Get decisive kicker indices for this player at this turn
    const decisiveKickerIndices = turnResult.decisiveKickers?.[playerId] || [];

    // Find all cards for this player in the row
    const cards = htmlRow.querySelectorAll('.mini-card');

    cards.forEach((card) => {
      const htmlCard = /** @type {HTMLElement} */ (card);
      const cardRank = htmlCard.dataset.cardRank;
      const cardSuit = htmlCard.dataset.cardSuit;

      if (!cardRank || !cardSuit) return;

      // Remove all existing highlighting classes
      htmlCard.classList.remove('best-five', 'kicker', 'not-used');

      // Check if this is a community card that hasn't been revealed yet at this turn
      const cardTurn = htmlCard.dataset.turn ? parseInt(htmlCard.dataset.turn) : null;

      // If card has a turn (community card) and hasn't been revealed yet, skip highlighting
      if (cardTurn !== null && cardTurn > selectedTurn) {
        // This card hasn't been revealed yet at this turn, skip highlighting
        return;
      }

      // Create card object for comparison
      const currentCard = { rank: cardRank, suit: cardSuit };

      // Find which position this card is in bestFive (if any)
      const bestFiveIndex = player.hand?.bestFive?.findIndex((/** @type {any} */ c) =>
        cardsEqual(c, currentCard)
      );

      // Check if in primaryCards (highlight with yellow)
      const isInPrimaryCards = player.hand?.primaryCards?.some((/** @type {any} */ c) =>
        cardsEqual(c, currentCard)
      );

      // Check if this card is a decisive kicker (gray highlight)
      const isDecisiveKicker = bestFiveIndex !== undefined && bestFiveIndex >= 0 &&
        decisiveKickerIndices.includes(bestFiveIndex);

      if (isInPrimaryCards) {
        htmlCard.classList.add('best-five'); // Yellow highlight
      } else if (isDecisiveKicker) {
        htmlCard.classList.add('kicker'); // Gray highlight (decisive kicker)
      } else if (bestFiveIndex === -1) {
        htmlCard.classList.add('not-used'); // Dim (not used in ranking)
      }
      // else: in bestFive but not primary/decisive - normal opacity, no highlight
    });
  });
}

/**
 * Update hand descriptions for selected turn
 * @param {HTMLElement} tbody - Table body element
 * @param {number} selectedTurn - Selected turn (1-4)
 */
function updateHandDescriptions(tbody, selectedTurn) {
  const handCells = tbody.querySelectorAll('.hand-cell');
  handCells.forEach((cell) => {
    const htmlCell = /** @type {HTMLElement} */ (cell);
    const desc = htmlCell.dataset[`turn${selectedTurn}Desc`];
    if (desc) {
      htmlCell.textContent = desc;
    }
  });
}

/**
 * Add end game screen styles
 */
export function addEndGameStyles() {
  if (document.getElementById('end-game-styles')) return;

  const style = document.createElement('style');
  style.id = 'end-game-styles';
  style.textContent = `
    .end-game-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .end-game-announcement {
      text-align: center;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 12px;
      animation: fadeIn 0.5s;
    }

    .end-game-announcement.win {
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      color: white;
    }

    .end-game-announcement.loss {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
    }

    .end-game-announcement h1 {
      font-size: 48px;
      margin: 0 0 10px 0;
      animation: scaleIn 0.6s;
    }

    .end-game-announcement p {
      font-size: 20px;
      margin: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .end-game-table {
      width: 100%;
      border-collapse: collapse;
      background: #2c3e50;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .end-game-table th {
      background: #34495e;
      color: #ecf0f1;
      padding: 15px 4px;
      font-weight: bold;
      text-align: left;
      border-bottom: 2px solid #2c3e50;
    }

    .end-game-table td {
      padding: 12px 4px;
      border-bottom: 1px solid #34495e;
      vertical-align: middle;
    }

    .end-game-table tbody tr {
      transition: all 0.1s ease;
    }

    .end-game-table tbody tr:hover {
      background: #34495e;
    }

    .correct-row {
      background: rgba(46, 204, 113, 0.1);
    }

    .incorrect-row {
      background: rgba(231, 76, 60, 0.1);
    }

    .rank-cell {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      width: 60px;
      color: #f39c12;
    }

    .avatar-cell {
      text-align: center;
      vertical-align: middle;
      padding: 8px 4px;
      width: 50px;
    }

    .avatar-cell .player-avatar {
      margin: 0 auto;
    }

    .name-cell {
      font-weight: bold;
      font-size: 18px;
      color: #ecf0f1;
    }

    .token-cell {
      text-align: center;
      padding: 8px 4px;
      width: 50px;
    }

    .mini-token {
      width: 40px;
      height: 40px;
      margin: 0 auto;
    }

    .token-cell.incorrect-token {
      background: rgba(231, 76, 60, 0.2);
    }

    .cards-cell {
      padding: 8px 4px;
    }

    .cards-container {
      display: flex;
      flex-wrap: nowrap;
      gap: 2px;
      justify-content: center;
      align-items: center;
    }

    .card-spacer {
      width: 8px;
      height: 34px;
      flex-shrink: 0;
    }

    .end-game-table .mini-card {
      width: 24px;
      height: 34px;
      font-size: 8px;
      padding: 1px;
      flex-shrink: 0;
    }

    .end-game-table .mini-card.best-five {
      box-shadow: 0 0 6px rgba(243, 156, 18, 0.8);
    }

    .end-game-table .mini-card.kicker {
      box-shadow: 0 0 6px rgba(149, 165, 166, 0.8);
    }

    .end-game-table .mini-card.not-used {
      opacity: 0.5;
    }

    .end-game-table .mini-card .card-rank {
      font-size: 9px;
      margin-bottom: 1px;
    }

    .end-game-table .mini-card .card-suit.large {
      font-size: 14px;
    }

    .hand-cell {
      font-weight: bold;
      color: #ecf0f1;
      font-size: 14px;
    }

    .end-game-actions {
      text-align: center;
      margin-top: 30px;
    }

    .ready-status {
      font-size: 18px;
      font-weight: bold;
      color: #ecf0f1;
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(52, 152, 219, 0.2);
      border-radius: 8px;
      display: inline-block;
    }

    .next-game-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    .next-game-btn:hover {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.4);
    }

    .next-game-btn:active {
      transform: translateY(0);
    }

    /* === Time Travel Slider === */
    .time-travel-slider-container {
      margin: 20px 0 30px 0;
      padding: 20px;
      background: rgba(52, 73, 94, 0.3);
      border-radius: 12px;
    }

    .slider-label {
      text-align: center;
      font-size: 18px;
      font-weight: 600;
      color: #ecf0f1;
      margin-bottom: 20px;
    }

    #current-turn-display {
      color: #3498db;
      font-weight: bold;
    }

    .slider-wrapper {
      position: relative;
      max-width: 500px;
      margin: 0 auto;
    }

    .turn-slider {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: #34495e;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    }

    .turn-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: all 0.2s;
    }

    .turn-slider::-webkit-slider-thumb:hover {
      background: #2980b9;
      transform: scale(1.1);
    }

    .turn-slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: all 0.2s;
    }

    .turn-slider::-moz-range-thumb:hover {
      background: #2980b9;
      transform: scale(1.1);
    }

    .slider-markers {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding: 0 12px;
    }

    .slider-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #34495e;
      color: #ecf0f1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid #2c3e50;
    }

    /* === Token and Card Transitions === */
    .token-cell, .mini-card {
      transition: opacity 0.2s ease;
    }
  `;

  document.head.appendChild(style);
}
