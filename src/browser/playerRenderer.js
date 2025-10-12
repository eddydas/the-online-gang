// @ts-check

import { createAvatarElement } from './avatarManager.js';

/**
 * @typedef {Object} PlayerInfo
 * @property {string} id - Player ID
 * @property {string} name - Player name
 * @property {boolean} isReady - Whether player is ready
 * @property {number} [tokenNumber] - Current token number (if any)
 * @property {boolean} isCurrentPlayer - Whether this is the current viewing player
 */

/**
 * Render player avatars around the table
 * @param {HTMLElement} container - Container to render players in
 * @param {PlayerInfo[]} players - Array of player info
 */
export function renderPlayers(container, players) {
  container.innerHTML = '';

  players.forEach((player, index) => {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'table-player';
    playerDiv.classList.add(`player-position-${index}`);

    if (player.isCurrentPlayer) {
      playerDiv.classList.add('current-player');
    }

    if (player.isReady) {
      playerDiv.classList.add('ready');
    }

    // Add avatar
    const avatar = createAvatarElement(player, 'large');
    playerDiv.appendChild(avatar);

    // Player name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-name-label';
    nameDiv.textContent = player.name;
    if (player.isCurrentPlayer) {
      nameDiv.textContent += ' (You)';
    }
    playerDiv.appendChild(nameDiv);

    // Ready indicator
    if (player.isReady) {
      const readyBadge = document.createElement('div');
      readyBadge.className = 'player-ready-badge';
      readyBadge.textContent = '✓';
      playerDiv.appendChild(readyBadge);
    }

    // Token indicator
    if (player.tokenNumber !== undefined) {
      const tokenBadge = document.createElement('div');
      tokenBadge.className = 'player-token-badge';
      tokenBadge.textContent = `Token: ${player.tokenNumber}`;
      playerDiv.appendChild(tokenBadge);
    }

    container.appendChild(playerDiv);
  });
}

/**
 * Add player rendering styles to the document
 */
export function addPlayerStyles() {
  if (document.getElementById('player-styles')) return;

  const style = document.createElement('style');
  style.id = 'player-styles';
  style.textContent = `
    #player-positions {
      position: relative;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 20px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .table-player {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      position: relative;
      transition: all 0.3s ease;
    }

    .table-player.current-player .player-avatar {
      border-color: #3498db;
      box-shadow: 0 0 12px rgba(52, 152, 219, 0.6);
    }

    .table-player.ready .player-avatar {
      border-color: #2ecc71;
    }

    .player-ready-badge {
      color: #2ecc71;
      font-size: 18px;
      font-weight: bold;
      margin-top: 4px;
    }

    .player-token-badge {
      background: #f39c12;
      color: #000;
      font-size: 12px;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 4px;
      margin-top: 6px;
      display: inline-block;
    }

    /* Position players around the table for better visual layout */
    @media (min-width: 768px) {
      #player-positions {
        min-height: 100px;
      }

      /* 2 players: left and right */
      .table-player.player-position-0 {
        order: 0;
      }

      .table-player.player-position-1 {
        order: 1;
      }

      /* 3+ players: distributed around */
      .table-player.player-position-2 {
        order: 2;
      }

      .table-player.player-position-3 {
        order: 3;
      }
    }
  `;

  document.head.appendChild(style);
}
