// @ts-check

/**
 * End game screen renderer - displays summary table with results
 */

import { createCardElement } from './cardRenderer.js';
import { createTokenElement } from './tokenRenderer.js';
import { createAvatarElement } from './avatarManager.js';
import { cardsEqual } from './deck.js';

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

  // Summary table
  const table = document.createElement('table');
  table.className = 'end-game-table';

  // Header row
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Player</th>
      <th>Turn 1</th>
      <th>Turn 2</th>
      <th>Turn 3</th>
      <th>Turn 4</th>
      <th>Cards</th>
      <th>Hand</th>
    </tr>
  `;
  table.appendChild(thead);

  // Body rows (one per player, sorted by hand strength)
  const tbody = document.createElement('tbody');

  winLossResult.sortedPlayers.forEach((/** @type {any} */ player) => {
    const row = document.createElement('tr');

    // Get player data from game state
    const gamePlayer = gameState.players.find((/** @type {any} */ p) => p.id === player.id);
    const isCorrect = winLossResult.correctness[player.id];

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

      const tokenNumber = getTokenForTurn(gamePlayer?.tokenHistory || [], turn);

      if (tokenNumber !== null) {
        // Create mini token element
        const miniToken = createTokenElement(
          { number: tokenNumber, ownerId: player.id, timestamp: 0 },
          turn,
          false
        );
        miniToken.classList.add('mini-token');

        // Determine if this turn's token was correct
        // For now, just highlight final turn based on overall correctness
        if (turn === 4) {
          tokenCell.classList.add(isCorrect ? 'correct-token' : 'incorrect-token');
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
      gamePlayer.holeCards.forEach((/** @type {Card} */ card) => {
        const cardEl = createCardElement(card, false);
        cardEl.classList.add('mini-card');

        // Check if in bestFive (used for ranking)
        const isInBestFive = player.hand?.bestFive?.some((/** @type {Card} */ c) => cardsEqual(c, card));
        // Check if in primaryCards (highlight with yellow)
        const isInPrimaryCards = player.hand?.primaryCards?.some((/** @type {Card} */ c) => cardsEqual(c, card));

        if (isInPrimaryCards) {
          cardEl.classList.add('best-five'); // Yellow highlight
        } else if (!isInBestFive) {
          cardEl.classList.add('not-used'); // Dim (not used in ranking)
        }
        // else: in bestFive but not primary (kicker) - normal opacity, no highlight

        cardsContainer.appendChild(cardEl);
      });

      // Add spacer between hole cards and community cards
      const spacer = document.createElement('div');
      spacer.className = 'card-spacer';
      cardsContainer.appendChild(spacer);
    }

    // Add community cards
    if (gameState.communityCards) {
      gameState.communityCards.forEach((/** @type {Card} */ card) => {
        const cardEl = createCardElement(card, false);
        cardEl.classList.add('mini-card');

        // Check if in bestFive (used for ranking)
        const isInBestFive = player.hand?.bestFive?.some((/** @type {Card} */ c) => cardsEqual(c, card));
        // Check if in primaryCards (highlight with yellow)
        const isInPrimaryCards = player.hand?.primaryCards?.some((/** @type {Card} */ c) => cardsEqual(c, card));

        if (isInPrimaryCards) {
          cardEl.classList.add('best-five'); // Yellow highlight
        } else if (!isInBestFive) {
          cardEl.classList.add('not-used'); // Dim (not used in ranking)
        }
        // else: in bestFive but not primary (kicker) - normal opacity, no highlight

        cardsContainer.appendChild(cardEl);
      });
    }

    cardsCell.appendChild(cardsContainer);
    row.appendChild(cardsCell);

    // Hand description column
    const handCell = document.createElement('td');
    handCell.className = 'hand-cell';
    handCell.textContent = player.hand?.description || 'Unknown';
    row.appendChild(handCell);

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

  return container;
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
      transition: background 0.3s;
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
      padding: 8px 4px;
      width: 50px;
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

    .token-cell.correct-token {
      background: rgba(46, 204, 113, 0.2);
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
  `;

  document.head.appendChild(style);
}
