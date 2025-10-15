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
 * @property {Object.<string, number[]>} decisiveKickers - Map of playerId to array of decisive kicker indices (which tiebreaker positions mattered)
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
 * Finds which bestFive card indices made the difference between two players
 * Returns indices of cards that are different and not in primaryCards
 * @param {PlayerWithHand} p1 - First player
 * @param {PlayerWithHand} p2 - Second player
 * @returns {number[]} Indices in bestFive array that are decisive kickers
 */
function findDecisiveKickerIndices(p1, p2) {
  // Different rank - no kicker comparison
  if (p1.hand.rank !== p2.hand.rank) {
    return [];
  }

  // If identical hands, no decisive kickers
  const comparison = comparePlayerHands(p1, p2);
  if (comparison === 0) {
    return [];
  }

  // Get primary card values to exclude them
  const p1PrimaryValues = new Set(
    p1.hand.primaryCards?.map(c => c.rank + c.suit) || []
  );
  const p2PrimaryValues = new Set(
    p2.hand.primaryCards?.map(c => c.rank + c.suit) || []
  );

  // Compare bestFive cards in order, looking for first difference in non-primary cards
  const maxLen = Math.max(p1.hand.bestFive?.length || 0, p2.hand.bestFive?.length || 0);

  for (let i = 0; i < maxLen; i++) {
    const card1 = p1.hand.bestFive?.[i];
    const card2 = p2.hand.bestFive?.[i];

    if (!card1 || !card2) continue;

    // Check if these cards are primary cards (skip if so)
    const card1Key = card1.rank + card1.suit;
    const card2Key = card2.rank + card2.suit;
    const card1IsPrimary = p1PrimaryValues.has(card1Key);
    const card2IsPrimary = p2PrimaryValues.has(card2Key);

    // Skip if either card is a primary card
    if (card1IsPrimary || card2IsPrimary) continue;

    // Compare card ranks
    const val1 = getRankValue(card1.rank);
    const val2 = getRankValue(card2.rank);

    if (val1 !== val2) {
      // This is the first differing kicker - this is the decisive one
      return [i];
    }
  }

  return [];
}

/**
 * Gets numeric value for a rank
 * @param {string} rank - Card rank
 * @returns {number} Numeric value
 */
function getRankValue(rank) {
  /** @type {Record<string, number>} */
  const values = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return values[rank] || 0;
}

/**
 * Calculates which kicker positions were decisive for each player
 * @param {PlayerWithHand[]} sortedPlayers - Players sorted by hand strength
 * @returns {Object.<string, number[]>} Map of playerId to array of decisive bestFive indices
 */
function calculateDecisiveKickers(sortedPlayers) {
  /** @type {Object.<string, number[]>} */
  const decisiveKickers = {};

  // Initialize all players with empty arrays
  for (const player of sortedPlayers) {
    decisiveKickers[player.id] = [];
  }

  // For each player, compare with adjacent players (before and after)
  for (let i = 0; i < sortedPlayers.length; i++) {
    const currentPlayer = sortedPlayers[i];
    const decisiveIndices = new Set();

    // Compare with previous player (if exists)
    if (i > 0) {
      const prevPlayer = sortedPlayers[i - 1];
      const indices = findDecisiveKickerIndices(currentPlayer, prevPlayer);
      indices.forEach(idx => decisiveIndices.add(idx));
    }

    // Compare with next player (if exists)
    if (i < sortedPlayers.length - 1) {
      const nextPlayer = sortedPlayers[i + 1];
      const indices = findDecisiveKickerIndices(currentPlayer, nextPlayer);
      indices.forEach(idx => decisiveIndices.add(idx));
    }

    decisiveKickers[currentPlayer.id] = Array.from(decisiveIndices).sort((a, b) => a - b);
  }

  return decisiveKickers;
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

  // Calculate decisive kickers
  const decisiveKickers = calculateDecisiveKickers(sortedPlayers);

  return {
    isWin: allCorrect,
    sortedPlayers,
    correctness,
    expectedTokens,
    decisiveKickers
  };
}

export {
  sortPlayersByHandStrength,
  determineWinLoss
};
