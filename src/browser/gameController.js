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
import { renderPlayers } from './playerRenderer.js';

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

    /** @type {Array<{id: string, name: string, isReady: boolean, isHost: boolean}>} */
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

    console.log('Host initialized with peer ID:', peerId);

    // Add self to lobby
    this.lobbyState = addPlayer(this.lobbyState, peerId, 'Player 1', true);

    // Listen for incoming connections
    this.connectionManager.onMessage((/** @type {any} */ message) => {
      console.log('Host received message:', message);
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

    console.log('Client connected with peer ID:', this.myPlayerId);

    // Listen for messages from host
    this.connectionManager.onMessage((/** @type {any} */ message) => {
      console.log('Client received message:', message);
      this.handlePeerMessage(message);
    });

    // Send join request to host
    console.log('Sending JOIN_REQUEST to host');
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
    console.log('[DEBUG] handlePeerMessage received:', message.type);
    console.log('Received P2P message:', message.type, message.payload);

    // Host assigns server timestamp to all incoming messages for consistency
    if (this.isHost) {
      message.timestamp = Date.now();
    }

    switch (message.type) {
      case 'JOIN_REQUEST':
        if (this.isHost) {
          console.log('Host handling JOIN_REQUEST from:', message.payload.playerId);
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
        console.log('[DEBUG] STATE_UPDATE received, phase:', message.payload.phase);
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

      case 'TURN_READY':
        console.log('[DEBUG] TURN_READY received from:', message.payload.playerId);
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
        console.log('[DEBUG] PROCEED_TURN received from:', message.payload.playerId);
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

    console.log('Adding player to lobby:', payload);

    // Add player to lobby
    this.lobbyState = addPlayer(
      this.lobbyState,
      payload.playerId,
      payload.playerName,
      false
    );

    console.log('Updated lobby state:', this.lobbyState);

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
   * Handle player ready for turn (READY_UP phase)
   * @param {string} playerId
   */
  handleTurnReady(playerId) {
    if (!this.isHost) return;
    if (!this.gameState) return;

    console.log('[DEBUG] handleTurnReady called for player:', playerId);

    // Mark player as ready
    this.gameState = setPlayerReady(this.gameState, playerId, true);

    // Check if all players ready, then advance phase
    if (allPlayersReady(this.gameState)) {
      console.log('[DEBUG] All players ready, advancing phase from:', this.gameState.phase);
      this.gameState = advancePhase(this.gameState);
      console.log('[DEBUG] Phase advanced to:', this.gameState.phase);
    }

    this.broadcastGameState();
    this.updateGameUI();
  }

  /**
   * Broadcast lobby state to all clients
   */
  broadcastLobbyState() {
    if (!this.isHost) return;

    console.log('Broadcasting lobby state to all clients');

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
    console.log('[DEBUG] handleProceedTurn called for player:', playerId);
    if (!this.isHost) return;
    if (!this.gameState) return;

    // Mark player as ready
    this.gameState = setPlayerReady(this.gameState, playerId, true);

    // Check if all players ready, then advance phase
    if (allPlayersReady(this.gameState)) {
      console.log('[DEBUG] All players ready, advancing phase from:', this.gameState.phase);
      this.gameState = advancePhase(this.gameState);
      console.log('[DEBUG] Phase advanced to:', this.gameState.phase);
    }

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

    console.log('Sending message:', message);
    this.connectionManager.sendMessage(message);
  }

  /**
   * Broadcast current game state to all clients
   */
  broadcastGameState() {
    console.log('[DEBUG] broadcastGameState called');
    if (!this.isHost) return;
    if (!this.connectionManager) return;
    if (!this.gameState) return;

    broadcastState(this.gameState, this.connectionManager.getConnections());
  }

  /**
   * Update game UI - renders cards, tokens, and phase indicator
   */
  updateGameUI() {
    console.log('[DEBUG] updateGameUI called, stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'));

    if (!this.gameState) return;

    // Check if game is over
    if (this.gameState.phase === 'END_GAME') {
      this.showEndGameScreen();
      return;
    }

    // Update phase UI
    updatePhaseUI(this.gameState.phase);

    // Render player avatars
    this.renderPlayersUI();

    // Render cards
    this.renderCards();

    // Render tokens
    this.renderTokensUI();

    console.log('Game state:', this.gameState);

    // Notify delegate
    console.log('[DEBUG] About to call delegate.onGameStateChange');
    this.delegate?.onGameStateChange?.();
    console.log('[DEBUG] Finished calling delegate.onGameStateChange');
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
    // Filter to only include players who have both a token and evaluated hand
    /** @type {PlayerWithHand[]} */
    const playersWithHands = this.gameState.players
      .map((p) => {
        // Get current token from token list
        const currentToken = this.gameState?.tokens.find(t => t.ownerId === p.id);

        // Create player with required fields
        // Note: hand should be evaluated by poker.js evaluateHand before END_GAME phase
        return {
          id: p.id,
          name: p.name,
          holeCards: p.holeCards,
          currentToken: currentToken?.number,
          hand: /** @type {HandResult | undefined} */ (undefined) // TODO: Get from evaluated hands
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
    // TODO: Implement next game logic
    console.log('Next game clicked');
  }

  /**
   * Render player avatars
   */
  renderPlayersUI() {
    if (!this.gameState) return;

    const playerAvatarsContainer = document.getElementById('player-avatars');
    if (!playerAvatarsContainer) return;

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
        isCurrentPlayer: player.id === this.myPlayerId
      };
    });

    renderPlayers(playerAvatarsContainer, playerInfos);
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
}
