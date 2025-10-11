// @ts-check

/**
 * @typedef {import('./poker').HandResult} HandResult
 */

/**
 * @typedef {import('./gameState').Player} Player
 */

/**
 * @typedef {Object} PlayerWithHandExtension
 * @property {HandResult} hand - Evaluated hand
 * @property {number} currentToken - Selected token number
 */

/**
 * @typedef {Player & PlayerWithHandExtension} PlayerWithHand
 */

/**
 * @typedef {Object} WinLossResult
 * @property {boolean} isWin - True if all players correct
 * @property {PlayerWithHand[]} sortedPlayers - Players sorted by hand strength
 * @property {Object.<string, boolean>} correctness - Map of playerId to isCorrect
 * @property {number[]} expectedTokens - Expected token order
 */

/**
 * Compares two players by hand strength
 * @param {PlayerWithHand} p1 - First player
 * @param {PlayerWithHand} p2 - Second player
 * @returns {number} Negative if p1 stronger, positive if p2 stronger, 0 if tied
 */
function comparePlayerHands(p1, p2) {
  // Higher rank is better
  if (p1.hand.rank !== p2.hand.rank) {
    return p2.hand.rank - p1.hand.rank;
  }

  // Same rank, compare tiebreakers
  const len = Math.max(p1.hand.tiebreakers.length, p2.hand.tiebreakers.length);
  for (let i = 0; i < len; i++) {
    const val1 = p1.hand.tiebreakers[i] || 0;
    const val2 = p2.hand.tiebreakers[i] || 0;
    if (val1 !== val2) {
      return val2 - val1; // Higher value is better
    }
  }

  // Identical hands
  return 0;
}

/**
 * Sorts players by hand strength (strongest first)
 * @param {PlayerWithHand[]} players - Players to sort
 * @returns {PlayerWithHand[]} Sorted players (new array)
 */
function sortPlayersByHandStrength(players) {
  return [...players].sort(comparePlayerHands);
}

/**
 * Groups players by their hand strength (for tie detection)
 * @param {PlayerWithHand[]} sortedPlayers - Players sorted by hand strength
 * @returns {PlayerWithHand[][]} Array of groups (each group has tied players)
 */
function groupPlayersByTies(sortedPlayers) {
  /** @type {PlayerWithHand[][]} */
  const groups = [];

  for (const player of sortedPlayers) {
    if (groups.length === 0) {
      groups.push([player]);
      continue;
    }

    const lastGroup = groups[groups.length - 1];
    const lastPlayer = lastGroup[0];

    // Check if current player ties with last group
    if (comparePlayerHands(player, lastPlayer) === 0) {
      lastGroup.push(player);
    } else {
      groups.push([player]);
    }
  }

  return groups;
}

/**
 * Determines win/loss based on token selections
 * @param {PlayerWithHand[]} players - All players with hands
 * @returns {WinLossResult} Win/loss determination
 */
function determineWinLoss(players) {
  // Sort players by hand strength
  const sortedPlayers = sortPlayersByHandStrength(players);

  // Group players by ties
  const tieGroups = groupPlayersByTies(sortedPlayers);

  // Generate expected tokens (highest token for strongest player)
  const playerCount = players.length;
  /** @type {number[]} */
  const expectedTokens = [];
  let currentExpectedToken = playerCount;

  for (const group of tieGroups) {
    // All players in this group should have tokens in range [currentExpectedToken - group.length + 1, currentExpectedToken]
    for (let i = 0; i < group.length; i++) {
      expectedTokens.push(currentExpectedToken);
    }
    currentExpectedToken -= group.length;
  }

  // Validate each player's token
  /** @type {Object.<string, boolean>} */
  const correctness = {};
  let allCorrect = true;

  for (let i = 0; i < tieGroups.length; i++) {
    const group = tieGroups[i];

    // Calculate expected token range for this group
    const maxToken = playerCount - tieGroups.slice(0, i).reduce((sum, g) => sum + g.length, 0);
    const minToken = maxToken - group.length + 1;

    // Get all tokens in this group
    const groupTokens = group.map(p => p.currentToken);

    // Check if all tokens are within the valid range
    const allInRange = groupTokens.every(token => token >= minToken && token <= maxToken);

    // Check if all tokens are unique within the group
    const uniqueTokens = new Set(groupTokens);
    const allUnique = uniqueTokens.size === groupTokens.length;

    // Mark correctness for each player in group
    for (const player of group) {
      const isCorrect = allInRange && allUnique;
      correctness[player.id] = isCorrect;
      if (!isCorrect) {
        allCorrect = false;
      }
    }
  }

  return {
    isWin: allCorrect,
    sortedPlayers,
    correctness,
    expectedTokens
  };
}

export {
  sortPlayersByHandStrength,
  determineWinLoss
};
