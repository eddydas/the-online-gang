// @ts-check

/**
 * @typedef {import('./deck').Card} Card
 */

/**
 * @typedef {Object} HandResult
 * @property {number} rank - Hand rank (1-10, higher is better)
 * @property {string} name - Hand name ("Pair", "Two Pair", etc.)
 * @property {Card[]} bestFive - Best 5 cards from 7 available
 * @property {Card[]} primaryCards - Cards that form the hand (excluding kickers)
 * @property {number[]} tiebreakers - Kicker values for comparison
 * @property {string} description - Full hand description
 */

/** @type {Record<string, number>} */
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

/**
 * Gets numeric value for a rank
 * @param {string} rank - Card rank
 * @returns {number} Numeric value
 */
function getRankValue(rank) {
  return RANK_VALUES[rank];
}

/**
 * Checks if cards form a flush
 * @param {Card[]} cards - Cards to check
 * @returns {Card[] | null} Flush cards or null
 */
function checkFlush(cards) {
  /** @type {Record<string, Card[]>} */
  const suits = {};
  for (const card of cards) {
    if (!suits[card.suit]) suits[card.suit] = [];
    suits[card.suit].push(card);
  }

  for (const suit in suits) {
    if (suits[suit].length >= 5) {
      // Return highest 5 cards of flush suit
      return suits[suit]
        .sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))
        .slice(0, 5);
    }
  }
  return null;
}

/**
 * Checks if cards form a straight
 * @param {Card[]} cards - Cards to check
 * @returns {Card[] | null} Straight cards or null
 */
function checkStraight(cards) {
  const uniqueRanks = [...new Set(cards.map(c => c.rank))];
  const values = uniqueRanks.map(r => getRankValue(r)).sort((a, b) => b - a);

  // Check for Ace-low straight (5-4-3-2-A)
  if (values.includes(14) && values.includes(5) && values.includes(4) &&
      values.includes(3) && values.includes(2)) {
    const straightCards = [5, 4, 3, 2, 14].map(val =>
      cards.find(c => getRankValue(c.rank) === val)
    ).filter(c => c !== undefined);
    return straightCards;
  }

  // Check for regular straights
  for (let i = 0; i <= values.length - 5; i++) {
    if (values[i] - values[i + 4] === 4) {
      const straightValues = [values[i], values[i+1], values[i+2], values[i+3], values[i+4]];
      const straightCards = straightValues.map(val =>
        cards.find(c => getRankValue(c.rank) === val)
      ).filter(c => c !== undefined);
      return straightCards;
    }
  }
  return null;
}

/**
 * Groups cards by rank
 * @param {Card[]} cards - Cards to group
 * @returns {Object.<string, Card[]>} Cards grouped by rank
 */
function groupByRank(cards) {
  /** @type {Object.<string, Card[]>} */
  const groups = {};
  for (const card of cards) {
    if (!groups[card.rank]) groups[card.rank] = [];
    groups[card.rank].push(card);
  }
  return groups;
}

/**
 * Evaluates a poker hand from 7 cards
 * @param {Card[]} cards - Array of 7 cards (2 hole + 5 community)
 * @returns {HandResult} Evaluation result
 */
function evaluateHand(cards) {
  if (cards.length !== 7) {
    throw new Error('evaluateHand requires exactly 7 cards');
  }

  const sortedCards = [...cards].sort((a, b) =>
    getRankValue(b.rank) - getRankValue(a.rank)
  );

  // Check for flush and straight
  const flushCards = checkFlush(sortedCards);
  const straightCards = checkStraight(sortedCards);

  // Royal Flush
  if (flushCards && straightCards) {
    const flushSuit = flushCards[0].suit;
    const straightInFlushSuit = straightCards.every(c => c.suit === flushSuit);
    if (straightInFlushSuit) {
      const highestValue = Math.max(...straightCards.map(c => getRankValue(c.rank)));
      if (highestValue === 14 && straightCards.length === 5) {
        // Check if it's 10-J-Q-K-A
        const values = straightCards.map(c => getRankValue(c.rank)).sort((a,b) => b-a);
        if (values[0] === 14 && values[4] === 10) {
          return {
            rank: 10,
            name: 'Royal Flush',
            bestFive: straightCards.slice(0, 5),
            primaryCards: straightCards.slice(0, 5), // All 5 cards are primary
            tiebreakers: [14],
            description: 'Royal Flush'
          };
        }
      }
      // Straight Flush (not royal)
      return {
        rank: 9,
        name: 'Straight Flush',
        bestFive: straightCards.slice(0, 5),
        primaryCards: straightCards.slice(0, 5), // All 5 cards are primary
        tiebreakers: straightCards.slice(0, 5).map(c => getRankValue(c.rank)),
        description: `Straight Flush, ${straightCards[0].rank} high`
      };
    }
  }

  // Group by rank for other hands
  const groups = groupByRank(sortedCards);
  const groupSizes = Object.keys(groups)
    .map(rank => ({ rank, count: groups[rank].length }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return getRankValue(b.rank) - getRankValue(a.rank);
    });

  // Four of a Kind
  if (groupSizes[0].count === 4) {
    const quadRank = groupSizes[0].rank;
    const kicker = groupSizes.find(g => g.rank !== quadRank);
    if (!kicker) {
      throw new Error('Four of a Kind requires a kicker');
    }
    const bestFive = [
      ...groups[quadRank],
      groups[kicker.rank][0]
    ];
    return {
      rank: 8,
      name: 'Four of a Kind',
      bestFive,
      primaryCards: groups[quadRank], // Only the quad
      tiebreakers: [getRankValue(quadRank), getRankValue(kicker.rank)],
      description: `Four ${quadRank}`
    };
  }

  // Full House
  if (groupSizes[0].count === 3 && groupSizes[1].count >= 2) {
    const tripRank = groupSizes[0].rank;
    const pairRank = groupSizes[1].rank;
    const bestFive = [
      ...groups[tripRank],
      ...groups[pairRank].slice(0, 2)
    ];
    return {
      rank: 7,
      name: 'Full House',
      bestFive,
      primaryCards: bestFive, // All 5 cards are primary (trip + pair)
      tiebreakers: [getRankValue(tripRank), getRankValue(pairRank)],
      description: `Full House, ${tripRank} over ${pairRank}`
    };
  }

  // Flush
  if (flushCards) {
    const tiebreakers = flushCards.slice(0, 5).map(c => getRankValue(c.rank));
    return {
      rank: 6,
      name: 'Flush',
      bestFive: flushCards.slice(0, 5),
      primaryCards: flushCards.slice(0, 5), // All 5 cards are primary
      tiebreakers,
      description: `Flush, ${flushCards[0].rank} high`
    };
  }

  // Straight
  if (straightCards) {
    const tiebreakers = straightCards.slice(0, 5).map(c => getRankValue(c.rank));
    // For Ace-low straight, adjust tiebreaker
    if (tiebreakers.includes(14) && tiebreakers.includes(2)) {
      tiebreakers[tiebreakers.indexOf(14)] = 1; // Ace low
    }
    return {
      rank: 5,
      name: 'Straight',
      bestFive: straightCards.slice(0, 5),
      primaryCards: straightCards.slice(0, 5), // All 5 cards are primary
      tiebreakers,
      description: `Straight, ${straightCards[0].rank} high`
    };
  }

  // Three of a Kind
  if (groupSizes[0].count === 3) {
    const tripRank = groupSizes[0].rank;
    const kickers = groupSizes
      .filter(g => g.rank !== tripRank)
      .slice(0, 2);
    const bestFive = [
      ...groups[tripRank],
      groups[kickers[0].rank][0],
      groups[kickers[1].rank][0]
    ];
    return {
      rank: 4,
      name: 'Three of a Kind',
      bestFive,
      primaryCards: groups[tripRank], // Only the trip
      tiebreakers: [
        getRankValue(tripRank),
        getRankValue(kickers[0].rank),
        getRankValue(kickers[1].rank)
      ],
      description: `Three ${tripRank}`
    };
  }

  // Two Pair
  if (groupSizes[0].count === 2 && groupSizes[1].count === 2) {
    const pair1Rank = groupSizes[0].rank;
    const pair2Rank = groupSizes[1].rank;
    const kicker = groupSizes.find(g => g.count === 1);
    if (!kicker) {
      throw new Error('Two Pair requires a kicker');
    }
    const bestFive = [
      ...groups[pair1Rank],
      ...groups[pair2Rank],
      groups[kicker.rank][0]
    ];
    return {
      rank: 3,
      name: 'Two Pair',
      bestFive,
      primaryCards: [...groups[pair1Rank], ...groups[pair2Rank]], // Both pairs
      tiebreakers: [
        getRankValue(pair1Rank),
        getRankValue(pair2Rank),
        getRankValue(kicker.rank)
      ],
      description: `Two Pair, ${pair1Rank} and ${pair2Rank}`
    };
  }

  // Pair
  if (groupSizes[0].count === 2) {
    const pairRank = groupSizes[0].rank;
    const kickers = groupSizes
      .filter(g => g.rank !== pairRank)
      .slice(0, 3);
    const bestFive = [
      ...groups[pairRank],
      groups[kickers[0].rank][0],
      groups[kickers[1].rank][0],
      groups[kickers[2].rank][0]
    ];
    return {
      rank: 2,
      name: 'Pair',
      bestFive,
      primaryCards: groups[pairRank], // Only the pair
      tiebreakers: [
        getRankValue(pairRank),
        getRankValue(kickers[0].rank),
        getRankValue(kickers[1].rank),
        getRankValue(kickers[2].rank)
      ],
      description: `Pair of ${pairRank}`
    };
  }

  // High Card
  const bestFive = sortedCards.slice(0, 5);
  const tiebreakers = bestFive.map(c => getRankValue(c.rank));
  return {
    rank: 1,
    name: 'High Card',
    bestFive,
    primaryCards: [bestFive[0]], // Only the high card
    tiebreakers,
    description: `High Card, ${bestFive[0].rank}`
  };
}

/**
 * Compares two hands
 * @param {HandResult} hand1 - First hand
 * @param {HandResult} hand2 - Second hand
 * @returns {number} Positive if hand1 wins, negative if hand2 wins, 0 if tie
 */
function compareHands(hand1, hand2) {
  // Compare hand ranks first
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }

  // Same rank, compare tiebreakers
  for (let i = 0; i < Math.max(hand1.tiebreakers.length, hand2.tiebreakers.length); i++) {
    const val1 = hand1.tiebreakers[i] || 0;
    const val2 = hand2.tiebreakers[i] || 0;
    if (val1 !== val2) {
      return val1 - val2;
    }
  }

  // Identical hands
  return 0;
}

export {
  evaluateHand,
  compareHands
};
