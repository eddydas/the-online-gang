// @ts-check

import { GameController } from './gameController.js';
import { addTokenStyles } from './tokenRenderer.js';
import { addEndGameStyles } from './endGameRenderer.js';
import { addPlayerStyles } from './playerRenderer.js';
import { createAvatarElement } from './avatarManager.js';
import { createTokenElement } from './tokenRenderer.js';

/**
 * Main entry point - initializes the game
 */

let gameController = new GameController();

// Add styles on load (card styles are now in index.html)
addTokenStyles();
addEndGameStyles();
addPlayerStyles();

/**
 * Parse peer ID from URL
 * @returns {{type: 'host' | 'client' | 'new', peerId: string | null}}
 */
function getPeerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const hostId = params.get('host');
  const peerId = params.get('peer');

  if (hostId) {
    return { type: 'host', peerId: hostId };
  } else if (peerId) {
    return { type: 'client', peerId: peerId };
  } else {
    return { type: 'new', peerId: null };
  }
}

/**
 * Update URL with host parameter (for host refresh recovery)
 * @param {string} peerId - The host's peer ID
 */
function updateUrlWithHostId(peerId) {
  const url = new URL(window.location.href);
  url.searchParams.set('host', peerId);
  window.history.replaceState({}, '', url);
}

/**
 * Get shareable link for host
 * @param {string} peerId
 * @returns {string}
 */
function getShareableLink(peerId) {
  const url = new URL(window.location.origin);
  url.searchParams.set('peer', peerId);
  return url.toString();
}

/**
 * Show lobby screen
 */
function showLobbyScreen() {
  const lobbyScreen = document.getElementById('lobby-screen');
  const gameScreen = document.getElementById('game-screen');
  const endGameScreen = document.getElementById('end-game-screen');

  if (lobbyScreen) lobbyScreen.style.display = 'block';
  if (gameScreen) gameScreen.style.display = 'none';
  if (endGameScreen) endGameScreen.style.display = 'none';
}

/**
 * Show game screen
 */
function showGameScreen() {
  const lobbyScreen = document.getElementById('lobby-screen');
  const gameScreen = document.getElementById('game-screen');
  const endGameScreen = document.getElementById('end-game-screen');

  if (lobbyScreen) lobbyScreen.style.display = 'none';
  if (gameScreen) gameScreen.style.display = 'block';
  if (endGameScreen) endGameScreen.style.display = 'none';
}

/**
 * Initialize lobby UI
 */
function initializeLobbyUI() {
  const lobbyContent = document.getElementById('lobby-content');
  if (!lobbyContent) return;

  lobbyContent.innerHTML = `
    <div id="player-list">
      <h2>Players</h2>
      <div id="players-container"></div>
    </div>
    <div id="lobby-controls">
      <div id="lobby-buttons">
        <button id="ready-toggle-button">Ready</button>
        <div id="waiting-spinner" style="display: none;">
          <div class="spinner">
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
            <div class="spinner-blade"></div>
          </div>
        </div>
        <button id="start-game-button" style="visibility: hidden;">Start Game</button>
      </div>
      <div id="share-link-container" style="display: none;">
        <input type="text" id="share-link-input" readonly />
        <button id="copy-link-button">Copy Link</button>
      </div>
      <div id="debug-options" style="display: none;">
        <h3>Debug Options</h3>
        <div id="debug-buttons">
          <button id="ready-all-button">Ready All</button>
          <button id="quick-test-button">Quick Test Game</button>
        </div>
      </div>
    </div>
    <div id="token-showcase">
      <h3 style="color: #fff; margin-top: 30px; margin-bottom: 15px;">Token Design Showcase</h3>
      <div id="token-showcase-grid"></div>
    </div>
  `;

  // Render token showcase
  renderTokenShowcase();
}

/**
 * Render token showcase grid
 */
function renderTokenShowcase() {
  const showcaseGrid = document.getElementById('token-showcase-grid');
  if (!showcaseGrid) return;

  showcaseGrid.innerHTML = '';

  const turnNames = ['Turn 1', 'Turn 2', 'Turn 3', 'Turn 4'];

  // Create header row with turn labels
  for (let turn = 1; turn <= 4; turn++) {
    const headerCell = document.createElement('div');
    headerCell.className = 'token-showcase-header';
    headerCell.textContent = turnNames[turn - 1];
    showcaseGrid.appendChild(headerCell);
  }

  // Create 8 rows (one for each token number)
  for (let number = 1; number <= 8; number++) {
    // Create all 4 turns for this token number
    for (let turn = 1; turn <= 4; turn++) {
      const tokenCell = document.createElement('div');
      tokenCell.className = 'token-showcase-cell';

      const token = createTokenElement({ number, ownerId: null, timestamp: 0 }, turn, false);
      tokenCell.appendChild(token);

      showcaseGrid.appendChild(tokenCell);
    }
  }
}

/**
 * Update lobby UI with current lobby state
 */
function updateLobbyUI() {
  const playersContainer = document.getElementById('players-container');
  const startGameButton = document.getElementById('start-game-button');
  const waitingSpinner = document.getElementById('waiting-spinner');

  if (playersContainer) {
    playersContainer.innerHTML = '';

    gameController.lobbyState.forEach(player => {
      const playerItem = document.createElement('div');
      playerItem.className = `player-item ${player.isReady ? 'ready' : ''}`;

      // Add avatar
      const avatar = createAvatarElement(player, 'medium');
      playerItem.appendChild(avatar);

      // Add name (editable input for current player when not ready, span otherwise)
      const isCurrentPlayer = player.id === gameController.myPlayerId;
      const canEditName = isCurrentPlayer && !player.isReady;

      if (canEditName) {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'player-name-input';
        nameInput.value = player.name;
        nameInput.maxLength = 20;

        // Update name on blur
        nameInput.addEventListener('blur', () => {
          const newName = nameInput.value.trim();
          if (newName && newName !== player.name) {
            if (gameController.isHost) {
              // Host updates their own name directly
              gameController.lobbyState = gameController.lobbyState.map(p =>
                p.id === gameController.myPlayerId ? { ...p, name: newName } : p
              );
              gameController.broadcastLobbyState();
              updateLobbyUI();
            } else {
              // Client sends name update request to host
              gameController.sendMessage({
                type: 'UPDATE_NAME',
                payload: {
                  playerId: gameController.myPlayerId,
                  newName: newName
                }
              });
            }
          }
        });

        // Also submit on Enter key
        nameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            nameInput.blur();
          }
        });

        playerItem.appendChild(nameInput);
      } else {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = player.name;
        playerItem.appendChild(nameSpan);
      }

      // Add host badge
      if (player.isHost) {
        const hostBadge = document.createElement('span');
        hostBadge.className = 'host-badge';
        hostBadge.textContent = 'HOST';
        playerItem.appendChild(hostBadge);
      }

      // Add ready badge
      if (player.isReady) {
        const readyBadge = document.createElement('span');
        readyBadge.className = 'ready-badge';
        readyBadge.textContent = '✓';
        playerItem.appendChild(readyBadge);
      }

      playersContainer.appendChild(playerItem);
    });
  }

  const readyCount = gameController.lobbyState.filter(p => p.isReady).length;
  const totalCount = gameController.lobbyState.length;

  const canStart = readyCount === totalCount && totalCount >= 2;

  // Show start button only for host when all ready
  if (startGameButton && gameController.isHost) {
    startGameButton.style.visibility = canStart ? 'visible' : 'hidden';
  }

  // Show debug options for host only
  const debugOptions = document.getElementById('debug-options');
  if (debugOptions && gameController.isHost) {
    debugOptions.style.display = 'block';
  }

  // Show spinner when waiting (for everyone, when button is hidden or not host)
  if (waitingSpinner) {
    const shouldShowSpinner = !canStart || !gameController.isHost;
    waitingSpinner.style.display = shouldShowSpinner ? 'flex' : 'none';
  }
}

/**
 * Set up lobby event handlers
 */
function setupLobbyEventHandlers() {
  const readyToggleButton = document.getElementById('ready-toggle-button');
  const startGameButton = document.getElementById('start-game-button');
  const copyLinkButton = document.getElementById('copy-link-button');
  const readyAllButton = document.getElementById('ready-all-button');

  if (readyToggleButton) {
    readyToggleButton.addEventListener('click', () => {
      const player = gameController.lobbyState.find(p => p.id === gameController.myPlayerId);
      if (!player) return;

      const newReadyState = !player.isReady;

      if (gameController.isHost) {
        gameController.lobbyState = gameController.lobbyState.map(p =>
          p.id === gameController.myPlayerId ? { ...p, isReady: newReadyState } : p
        );
        gameController.broadcastLobbyState();
        updateLobbyUI();
      } else {
        gameController.sendMessage({
          type: 'PLAYER_READY',
          payload: {
            playerId: gameController.myPlayerId,
            isReady: newReadyState
          }
        });
      }

      // Keep text as "Ready" but toggle green color
      if (newReadyState) {
        readyToggleButton.classList.add('ready');
      } else {
        readyToggleButton.classList.remove('ready');
      }
    });
  }

  if (readyAllButton && gameController.isHost) {
    readyAllButton.addEventListener('click', () => {
      // Set all players to ready
      gameController.lobbyState = gameController.lobbyState.map(p => ({ ...p, isReady: true }));
      gameController.broadcastLobbyState();
      updateLobbyUI();

      // Update ready toggle button to green if host is now ready
      if (readyToggleButton) {
        readyToggleButton.classList.add('ready');
      }
    });
  }

  if (startGameButton) {
    startGameButton.addEventListener('click', () => {
      gameController.startGame();
      showGameScreen();
    });
  }

  const quickTestButton = document.getElementById('quick-test-button');
  if (quickTestButton) {
    quickTestButton.addEventListener('click', () => {
      gameController.startGame();
      showGameScreen();
      // Start automated test game after a short delay
      setTimeout(() => {
        gameController.runQuickTestGame();
      }, 500);
    });
  }

  if (copyLinkButton && gameController.isHost) {
    const shareLinkInput = document.getElementById('share-link-input');
    if (shareLinkInput instanceof HTMLInputElement) {
      const shareLink = getShareableLink(gameController.myPlayerId || '');
      shareLinkInput.value = shareLink;
    }

    copyLinkButton.addEventListener('click', () => {
      const shareLinkInput = document.getElementById('share-link-input');
      if (shareLinkInput instanceof HTMLInputElement) {
        shareLinkInput.select();
        document.execCommand('copy');
        copyLinkButton.textContent = 'Copied!';
        setTimeout(() => {
          copyLinkButton.textContent = 'Copy Link';
        }, 2000);
      }
    });
  }
}

/**
 * Set up game event handlers
 */
function setupGameEventHandlers() {
  const readyButton = document.getElementById('ready-button');
  const proceedButton = document.getElementById('proceed-button');

  if (readyButton) {
    readyButton.addEventListener('click', () => {
      gameController.onReadyClick();
    });
  }

  if (proceedButton) {
    proceedButton.addEventListener('click', () => {
      gameController.onProceedClick();
    });
  }
}

/**
 * Initialize the game on page load
 */
async function initializeGame() {
  const urlInfo = getPeerIdFromUrl();

  showLobbyScreen();
  initializeLobbyUI();

  // Set up delegate to handle state changes
  gameController.setDelegate({
    onLobbyStateChange: () => {
      updateLobbyUI();
    },
    onGameStateChange: () => {
      showGameScreen();
    }
  });

  if (urlInfo.type === 'client') {
    // Client joining host
    if (urlInfo.peerId) {
      await gameController.initializeAsClient(urlInfo.peerId);
    }
  } else if (urlInfo.type === 'host') {
    // Host refresh - reuse peer ID
    if (urlInfo.peerId) {
      await gameController.initializeAsHost(urlInfo.peerId);

      // Show share link
      const shareLinkContainer = document.getElementById('share-link-container');
      if (shareLinkContainer) {
        shareLinkContainer.style.display = 'flex';
      }

      updateLobbyUI();
    }
  } else {
    // New host - get random peer ID
    const peerId = await gameController.initializeAsHost();

    // Update URL with host=XXXXX (no reload)
    updateUrlWithHostId(peerId);

    // Show share link
    const shareLinkContainer = document.getElementById('share-link-container');
    if (shareLinkContainer) {
      shareLinkContainer.style.display = 'flex';
    }

    updateLobbyUI();
  }

  setupLobbyEventHandlers();
  setupGameEventHandlers();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}
