// @ts-check

import {  createDeck, shuffleDeck, dealHoleCards, dealCommunityCards, randomizeCardBackColor  } from "./deck.js";
import {  generateTokens, applyTokenAction, resetTokens  } from "./tokens.js";
import {  MIN_PLAYERS, MAX_PLAYERS, TOTAL_TURNS  } from "./constants.js";

/**
 * @typedef {import('./deck').Card} Card
 */

/**
 * @typedef {import('./tokens').Token} Token
 */

/**
 * @typedef {import('./tokens').TokenAction} TokenAction
 */

/**
 * @typedef {'LOBBY'|'READY_UP'|'TOKEN_TRADING'|'TURN_COMPLETE'|'END_GAME'} GamePhase
 */

/**
 * @typedef {Object} Player
 * @property {string} id - Player ID
 * @property {string} name - Player name
 * @property {string} [avatarColor] - Avatar background color (hex code)
 * @property {Card[]} [holeCards] - Player's hole cards (2 cards)
 * @property {(number|null)[]} [tokenHistory] - Token numbers for each turn [turn1, turn2, turn3, turn4]
 */

/**
 * @typedef {Object} GameState
 * @property {GamePhase} phase - Current game phase
 * @property {number} turn - Current turn (0 for lobby, 1-4 for game turns)
 * @property {Player[]} players - All players (2-8)
 * @property {Card[]} deck - Shuffled deck
 * @property {Card[]} communityCards - Shared cards (max 5)
 * @property {Token[]} tokens - Available tokens
 * @property {'blue'|'red'} cardBackColor - Randomized once per game
 * @property {Object.<string, boolean>} readyStatus - Map of playerId to ready state
 */

/**
 * Creates initial lobby state
 * @param {Player[]} players - Players in the lobby
 * @returns {GameState} Initial state
 */
function createInitialState(players) {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
  }

  return {
    phase: 'LOBBY',
    turn: 0,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor
    })),
    deck: createDeck(),
    communityCards: [],
    tokens: [],
    cardBackColor: randomizeCardBackColor(),
    readyStatus: {}
  };
}

/**
 * Starts the game (LOBBY → READY_UP)
 * Deals hole cards and community cards for turn 1
 * @param {GameState} state - Current state
 * @returns {GameState} Updated state
 */
function startGame(state) {
  if (state.phase !== 'LOBBY') {
    return state;
  }

  const shuffledDeck = shuffleDeck(createDeck());
  const { holeCards, remainingDeck } = dealHoleCards(shuffledDeck, state.players.length);

  const playersWithCards = state.players.map((p, i) => ({
    ...p,
    holeCards: holeCards[i],
    tokenHistory: [null, null, null, null] // Initialize empty history for 4 turns
  }));

  // Deal community cards for turn 1 (0 cards)
  const { communityCards, remainingDeck: deckAfterCommunity } = dealCommunityCards(remainingDeck, 1);

  // Initialize ready status
  /** @type {Object.<string, boolean>} */
  const readyStatus = {};
  playersWithCards.forEach(p => {
    readyStatus[p.id] = false;
  });

  return {
    ...state,
    phase: 'READY_UP',
    turn: 1,
    players: playersWithCards,
    deck: deckAfterCommunity,
    tokens: generateTokens(state.players.length),
    communityCards,
    readyStatus
  };
}

/**
 * Checks if all tokens are owned
 * @param {GameState} state - Current state
 * @returns {boolean} True if all tokens have owners
 */
function allTokensOwned(state) {
  return state.tokens.every(token => token.ownerId !== null);
}

/**
 * Records current token ownership in player token history
 * @param {Player[]} players - Current players
 * @param {Token[]} tokens - Current tokens
 * @param {number} turn - Current turn (1-4)
 * @returns {Player[]} Updated players with token history recorded
 */
function recordTokenHistory(players, tokens, turn) {
  return players.map(player => {
    const ownedToken = tokens.find(t => t.ownerId === player.id);
    const tokenHistory = player.tokenHistory || [null, null, null, null];
    const updatedHistory = [...tokenHistory];
    updatedHistory[turn - 1] = ownedToken ? ownedToken.number : null;

    return {
      ...player,
      tokenHistory: updatedHistory
    };
  });
}

/**
 * Advances to the next phase
 * @param {GameState} state - Current state
 * @returns {GameState} Updated state
 */
function advancePhase(state) {
  switch (state.phase) {
    case 'LOBBY':
      // Use startGame() instead
      return state;

    case 'READY_UP':
      // Only advance if all players ready
      if (!allPlayersReady(state)) {
        return state;
      }
      return {
        ...state,
        phase: 'TOKEN_TRADING'
      };

    case 'TOKEN_TRADING':
      // Only advance if all tokens are owned
      if (!allTokensOwned(state)) {
        return state;
      }

      // Record token ownership history for current turn
      const playersWithHistory = recordTokenHistory(state.players, state.tokens, state.turn);

      // Advance turn or end game directly from TOKEN_TRADING
      if (state.turn < TOTAL_TURNS) {
        // Deal community cards for next turn
        const { communityCards, remainingDeck } = dealCommunityCards(state.deck, state.turn + 1);
        const allCommunityCards = [...state.communityCards, ...communityCards];

        // Reset ready status for new turn
        /** @type {Object.<string, boolean>} */
        const readyStatus = {};
        state.players.forEach(p => {
          readyStatus[p.id] = false;
        });

        // Reset tokens - return all to center (unowned)
        const resetTokensState = resetTokens(state.tokens);

        return {
          ...state,
          players: playersWithHistory,
          phase: 'READY_UP',
          turn: state.turn + 1,
          deck: remainingDeck,
          communityCards: allCommunityCards,
          readyStatus,
          tokens: resetTokensState
        };
      } else {
        // Reset ready status for end game
        /** @type {Object.<string, boolean>} */
        const readyStatus = {};
        state.players.forEach(p => {
          readyStatus[p.id] = false;
        });

        return {
          ...state,
          players: playersWithHistory,
          phase: 'END_GAME',
          readyStatus
        };
      }

    case 'TURN_COMPLETE':
      // Legacy support - should not be used anymore
      // Advance turn or end game
      if (state.turn < TOTAL_TURNS) {
        // Deal community cards for next turn
        const { communityCards, remainingDeck } = dealCommunityCards(state.deck, state.turn + 1);
        const allCommunityCards = [...state.communityCards, ...communityCards];

        // Reset ready status for new turn
        /** @type {Object.<string, boolean>} */
        const readyStatus = {};
        state.players.forEach(p => {
          readyStatus[p.id] = false;
        });

        // Reset tokens - return all to center (unowned)
        const resetTokensState = resetTokens(state.tokens);

        return {
          ...state,
          phase: 'READY_UP',
          turn: state.turn + 1,
          deck: remainingDeck,
          communityCards: allCommunityCards,
          readyStatus,
          tokens: resetTokensState
        };
      } else {
        // Reset ready status for end game
        /** @type {Object.<string, boolean>} */
        const readyStatus = {};
        state.players.forEach(p => {
          readyStatus[p.id] = false;
        });

        return {
          ...state,
          phase: 'END_GAME',
          readyStatus
        };
      }

    case 'END_GAME':
      // Use resetForNextGame() instead
      return state;

    default:
      return state;
  }
}

/**
 * Sets a player's ready status
 * @param {GameState} state - Current state
 * @param {string} playerId - Player ID
 * @param {boolean} ready - Ready status
 * @returns {GameState} Updated state
 */
function setPlayerReady(state, playerId, ready) {
  return {
    ...state,
    readyStatus: {
      ...state.readyStatus,
      [playerId]: ready
    }
  };
}

/**
 * Checks if all players are ready
 * @param {GameState} state - Current state
 * @returns {boolean} True if all ready
 */
function allPlayersReady(state) {
  return state.players.every(p => state.readyStatus[p.id] === true);
}

/**
 * Handles token action (select or steal)
 * @param {GameState} state - Current state
 * @param {TokenAction} action - Token action to apply
 * @returns {GameState} Updated state with new token ownership
 */
function handleTokenAction(state, action) {
  // Only apply token actions during TOKEN_TRADING phase
  if (state.phase !== 'TOKEN_TRADING') {
    return state;
  }

  const updatedTokens = applyTokenAction(state.tokens, action);

  return {
    ...state,
    tokens: updatedTokens
  };
}

/**
 * Resets game for next round (after END_GAME)
 * @param {GameState} state - Current state
 * @returns {GameState} Fresh game state (keeps players, new cards/tokens)
 */
function resetForNextGame(state) {
  if (state.phase !== 'END_GAME') {
    return state;
  }

  // Keep original players (without hole cards)
  const players = state.players.map(p => ({
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor
  }));

  // Create new game state but keep players
  const newState = createInitialState(players);

  // Start the game immediately
  return startGame(newState);
}

export {
  createInitialState,
  startGame,
  advancePhase,
  setPlayerReady,
  allPlayersReady,
  allTokensOwned,
  handleTokenAction,
  resetForNextGame
};
