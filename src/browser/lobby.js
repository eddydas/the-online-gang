// @ts-check

/**
 * @typedef {Object} LobbyPlayer
 * @property {string} id - Player ID
 * @property {string} name - Player name
 * @property {boolean} isReady - Ready status
 * @property {boolean} isHost - Whether player is host
 */

const MAX_NAME_LENGTH = 20;
const MIN_PLAYERS = 2;

/**
 * Validates player name
 * @param {string} name - Player name to validate
 * @returns {boolean} True if valid
 */
function validatePlayerName(name) {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH;
}

/**
 * Checks if game can be started
 * @param {LobbyPlayer[]} players - Array of lobby players
 * @returns {boolean} True if game can start
 */
function canStartGame(players) {
  // Need at least 2 players
  if (players.length < MIN_PLAYERS) {
    return false;
  }

  // All players must be ready
  return players.every(p => p.isReady);
}

/**
 * Gets all lobby players
 * @param {LobbyPlayer[]} lobbyState - Current lobby state
 * @returns {LobbyPlayer[]} Array of players
 */
function getLobbyPlayers(lobbyState) {
  return [...lobbyState];
}

/**
 * Adds a player to the lobby
 * @param {LobbyPlayer[]} lobbyState - Current lobby state
 * @param {string} id - Player ID
 * @param {string} name - Player name
 * @param {boolean} isHost - Whether player is host
 * @returns {LobbyPlayer[]} Updated lobby state
 */
function addPlayer(lobbyState, id, name, isHost) {
  const newPlayer = {
    id,
    name,
    isReady: false,
    isHost
  };

  return [...lobbyState, newPlayer];
}

/**
 * Removes a player from the lobby
 * @param {LobbyPlayer[]} lobbyState - Current lobby state
 * @param {string} playerId - ID of player to remove
 * @returns {LobbyPlayer[]} Updated lobby state
 */
function removePlayer(lobbyState, playerId) {
  return lobbyState.filter(p => p.id !== playerId);
}

/**
 * Updates a player's ready status
 * @param {LobbyPlayer[]} lobbyState - Current lobby state
 * @param {string} playerId - ID of player to update
 * @param {boolean} isReady - New ready status
 * @returns {LobbyPlayer[]} Updated lobby state
 */
function updatePlayerReady(lobbyState, playerId, isReady) {
  return lobbyState.map(p =>
    p.id === playerId
      ? { ...p, isReady }
      : p
  );
}

/**
 * Updates a player's name (only if not ready)
 * @param {LobbyPlayer[]} lobbyState - Current lobby state
 * @param {string} playerId - ID of player to update
 * @param {string} newName - New name
 * @returns {LobbyPlayer[]} Updated lobby state
 */
function updatePlayerName(lobbyState, playerId, newName) {
  return lobbyState.map(p => {
    if (p.id === playerId) {
      // Only allow name change if not ready
      if (p.isReady) {
        return p; // Return unchanged
      }
      return { ...p, name: newName };
    }
    return p;
  });
}

/**
 * Checks if a name is already taken (case-insensitive)
 * @param {LobbyPlayer[]} lobbyState - Current lobby state
 * @param {string} name - Name to check
 * @returns {boolean} True if name is taken
 */
function isNameTaken(lobbyState, name) {
  const lowerName = name.toLowerCase();
  return lobbyState.some(p => p.name.toLowerCase() === lowerName);
}

export {
  validatePlayerName,
  canStartGame,
  getLobbyPlayers,
  addPlayer,
  removePlayer,
  updatePlayerReady,
  updatePlayerName,
  isNameTaken
};
