// @ts-check

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
    playerDiv.className = 'player-avatar';
    playerDiv.classList.add(`player-position-${index}`);

    if (player.isCurrentPlayer) {
      playerDiv.classList.add('current-player');
    }

    if (player.isReady) {
      playerDiv.classList.add('ready');
    }

    // Player name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-name';
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
    #player-avatars {
      position: relative;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 20px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .player-avatar {
      background: #444;
      border: 3px solid #666;
      border-radius: 8px;
      padding: 12px 16px;
      min-width: 120px;
      text-align: center;
      position: relative;
      transition: all 0.3s ease;
    }

    .player-avatar.current-player {
      border-color: #3498db;
      background: #2c3e50;
    }

    .player-avatar.ready {
      border-color: #2ecc71;
      background: #1e4d2b;
    }

    .player-name {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 4px;
      color: #fff;
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
      #player-avatars {
        min-height: 100px;
      }

      /* 2 players: left and right */
      .player-avatar.player-position-0 {
        order: 0;
      }

      .player-avatar.player-position-1 {
        order: 1;
      }

      /* 3+ players: distributed around */
      .player-avatar.player-position-2 {
        order: 2;
      }

      .player-avatar.player-position-3 {
        order: 3;
      }
    }
  `;

  document.head.appendChild(style);
}
