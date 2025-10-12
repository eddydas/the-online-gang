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
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .table-player {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      pointer-events: auto;
    }

    /* Current player - bottom center */
    .table-player.current-player {
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
    }

    .table-player.current-player .player-avatar {
      border-color: #3498db;
      box-shadow: 0 0 12px rgba(52, 152, 219, 0.6);
    }

    /* Other players positioned around table */
    /* Position 0 (if not current player): top left */
    .table-player.player-position-0:not(.current-player) {
      top: 60px;
      left: 15%;
    }

    /* Position 1 (if not current player): top right */
    .table-player.player-position-1:not(.current-player) {
      top: 60px;
      right: 15%;
    }

    /* Position 2: left side */
    .table-player.player-position-2 {
      top: 50%;
      left: 10%;
      transform: translateY(-50%);
    }

    /* Position 3: right side */
    .table-player.player-position-3 {
      top: 50%;
      right: 10%;
      transform: translateY(-50%);
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

    /* Mobile responsive */
    @media (max-width: 768px) {
      .table-player.current-player {
        bottom: 10px;
      }

      .table-player.player-position-0:not(.current-player) {
        top: 40px;
        left: 10%;
      }

      .table-player.player-position-1:not(.current-player) {
        top: 40px;
        right: 10%;
      }

      .table-player.player-position-2 {
        top: 40%;
        left: 5%;
      }

      .table-player.player-position-3 {
        top: 40%;
        right: 5%;
      }
    }
  `;

  document.head.appendChild(style);
}
