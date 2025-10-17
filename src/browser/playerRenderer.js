// @ts-check

import { createAvatarElement } from './avatarManager.js';
import { createTokenElement } from './tokenRenderer.js';

/**
 * @typedef {Object} PlayerInfo
 * @property {string} id - Player ID
 * @property {string} name - Player name
 * @property {string} [avatarColor] - Avatar background color
 * @property {boolean} isReady - Whether player is ready
 * @property {number} [tokenNumber] - Current token number (if any)
 * @property {boolean} isCurrentPlayer - Whether this is the current viewing player
 * @property {(number|null)[]} [tokenHistory] - Token history for previous turns
 * @property {number} [currentTurn] - Current turn number
 * @property {{id: string, name: string, avatarColor: string}|null} [stolenBy] - Player who stole this player's token (temporary, TOKEN_TRADING phase only)
 */

/**
 * Calculate edge position for a player based on total player count
 * @param {number} index - Player index (non-current player)
 * @param {number} total - Total non-current players
 * @returns {{edge: 'left'|'top'|'right', position: number}} Edge and position along that edge
 */
function calculateEdgePosition(index, total) {
  // Distribution strategy based on player count
  // 1 player: top
  // 2 players: top-left, top-right
  // 3 players: left, top, right
  // 4 players: left, top-left, top-right, right
  // 5 players: left, top-left, top-center, top-right, right
  // 6-7 players: 2 left, 2-3 top, 2 right

  if (total === 1) {
    return { edge: 'top', position: 0 };
  } else if (total === 2) {
    return index === 0 ? { edge: 'top', position: 0 } : { edge: 'top', position: 1 };
  } else if (total === 3) {
    if (index === 0) return { edge: 'left', position: 0 };
    if (index === 1) return { edge: 'top', position: 0 };
    return { edge: 'right', position: 0 };
  } else if (total === 4) {
    if (index === 0) return { edge: 'left', position: 0 };
    if (index === 1) return { edge: 'top', position: 0 };
    if (index === 2) return { edge: 'top', position: 1 };
    return { edge: 'right', position: 0 };
  } else if (total === 5) {
    if (index === 0) return { edge: 'left', position: 0 };
    if (index === 1) return { edge: 'top', position: 0 };
    if (index === 2) return { edge: 'top', position: 1 };
    if (index === 3) return { edge: 'top', position: 2 };
    return { edge: 'right', position: 0 };
  } else if (total === 6) {
    if (index === 0) return { edge: 'left', position: 0 };
    if (index === 1) return { edge: 'left', position: 1 };
    if (index === 2) return { edge: 'top', position: 0 };
    if (index === 3) return { edge: 'top', position: 1 };
    if (index === 4) return { edge: 'right', position: 0 };
    return { edge: 'right', position: 1 };
  } else { // 7 players
    if (index === 0) return { edge: 'left', position: 0 };
    if (index === 1) return { edge: 'left', position: 1 };
    if (index === 2) return { edge: 'top', position: 0 };
    if (index === 3) return { edge: 'top', position: 1 };
    if (index === 4) return { edge: 'top', position: 2 };
    if (index === 5) return { edge: 'right', position: 0 };
    return { edge: 'right', position: 1 };
  }
}

/**
 * Render player avatars around the table
 * @param {HTMLElement} container - Container to render players in
 * @param {PlayerInfo[]} players - Array of player info
 * @param {Object} [options] - Optional configuration
 * @param {(tokenNumber: number) => void} [options.onTokenClick] - Callback for token clicks
 * @param {boolean} [options.interactive] - Whether tokens are interactive
 * @param {string} [options.phase] - Current game phase
 */
export function renderPlayers(container, players, options = {}) {
  container.innerHTML = '';

  // Find current player index and count non-current players
  const nonCurrentPlayers = players.filter(p => !p.isCurrentPlayer);
  const numOtherPlayers = nonCurrentPlayers.length;

  players.forEach((player) => {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'table-player';

    if (player.isCurrentPlayer) {
      playerDiv.classList.add('current-player');
    } else {
      // Calculate edge position for non-current players
      const nonCurrentIndex = nonCurrentPlayers.findIndex(p => p.id === player.id);
      const edgePos = calculateEdgePosition(nonCurrentIndex, numOtherPlayers);

      playerDiv.classList.add(`player-${edgePos.edge}-${edgePos.position}`);
      playerDiv.dataset.edge = edgePos.edge;
      playerDiv.dataset.edgePosition = String(edgePos.position);
    }

    if (player.isReady) {
      playerDiv.classList.add('ready');
    }

    // Token history display (show all turns' tokens including current)
    // For current player, render tokens first (above avatar)
    if (player.isCurrentPlayer && player.tokenHistory && player.currentTurn) {
      const historyContainer = document.createElement('div');
      historyContainer.className = 'player-token-history';

      // Show all turns including current turn
      for (let turn = 1; turn <= player.currentTurn; turn++) {
        const tokenNumber = player.tokenHistory[turn - 1];
        const isCurrentTurn = turn === player.currentTurn;

        if (tokenNumber !== null) {
          // Render actual token
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
        } else if (isCurrentTurn && options.phase === 'TOKEN_TRADING') {
          // Show dotted circle placeholder for current turn during TOKEN_TRADING
          const placeholder = document.createElement('div');
          placeholder.className = 'token-placeholder medium';

          // If token was stolen, show "→ O" indicator
          if (player.stolenBy) {
            const stolenIndicator = document.createElement('div');
            stolenIndicator.className = 'stolen-indicator';

            // Arrow character
            const arrow = document.createElement('span');
            arrow.textContent = '→';
            arrow.className = 'stolen-arrow';
            stolenIndicator.appendChild(arrow);

            // Small avatar of thief
            const thiefAvatar = createAvatarElement(player.stolenBy, 'small');
            thiefAvatar.classList.add('stolen-avatar');
            stolenIndicator.appendChild(thiefAvatar);

            placeholder.appendChild(stolenIndicator);
          }

          historyContainer.appendChild(placeholder);
        }
      }

      if (historyContainer.children.length > 0) {
        playerDiv.appendChild(historyContainer);
      }
    }

    // Avatar wrapper with ready badge overlay
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'player-avatar-wrapper';

    const avatar = createAvatarElement(player, 'large');
    avatarWrapper.appendChild(avatar);

    // Ready indicator - positioned at corner of avatar
    // Hide during TOKEN_TRADING phase since everyone is already ready
    if (player.isReady && options.phase !== 'TOKEN_TRADING') {
      const readyBadge = document.createElement('div');
      readyBadge.className = 'player-ready-badge';
      readyBadge.textContent = '✓';
      avatarWrapper.appendChild(readyBadge);
    }

    playerDiv.appendChild(avatarWrapper);

    // Token history display for non-current players (below avatar)
    if (!player.isCurrentPlayer && player.tokenHistory && player.currentTurn) {
      const historyContainer = document.createElement('div');
      historyContainer.className = 'player-token-history';

      // Show all turns including current turn
      for (let turn = 1; turn <= player.currentTurn; turn++) {
        const tokenNumber = player.tokenHistory[turn - 1];
        const isCurrentTurn = turn === player.currentTurn;

        if (tokenNumber !== null) {
          // Render actual token
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
        } else if (isCurrentTurn && options.phase === 'TOKEN_TRADING') {
          // Show dotted circle placeholder for current turn during TOKEN_TRADING
          const placeholder = document.createElement('div');
          placeholder.className = 'token-placeholder medium';

          // If token was stolen, show "→ O" indicator
          if (player.stolenBy) {
            const stolenIndicator = document.createElement('div');
            stolenIndicator.className = 'stolen-indicator';

            // Arrow character
            const arrow = document.createElement('span');
            arrow.textContent = '→';
            arrow.className = 'stolen-arrow';
            stolenIndicator.appendChild(arrow);

            // Small avatar of thief
            const thiefAvatar = createAvatarElement(player.stolenBy, 'small');
            thiefAvatar.classList.add('stolen-avatar');
            stolenIndicator.appendChild(thiefAvatar);

            placeholder.appendChild(stolenIndicator);
          }

          historyContainer.appendChild(placeholder);
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

    /* Edge-based positioning for other players */

    /* Left edge players */
    .player-left-0 {
      left: 5%;
      top: 30%;
    }

    .player-left-1 {
      left: 5%;
      top: 55%;
    }

    /* Top edge players */
    .player-top-0 {
      top: 8%;
      left: 30%;
    }

    .player-top-1 {
      top: 8%;
      left: 50%;
      transform: translateX(-50%);
    }

    .player-top-2 {
      top: 8%;
      left: 70%;
    }

    /* Right edge players */
    .player-right-0 {
      right: 5%;
      top: 30%;
    }

    .player-right-1 {
      right: 5%;
      top: 55%;
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

      /* Mobile: tighter positioning */
      .player-left-0 {
        left: 3%;
        top: 25%;
      }

      .player-left-1 {
        left: 3%;
        top: 50%;
      }

      .player-top-0 {
        top: 5%;
        left: 25%;
      }

      .player-top-1 {
        top: 5%;
        left: 50%;
      }

      .player-top-2 {
        top: 5%;
        left: 75%;
      }

      .player-right-0 {
        right: 3%;
        top: 25%;
      }

      .player-right-1 {
        right: 3%;
        top: 50%;
      }
    }
  `;

  document.head.appendChild(style);
}
