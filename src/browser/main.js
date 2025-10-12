// @ts-check

import { GameController } from './gameController.js';

/**
 * Main entry point - initializes the game
 */

let gameController = new GameController();

/**
 * Parse peer ID from URL
 * @returns {string | null}
 */
function getPeerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('peer');
}

/**
 * Update URL with peer ID (for host)
 * @param {string} peerId
 */
function updateUrlWithPeerId(peerId) {
  const url = new URL(window.location.href);
  url.searchParams.set('peer', peerId);
  window.history.replaceState({}, '', url.toString());
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
      <button id="ready-toggle-button">Ready</button>
      <button id="start-game-button" style="display: none;">Start Game</button>
      <div id="share-link-container" style="display: none;">
        <input type="text" id="share-link-input" readonly />
        <button id="copy-link-button">Copy Link</button>
      </div>
    </div>
    <div id="lobby-status">
      <p id="players-ready-text">Players Ready: 0 out of 0</p>
    </div>
  `;
}

/**
 * Update lobby UI with current lobby state
 */
function updateLobbyUI() {
  const playersContainer = document.getElementById('players-container');
  const playersReadyText = document.getElementById('players-ready-text');
  const startGameButton = document.getElementById('start-game-button');

  if (playersContainer) {
    playersContainer.innerHTML = gameController.lobbyState
      .map(player => `
        <div class="player-item ${player.isReady ? 'ready' : ''}">
          <span class="player-name">${player.name}</span>
          ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
          ${player.isReady ? '<span class="ready-badge">✓</span>' : ''}
        </div>
      `)
      .join('');
  }

  const readyCount = gameController.lobbyState.filter(p => p.isReady).length;
  const totalCount = gameController.lobbyState.length;

  if (playersReadyText) {
    playersReadyText.textContent = `Players Ready: ${readyCount} out of ${totalCount}`;
  }

  // Show start button only for host when all ready
  if (startGameButton && gameController.isHost) {
    startGameButton.style.display = readyCount === totalCount && totalCount >= 2 ? 'block' : 'none';
  }
}

/**
 * Set up lobby event handlers
 */
function setupLobbyEventHandlers() {
  const readyToggleButton = document.getElementById('ready-toggle-button');
  const startGameButton = document.getElementById('start-game-button');
  const copyLinkButton = document.getElementById('copy-link-button');

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

      readyToggleButton.textContent = newReadyState ? 'Unready' : 'Ready';
    });
  }

  if (startGameButton) {
    startGameButton.addEventListener('click', () => {
      gameController.startGame();
      showGameScreen();
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
  const peerIdFromUrl = getPeerIdFromUrl();

  showLobbyScreen();
  initializeLobbyUI();

  if (peerIdFromUrl) {
    // Client mode - join existing game
    console.log('Joining game as client:', peerIdFromUrl);
    await gameController.initializeAsClient(peerIdFromUrl);

    // Update lobby UI with received state (will be sent by host)
    gameController.updateLobbyUI = updateLobbyUI;
    gameController.updateGameUI = () => {
      showGameScreen();
      // TODO: Update game UI elements
    };
  } else {
    // Host mode - create new game
    console.log('Creating game as host');
    const peerId = await gameController.initializeAsHost();

    // Update URL with peer ID
    updateUrlWithPeerId(peerId);

    // Show share link
    const shareLinkContainer = document.getElementById('share-link-container');
    if (shareLinkContainer) {
      shareLinkContainer.style.display = 'block';
    }

    // Update lobby UI
    gameController.updateLobbyUI = updateLobbyUI;
    gameController.updateGameUI = () => {
      showGameScreen();
      // TODO: Update game UI elements
    };

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
