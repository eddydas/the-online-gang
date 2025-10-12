// @ts-check

import { ConnectionManager } from './p2pConnection.js';
import { createInitialState, startGame, advancePhase, setPlayerReady, allPlayersReady } from './gameState.js';
import { applyTokenAction } from './tokens.js';
import { broadcastState } from './p2pSync.js';
import { updatePhaseUI } from './turnFlow.js';
import { addPlayer, updatePlayerReady, canStartGame } from './lobby.js';
import { renderHoleCards, renderCommunityCards } from './cardRenderer.js';
import { renderTokens } from './tokenRenderer.js';
import { determineWinLoss } from './winCondition.js';
import { createEndGameTable } from './endGameRenderer.js';

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

    /** @type {Array<{id: string, name: string, isReady: boolean, isHost: boolean}>} */
    this.lobbyState = [];
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

    // Add self to lobby
    this.lobbyState = addPlayer(this.lobbyState, peerId, 'Player 1', true);

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
        playerName: `Player ${this.lobbyState.length + 1}`
      }
    });
  }

  /**
   * Handle incoming P2P messages
   * @param {any} message
   */
  handlePeerMessage(message) {
    switch (message.type) {
      case 'JOIN_REQUEST':
        if (this.isHost) {
          this.handleJoinRequest(message.payload);
        }
        break;

      case 'LOBBY_UPDATE':
        if (!this.isHost) {
          this.lobbyState = message.payload.lobbyState;
          this.updateLobbyUI();
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
    }
  }

  /**
   * Handle new player joining (host only)
   * @param {{playerId: string, playerName: string}} payload
   */
  handleJoinRequest(payload) {
    if (!this.isHost) return;

    // Add player to lobby
    this.lobbyState = addPlayer(
      this.lobbyState,
      payload.playerId,
      payload.playerName,
      false
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
  }

  /**
   * Start the game (host only)
   */
  startGame() {
    if (!this.isHost) return;
    if (!canStartGame(this.lobbyState)) return;

    // Create players array from lobby state
    const players = this.lobbyState.map(p => ({
      id: p.id,
      name: p.name
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

    this.gameState.tokens = applyTokenAction(this.gameState.tokens, action);
    this.broadcastGameState();
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
  }

  /**
   * Send message to all peers
   * @param {any} message
   */
  sendMessage(message) {
    if (!this.connectionManager) return;
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
   * Update lobby UI
   */
  updateLobbyUI() {
    // TODO: Implement lobby UI updates
    console.log('Lobby state:', this.lobbyState);
  }

  /**
   * Update game UI
   */
  updateGameUI() {
    if (!this.gameState) return;

    // Check if game is over
    if (this.gameState.phase === 'END_GAME') {
      this.showEndGameScreen();
      return;
    }

    // Update phase UI
    updatePhaseUI(this.gameState.phase);

    // Render cards
    this.renderCards();

    // Render tokens
    this.renderTokensUI();

    console.log('Game state:', this.gameState);
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
    const playersWithHands = this.gameState.players
      .map((p) => {
        // Get current token from token list
        const currentToken = this.gameState?.tokens.find(t => t.ownerId === p.id);

        return {
          ...p,
          currentToken: currentToken?.number || null,
          hand: /** @type {any} */ (p.holeCards) ? null : null // Placeholder - hand should be evaluated
        };
      })
      .filter(p => p.currentToken !== null); // Only include players with tokens

    // Determine win/loss
    const winLossResult = determineWinLoss(/** @type {any} */ (playersWithHands));

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
    // TODO: Implement next game logic
    console.log('Next game clicked');
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
   * Render tokens
   */
  renderTokensUI() {
    if (!this.gameState) return;

    const tokenArea = document.getElementById('token-area');
    if (!tokenArea) return;

    const interactive = this.gameState.phase === 'TOKEN_TRADING';

    renderTokens(
      tokenArea,
      this.gameState.tokens,
      this.gameState.turn,
      interactive,
      (/** @type {number} */ tokenNumber) => {
        this.onTokenSelect(tokenNumber);
      }
    );
  }

  /**
   * Player clicks ready button
   */
  onReadyClick() {
    if (!this.gameState) return;

    if (this.isHost) {
      this.gameState = setPlayerReady(this.gameState, this.myPlayerId || '', true);

      // Check if all ready, advance phase
      if (allPlayersReady(this.gameState)) {
        this.gameState = advancePhase(this.gameState);
      }

      this.broadcastGameState();
      this.updateGameUI();
    } else {
      // Client sends ready state to host
      this.sendMessage({
        type: 'PLAYER_READY',
        payload: {
          playerId: this.myPlayerId,
          isReady: true
        }
      });
    }
  }

  /**
   * Player selects a token
   * @param {number} tokenNumber
   */
  onTokenSelect(tokenNumber) {
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
}
