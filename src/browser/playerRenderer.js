// @ts-check

import { createAvatarElement } from './avatarManager.js';
import { createTokenElement } from './tokenRenderer.js';

/**
 * @typedef {Object} PlayerInfo
 * @property {string} id - Player ID
 * @property {string} name - Player name
 * @property {boolean} isReady - Whether player is ready
 * @property {number} [tokenNumber] - Current token number (if any)
 * @property {boolean} isCurrentPlayer - Whether this is the current viewing player
 * @property {(number|null)[]} [tokenHistory] - Token history for previous turns
 * @property {number} [currentTurn] - Current turn number
 */

/**
 * Render player avatars around the table
 * @param {HTMLElement} container - Container to render players in
 * @param {PlayerInfo[]} players - Array of player info
 * @param {Object} [options] - Optional configuration
 * @param {(tokenNumber: number) => void} [options.onTokenClick] - Callback for token clicks
 * @param {boolean} [options.interactive] - Whether tokens are interactive
 */
export function renderPlayers(container, players, options = {}) {
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

    // Avatar wrapper with ready badge overlay
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'player-avatar-wrapper';

    const avatar = createAvatarElement(player, 'large');
    avatarWrapper.appendChild(avatar);

    // Ready indicator - positioned at corner of avatar
    if (player.isReady) {
      const readyBadge = document.createElement('div');
      readyBadge.className = 'player-ready-badge';
      readyBadge.textContent = '✓';
      avatarWrapper.appendChild(readyBadge);
    }

    playerDiv.appendChild(avatarWrapper);

    // Player name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-name-label';
    nameDiv.textContent = player.name;
    if (player.isCurrentPlayer) {
      nameDiv.textContent += ' (You)';
    }
    playerDiv.appendChild(nameDiv);

    // Token history display (show all turns' tokens including current)
    if (player.tokenHistory && player.currentTurn) {
      const historyContainer = document.createElement('div');
      historyContainer.className = 'player-token-history';

      // Show all turns including current turn
      for (let turn = 1; turn <= player.currentTurn; turn++) {
        const tokenNumber = player.tokenHistory[turn - 1];

        if (tokenNumber !== null) {
          // Only current turn token is interactive
          const isCurrentTurn = turn === player.currentTurn;
          const isInteractive = isCurrentTurn && (options.interactive || false);

          const tokenEl = createTokenElement(
            { number: tokenNumber, ownerId: player.id, timestamp: 0 },
            turn,
            isInteractive
          );

          // Current turn token is medium size, previous turns are mini
          if (isCurrentTurn) {
            tokenEl.classList.add('medium');

            // Add click handler only for current turn token if interactive
            if (options.interactive && options.onTokenClick) {
              tokenEl.style.cursor = 'pointer';
              tokenEl.addEventListener('click', () => {
                options.onTokenClick?.(tokenNumber);
              });
            }
          } else {
            tokenEl.classList.add('mini');
          }

          historyContainer.appendChild(tokenEl);
        }
      }

      if (historyContainer.children.length > 0) {
        playerDiv.appendChild(historyContainer);
      }
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
      bottom: 30px;
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

    .player-avatar-wrapper {
      position: relative;
      display: inline-block;
    }

    .player-ready-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 24px;
      height: 24px;
      background: #2ecc71;
      color: white;
      font-size: 16px;
      font-weight: bold;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .player-token-history {
      display: flex;
      flex-direction: row;
      gap: 4px;
      margin-top: 6px;
      align-items: center;
      justify-content: center;
    }

    /* Player token containers - positioned near avatars */
    .player-token-container {
      position: absolute;
      pointer-events: auto;
      transition: all 0.3s ease;
    }

    /* Current player token - bottom center, below avatar */
    .player-token-container.current-player {
      top: 80%;
      left: 50%;
      transform: translate(-50%, 20px);
    }

    /* Position 0 token (if not current player): top left, below avatar */
    .player-token-container.player-position-0:not(.current-player) {
      top: 60px;
      left: 15%;
      transform: translate(0, 60px);
    }

    /* Position 1 token (if not current player): top right, below avatar */
    .player-token-container.player-position-1:not(.current-player) {
      top: 60px;
      right: 15%;
      transform: translate(0, 60px);
    }

    /* Position 2 token: left side, below avatar */
    .player-token-container.player-position-2 {
      top: 50%;
      left: 10%;
      transform: translate(0, 30px);
    }

    /* Position 3 token: right side, below avatar */
    .player-token-container.player-position-3 {
      top: 50%;
      right: 10%;
      transform: translate(0, 30px);
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

      /* Mobile token containers */
      .player-token-container.current-player {
        top: 85%;
        transform: translate(-50%, 10px);
      }

      .player-token-container.player-position-0:not(.current-player) {
        top: 40px;
        left: 10%;
        transform: translate(0, 50px);
      }

      .player-token-container.player-position-1:not(.current-player) {
        top: 40px;
        right: 10%;
        transform: translate(0, 50px);
      }

      .player-token-container.player-position-2 {
        top: 40%;
        left: 5%;
        transform: translate(0, 30px);
      }

      .player-token-container.player-position-3 {
        top: 40%;
        right: 5%;
        transform: translate(0, 30px);
      }
    }
  `;

  document.head.appendChild(style);
}
