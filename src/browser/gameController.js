// @ts-check

import { ConnectionManager } from './p2pConnection.js';
import { createInitialState, startGame, advancePhase, setPlayerReady, allPlayersReady, resetForNextGame } from './gameState.js';
import { applyTokenAction } from './tokens.js';
import { broadcastState } from './p2pSync.js';
import { updatePhaseUI } from './turnFlow.js';
import { addPlayer, updatePlayerReady, canStartGame, generateUniquePlayerName, updatePlayerName } from './lobby.js';
import { renderHoleCards, renderCommunityCards } from './cardRenderer.js';
import { createTokenElement } from './tokenRenderer.js';
import { determineWinLoss } from './winCondition.js';
import { createEndGameTable } from './endGameRenderer.js';
import { renderPlayers } from './playerRenderer.js';
import { evaluateHand } from './poker.js';
import { getNextAvailableColor } from './avatarManager.js';

/**
 * @typedef {import('./winCondition.js').PlayerWithHand} PlayerWithHand
 * @typedef {import('./poker.js').HandResult} HandResult
 */

/**
 * @typedef {Object} GameControllerDelegate
 * @property {() => void} [onLobbyStateChange] - Called when lobby state changes
 * @property {() => void} [onGameStateChange] - Called when game state changes
 */

/**
 * Main game controller that coordinates P2P, game state, and UI
 */
export class GameController {
  constructor() {
    /** @type {ConnectionManager | null} */
    this.connectionManager = null;

    /** @type {ReturnType<typeof createInitialState> | null} */
    this.gameState = null;

    /** @type {string | null} */
    this.myPlayerId = null;

    /** @type {boolean} */
    this.isHost = false;

    /** @type {Array<{id: string, name: string, isReady: boolean, isHost: boolean, avatarColor: string}>} */
    this.lobbyState = [];

    /** @type {GameControllerDelegate | null} */
    this.delegate = null;
  }

  /**
   * Set the delegate to receive state change notifications
   * @param {GameControllerDelegate} delegate
   */
  setDelegate(delegate) {
    this.delegate = delegate;
  }

  /**
   * Initialize as host
   * @returns {Promise<string>} The peer ID to share with others
   */
  async initializeAsHost() {
    this.connectionManager = new ConnectionManager();
    const peerId = await this.connectionManager.createHost();
    this.isHost = true;
    this.myPlayerId = peerId;

    // Add self to lobby with first available color
    const hostColor = getNextAvailableColor([]);
    this.lobbyState = addPlayer(this.lobbyState, peerId, 'Player 1', true, hostColor);

    // Listen for incoming connections
    this.connectionManager.onMessage((/** @type {any} */ message) => {
      this.handlePeerMessage(message);
    });

    return peerId;
  }

  /**
   * Initialize as client and connect to host
   * @param {string} hostPeerId - The host's peer ID
   * @returns {Promise<void>}
   */
  async initializeAsClient(hostPeerId) {
    this.connectionManager = new ConnectionManager();
    await this.connectionManager.joinAsClient(hostPeerId);
    this.isHost = false;
    this.myPlayerId = this.connectionManager.peerId;

    // Listen for messages from host
    this.connectionManager.onMessage((/** @type {any} */ message) => {
      this.handlePeerMessage(message);
    });

    // Send join request to host
    this.sendMessage({
      type: 'JOIN_REQUEST',
      payload: {
        playerId: this.myPlayerId,
        playerName: generateUniquePlayerName(this.lobbyState)
      }
    });
  }

  /**
   * Handle incoming P2P messages
   * @param {any} message
   */
  handlePeerMessage(message) {
    // Host assigns server timestamp to all incoming messages for consistency
    if (this.isHost) {
      message.timestamp = Date.now();
    }

    switch (message.type) {
      case 'JOIN_REQUEST':
        if (this.isHost) {
          this.handleJoinRequest(message.payload);
        }
        break;

      case 'LOBBY_UPDATE':
        if (!this.isHost) {
          this.lobbyState = message.payload.lobbyState;
          this.delegate?.onLobbyStateChange?.();
        }
        break;

      case 'STATE_UPDATE':
        if (!this.isHost) {
          this.gameState = message.payload;
          this.updateGameUI();
        }
        break;

      case 'PLAYER_READY':
        if (this.isHost) {
          this.handlePlayerReady(message.payload.playerId, message.payload.isReady);
        }
        break;

      case 'UPDATE_NAME':
        if (this.isHost) {
          this.handleUpdateName(message.payload.playerId, message.payload.newName);
        }
        break;

      case 'TURN_READY':
        if (this.isHost) {
          this.handleTurnReady(message.payload.playerId);
        }
        break;

      case 'TOKEN_ACTION':
        if (this.isHost) {
          this.handleTokenAction(message.payload);
        }
        break;

      case 'PROCEED_TURN':
        if (this.isHost) {
          this.handleProceedTurn(message.payload.playerId);
        }
        break;

      case 'NEXT_GAME_READY':
        if (this.isHost) {
          this.handleNextGameReady(message.payload.playerId);
        }
        break;
    }
  }

  /**
   * Handle new player joining (host only)
   * @param {{playerId: string, playerName: string}} payload
   */
  handleJoinRequest(payload) {
    if (!this.isHost) return;

    // Generate unique name if the requested name collides
    const uniqueName = generateUniquePlayerName(this.lobbyState);

    // Get next available color that's not already in use
    const usedColors = this.lobbyState.map(p => p.avatarColor);
    const uniqueColor = getNextAvailableColor(usedColors);

    // Add player to lobby with unique name and color
    this.lobbyState = addPlayer(
      this.lobbyState,
      payload.playerId,
      uniqueName,
      false,
      uniqueColor
    );

    // Broadcast updated lobby state
    this.broadcastLobbyState();
  }

  /**
   * Handle player ready/unready toggle
   * @param {string} playerId
   * @param {boolean} isReady
   */
  handlePlayerReady(playerId, isReady) {
    if (!this.isHost) return;

    this.lobbyState = updatePlayerReady(this.lobbyState, playerId, isReady);
    this.broadcastLobbyState();
  }

  /**
   * Handle player name update
   * @param {string} playerId
   * @param {string} newName
   */
  handleUpdateName(playerId, newName) {
    if (!this.isHost) return;

    this.lobbyState = updatePlayerName(this.lobbyState, playerId, newName);
    this.broadcastLobbyState();
  }

  /**
   * Handle player ready for turn (READY_UP phase)
   * Toggles ready state - clicking again will un-ready
   * @param {string} playerId
   */
  handleTurnReady(playerId) {
    if (!this.isHost) return;
    if (!this.gameState) return;

    // Toggle ready state
    const currentReadyState = this.gameState.readyStatus?.[playerId] ?? false;
    this.gameState = setPlayerReady(this.gameState, playerId, !currentReadyState);

    // Check if all players ready, then advance phase
    if (allPlayersReady(this.gameState)) {
      this.gameState = advancePhase(this.gameState);
    }

    this.broadcastGameState();
    this.updateGameUI();
  }

  /**
   * Broadcast lobby state to all clients
   */
  broadcastLobbyState() {
    if (!this.isHost) return;

    this.sendMessage({
      type: 'LOBBY_UPDATE',
      payload: {
        lobbyState: this.lobbyState
      }
    });

    // Notify delegate
    this.delegate?.onLobbyStateChange?.();
  }

  /**
   * Start the game (host only)
   */
  startGame() {
    if (!this.isHost) return;
    if (!canStartGame(this.lobbyState)) return;

    // Extract player data from lobby state (id, name, avatarColor only)
    const players = this.lobbyState.map(({ id, name, avatarColor }) => ({
      id,
      name,
      avatarColor
    }));

    // Initialize game state and start
    this.gameState = createInitialState(players);
    this.gameState = startGame(this.gameState);

    // Broadcast state
    this.broadcastGameState();
    this.updateGameUI();
  }

  /**
   * Handle token action from player
   * @param {import('./tokens.js').TokenAction} action
   */
  handleTokenAction(action) {
    if (!this.isHost) return;
    if (!this.gameState) return;

    // Apply token action
    this.gameState.tokens = applyTokenAction(this.gameState.tokens, action);

    // Update player token history in real-time
    this.gameState.players = this.gameState.players.map(player => {
      const ownedToken = this.gameState?.tokens.find(t => t.ownerId === player.id);
      const tokenHistory = player.tokenHistory || [null, null, null, null];
      const updatedHistory = [...tokenHistory];
      const currentTurn = this.gameState?.turn || 1;
      updatedHistory[currentTurn - 1] = ownedToken ? ownedToken.number : null;

      return {
        ...player,
        tokenHistory: updatedHistory
      };
    });

    this.broadcastGameState();
    this.updateGameUI();
  }

  /**
   * Handle proceed to next turn
   * @param {string} playerId
   */
  handleProceedTurn(playerId) {
    if (!this.isHost) return;
    if (!this.gameState) return;

    // Mark player as ready
    this.gameState = setPlayerReady(this.gameState, playerId, true);

    // Check if all players ready, then advance phase
    if (allPlayersReady(this.gameState)) {
      this.gameState = advancePhase(this.gameState);
    }

    this.broadcastGameState();
    this.updateGameUI();
  }

  /**
   * Handle "Next Game Ready" click (host only)
   * @param {string} playerId
   */
  handleNextGameReady(playerId) {
    if (!this.isHost) return;
    if (!this.gameState) return;
    if (this.gameState.phase !== 'END_GAME') return;

    // Mark player as ready for next game
    this.gameState = setPlayerReady(this.gameState, playerId, true);

    // Check if all players are ready for next game
    if (allPlayersReady(this.gameState)) {
      // Reset for next game
      this.gameState = resetForNextGame(this.gameState);
    }

    // Broadcast updated state
    this.broadcastGameState();
    this.updateGameUI();
  }

  /**
   * Send message to all peers
   * @param {any} message
   */
  sendMessage(message) {
    if (!this.connectionManager) return;

    // Only host adds timestamps (for messages it's broadcasting)
    // Clients send messages without timestamps; host assigns them on receipt
    if (this.isHost && !message.timestamp) {
      message.timestamp = Date.now();
    }

    this.connectionManager.sendMessage(message);
  }

  /**
   * Broadcast current game state to all clients
   */
  broadcastGameState() {
    if (!this.isHost) return;
    if (!this.connectionManager) return;
    if (!this.gameState) return;

    broadcastState(this.gameState, this.connectionManager.getConnections());
  }

  /**
   * Update game UI - renders cards, tokens, and phase indicator
   */
  updateGameUI() {
    if (!this.gameState) return;

    // Check if game is over
    if (this.gameState.phase === 'END_GAME') {
      this.showEndGameScreen();
      return;
    }

    // Update phase UI (phase text and ready button)
    updatePhaseUI(this.gameState.phase, this.gameState.tokens);

    // Render player avatars
    this.renderPlayersUI();

    // Render cards
    this.renderCards();

    // Render tokens (includes proceed button)
    this.renderTokensUI();

    // Update phase UI again to update proceed button visibility/state
    updatePhaseUI(this.gameState.phase, this.gameState.tokens);

    // Notify delegate
    this.delegate?.onGameStateChange?.();
  }

  /**
   * Show end game screen with results
   */
  showEndGameScreen() {
    if (!this.gameState) return;

    const endGameScreen = document.getElementById('end-game-screen');
    const gameScreen = document.getElementById('game-screen');
    const lobbyScreen = document.getElementById('lobby-screen');

    if (!endGameScreen) return;

    // Hide other screens
    if (gameScreen) gameScreen.style.display = 'none';
    if (lobbyScreen) lobbyScreen.style.display = 'none';

    // Build players array with hand evaluation for determineWinLoss
    /** @type {PlayerWithHand[]} */
    const playersWithHands = this.gameState.players
      .map((p) => {
        // Get current token from token list
        const currentToken = this.gameState?.tokens.find(t => t.ownerId === p.id);

        // Evaluate hand using poker.js
        const allCards = [...(p.holeCards || []), ...(this.gameState?.communityCards || [])];
        const hand = evaluateHand(allCards);

        // Create player with required fields
        return {
          id: p.id,
          name: p.name,
          holeCards: p.holeCards,
          currentToken: currentToken?.number,
          tokenHistory: p.tokenHistory || [null, null, null, null],
          hand
        };
      })
      .filter((p) => p.currentToken !== undefined && p.hand !== undefined)
      // Type assertion after filtering ensures both fields are non-null
      .map(p => /** @type {PlayerWithHand} */ (p));

    // Determine win/loss
    const winLossResult = determineWinLoss(playersWithHands);

    // Create end game table
    const endGameTable = createEndGameTable(winLossResult, this.gameState);

    // Clear and show end game screen
    endGameScreen.innerHTML = '';
    endGameScreen.appendChild(endGameTable);
    endGameScreen.style.display = 'block';

    // Set up "Next Game" button handler
    const nextGameButton = document.getElementById('next-game-button');
    if (nextGameButton) {
      nextGameButton.addEventListener('click', () => {
        this.onNextGameClick();
      });
    }
  }

  /**
   * Handle "Next Game" button click
   */
  onNextGameClick() {
    if (!this.gameState) return;

    if (this.isHost) {
      // Host: directly mark self as ready
      this.handleNextGameReady(this.myPlayerId || '');
    } else {
      // Client: send ready message to host
      this.sendMessage({
        type: 'NEXT_GAME_READY',
        payload: {
          playerId: this.myPlayerId
        }
      });
    }
  }

  /**
   * Render player avatars
   */
  renderPlayersUI() {
    if (!this.gameState) return;

    const playerPositionsContainer = document.getElementById('player-positions');
    if (!playerPositionsContainer) return;

    // Build player info array
    const playerInfos = this.gameState.players.map(player => {
      // Find player's current token
      const token = this.gameState?.tokens.find(t => t.ownerId === player.id);

      // Check ready status
      const isReady = this.gameState?.readyStatus?.[player.id] ?? false;

      return {
        id: player.id,
        name: player.name,
        isReady: isReady,
        tokenNumber: token?.number,
        isCurrentPlayer: player.id === this.myPlayerId,
        tokenHistory: player.tokenHistory,
        currentTurn: this.gameState?.turn || 1
      };
    });

    const interactive = this.gameState?.phase === 'TOKEN_TRADING';

    renderPlayers(playerPositionsContainer, playerInfos, {
      interactive,
      onTokenClick: (tokenNumber) => {
        if (interactive) {
          this.onTokenSelect(tokenNumber);
        }
      }
    });
  }

  /**
   * Render player cards and community cards
   */
  renderCards() {
    if (!this.gameState) return;

    const playerCardsContainer = document.getElementById('player-cards');
    const communityCardsContainer = document.getElementById('community-cards');

    if (!playerCardsContainer || !communityCardsContainer) return;

    // Find current player
    const currentPlayer = this.gameState.players.find(p => p.id === this.myPlayerId);

    // Render player's hole cards (face up for them, face down for others in future)
    if (currentPlayer && currentPlayer.holeCards && currentPlayer.holeCards.length > 0) {
      renderHoleCards(playerCardsContainer, currentPlayer.holeCards, false);
    } else {
      playerCardsContainer.innerHTML = '';
    }

    // Render community cards
    if (this.gameState.communityCards.length > 0) {
      renderCommunityCards(communityCardsContainer, this.gameState.communityCards);
    } else {
      communityCardsContainer.innerHTML = '';
    }
  }

  /**
   * Create proceed button element
   * @returns {HTMLButtonElement}
   */
  createProceedButton() {
    const button = document.createElement('button');
    button.id = 'proceed-button';
    button.className = 'circular-proceed-button hidden';

    // Add click handler
    button.addEventListener('click', () => {
      if (!button.classList.contains('waiting')) {
        this.onProceedClick();
      }
    });

    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'proceed-spinner';
    for (let i = 0; i < 12; i++) {
      const blade = document.createElement('div');
      blade.className = 'spinner-blade';
      spinner.appendChild(blade);
    }

    // Create play icon
    const playIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    playIcon.setAttribute('class', 'proceed-play-icon');
    playIcon.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M8 5v14l11-7z');
    path.setAttribute('fill', 'currentColor');
    playIcon.appendChild(path);

    button.appendChild(spinner);
    button.appendChild(playIcon);

    return button;
  }

  /**
   * Render tokens - split between center (unowned) and player positions (owned)
   * Tokens are hidden during READY_UP phase
   */
  renderTokensUI() {
    if (!this.gameState) return;

    const tokenArea = document.getElementById('token-area');
    if (!tokenArea) return;

    // Hide tokens during READY_UP phase
    if (this.gameState.phase === 'READY_UP') {
      tokenArea.innerHTML = '';
      // Also clear any player token containers
      this.gameState.players.forEach(player => {
        const container = document.getElementById(`player-token-${player.id}`);
        if (container) {
          container.innerHTML = '';
        }
      });
      return;
    }

    const interactive = this.gameState.phase === 'TOKEN_TRADING';

    // Clear and set up token area with placeholders
    tokenArea.innerHTML = '';
    tokenArea.className = 'token-pool';

    // Add dummy spacer at the start to balance the proceed button at the end
    const spacer = document.createElement('div');
    spacer.className = 'token-spacer';
    tokenArea.appendChild(spacer);

    // Create placeholders for all tokens (to prevent reflow)
    this.gameState.tokens.forEach(token => {
      const placeholder = document.createElement('div');
      placeholder.className = 'token-placeholder-slot';
      placeholder.dataset.tokenNumber = String(token.number);

      // If token is unowned, render it in the placeholder
      if (token.ownerId === null) {
        const currentTurn = this.gameState?.turn || 1;
        const tokenEl = createTokenElement(token, currentTurn, interactive);

        if (interactive) {
          tokenEl.addEventListener('click', () => {
            this.onTokenSelect(token.number);
          });
        }

        placeholder.appendChild(tokenEl);
      }

      tokenArea.appendChild(placeholder);
    });

    // Append proceed button at the end of tokens
    const proceedButton = this.createProceedButton();
    tokenArea.appendChild(proceedButton);

    // Clear any player token containers (tokens now shown in history row)
    this.gameState.players.forEach(player => {
      const container = document.getElementById(`player-token-${player.id}`);
      if (container) {
        container.style.display = 'none';
      }
    });
  }

  /**
   * Player clicks ready button (during READY_UP phase)
   */
  onReadyClick() {
    if (!this.gameState) return;

    if (this.isHost) {
      this.handleTurnReady(this.myPlayerId || '');
    } else {
      // Client sends turn ready to host
      this.sendMessage({
        type: 'TURN_READY',
        payload: {
          playerId: this.myPlayerId
        }
      });
    }
  }

  /**
   * Player clicks on a token
   * @param {number} tokenNumber
   */
  onTokenSelect(tokenNumber) {
    if (!this.gameState) return;

    // All token clicks are 'select' actions
    // The token logic handles conflict resolution automatically
    const action = {
      type: /** @type {const} */ ('select'),
      playerId: this.myPlayerId || '',
      tokenNumber,
      timestamp: Date.now()
    };

    if (this.isHost) {
      this.handleTokenAction(action);
    } else {
      this.sendMessage({
        type: 'TOKEN_ACTION',
        payload: action
      });
    }
  }

  /**
   * Player clicks proceed button
   */
  onProceedClick() {
    if (this.isHost) {
      this.handleProceedTurn(this.myPlayerId || '');
    } else {
      this.sendMessage({
        type: 'PROCEED_TURN',
        payload: {
          playerId: this.myPlayerId
        }
      });
    }
  }

  /**
   * Automated test game - runs through all turns automatically
   * Only works for host
   */
  async runQuickTestGame() {
    if (!this.isHost) return;
    if (!this.gameState) return;

    console.log('Starting quick test game...');

    // Helper to wait
    /** @type {(ms: number) => Promise<void>} */
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Run through 4 turns
    for (let turn = 1; turn <= 4; turn++) {
      console.log(`Turn ${turn} starting...`);

      // Wait for READY_UP phase
      while (this.gameState && this.gameState.phase !== 'READY_UP') {
        await wait(100);
      }

      // Ready up all players
      await wait(300);
      if (!this.gameState) return;
      for (const player of this.gameState.players) {
        this.handleTurnReady(player.id);
        await wait(200);
      }

      // Wait for TOKEN_TRADING phase
      while (this.gameState && this.gameState.phase !== 'TOKEN_TRADING') {
        await wait(100);
      }

      // Assign random tokens to each player
      await wait(300);
      if (!this.gameState) return;
      const availableTokens = [...this.gameState.tokens.map(t => t.number)];
      for (const player of this.gameState.players) {
        // Pick a random available token
        const randomIndex = Math.floor(Math.random() * availableTokens.length);
        const tokenNumber = availableTokens[randomIndex];
        availableTokens.splice(randomIndex, 1);

        const action = {
          type: /** @type {const} */ ('select'),
          playerId: player.id,
          tokenNumber,
          timestamp: Date.now()
        };

        this.handleTokenAction(action);
        await wait(200);
      }

      // Wait for all tokens to be owned
      while (this.gameState && !this.gameState.tokens.every(t => t.ownerId !== null)) {
        await wait(100);
      }

      // Proceed all players
      await wait(300);
      if (!this.gameState) return;
      for (const player of this.gameState.players) {
        this.handleProceedTurn(player.id);
        await wait(200);
      }

      console.log(`Turn ${turn} complete`);
    }

    console.log('Quick test game complete - showing end game screen');
  }
}
