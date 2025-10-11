const { createDeck, shuffleDeck, randomizeCardBackColor, dealHoleCards, dealCommunityCards, RANKS, SUITS } = require('../src/deck');
const { MIN_PLAYERS, MAX_PLAYERS } = require('../src/constants');

describe('Deck Module', () => {

  describe('createDeck', () => {
    test('should create a deck with 52 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    test('should have 13 cards of each suit', () => {
      const deck = createDeck();
      SUITS.forEach(suit => {
        const suitCards = deck.filter(card => card.suit === suit);
        expect(suitCards).toHaveLength(13);
      });
    });

    test('should have 4 cards of each rank', () => {
      const deck = createDeck();
      RANKS.forEach(rank => {
        const rankCards = deck.filter(card => card.rank === rank);
        expect(rankCards).toHaveLength(4);
      });
    });

    test('should contain all unique cards', () => {
      const deck = createDeck();
      const uniqueCards = new Set(deck.map(card => `${card.rank}${card.suit}`));
      expect(uniqueCards.size).toBe(52);
    });

    test('should have correct card structure', () => {
      const deck = createDeck();
      deck.forEach(card => {
        expect(card).toHaveProperty('rank');
        expect(card).toHaveProperty('suit');
        expect(RANKS).toContain(card.rank);
        expect(SUITS).toContain(card.suit);
      });
    });
  });

  describe('shuffleDeck', () => {
    test('should return a deck with same length', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(52);
    });

    test('should not modify the original deck', () => {
      const deck = createDeck();
      const originalFirst = deck[0];
      shuffleDeck(deck);
      expect(deck[0]).toEqual(originalFirst);
    });

    test('should contain all the same cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);

      const originalCards = deck.map(card => `${card.rank}${card.suit}`).sort();
      const shuffledCards = shuffled.map(card => `${card.rank}${card.suit}`).sort();

      expect(shuffledCards).toEqual(originalCards);
    });

    test('should produce different order (probabilistic)', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);

      // Check if at least some cards are in different positions
      let differences = 0;
      for (let i = 0; i < deck.length; i++) {
        if (deck[i].rank !== shuffled[i].rank || deck[i].suit !== shuffled[i].suit) {
          differences++;
        }
      }

      // Statistically, we should have many differences (very unlikely to be same order)
      expect(differences).toBeGreaterThan(40);
    });

    test('should not have duplicates after shuffle', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const uniqueCards = new Set(shuffled.map(card => `${card.rank}${card.suit}`));
      expect(uniqueCards.size).toBe(52);
    });
  });

  describe('randomizeCardBackColor', () => {
    test('should return either blue or red', () => {
      const color = randomizeCardBackColor();
      expect(['blue', 'red']).toContain(color);
    });

    test('should return different colors over multiple calls (probabilistic)', () => {
      const colors = new Set();
      for (let i = 0; i < 20; i++) {
        colors.add(randomizeCardBackColor());
      }
      // With 20 calls, we should get both colors (99.999% probability)
      expect(colors.size).toBe(2);
    });
  });

  describe('dealHoleCards', () => {
    test('should deal 2 cards to each player', () => {
      const deck = shuffleDeck(createDeck());
      const playerCount = 4;
      const result = dealHoleCards(deck, playerCount);

      expect(result.holeCards).toHaveLength(playerCount);
      result.holeCards.forEach(hand => {
        expect(hand).toHaveLength(2);
      });
    });

    test('should deal unique cards to each player', () => {
      const deck = shuffleDeck(createDeck());
      const playerCount = 5;
      const result = dealHoleCards(deck, playerCount);

      const allCards = result.holeCards.flat();
      const uniqueCards = new Set(allCards.map(card => `${card.rank}${card.suit}`));
      expect(uniqueCards.size).toBe(playerCount * 2);
    });

    test('should return remaining deck without dealt cards', () => {
      const deck = shuffleDeck(createDeck());
      const playerCount = 3;
      const result = dealHoleCards(deck, playerCount);

      expect(result.remainingDeck).toHaveLength(52 - (playerCount * 2));
    });

    test('should not modify original deck', () => {
      const deck = shuffleDeck(createDeck());
      const originalLength = deck.length;
      dealHoleCards(deck, 4);

      expect(deck).toHaveLength(originalLength);
    });

    test('should work with 2 players (minimum)', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealHoleCards(deck, MIN_PLAYERS);

      expect(result.holeCards).toHaveLength(MIN_PLAYERS);
      expect(result.remainingDeck).toHaveLength(48);
    });

    test('should work with 8 players (maximum)', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealHoleCards(deck, MAX_PLAYERS);

      expect(result.holeCards).toHaveLength(MAX_PLAYERS);
      expect(result.remainingDeck).toHaveLength(36);
    });
  });

  describe('dealCommunityCards', () => {
    test('should deal 0 cards for turn 1 (hole cards only)', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCommunityCards(deck, 1);

      expect(result.communityCards).toHaveLength(0);
    });

    test('should deal 3 cards for turn 2 (flop)', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCommunityCards(deck, 2);

      expect(result.communityCards).toHaveLength(3);
    });

    test('should deal 1 card for turn 3 (turn)', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCommunityCards(deck, 3);

      expect(result.communityCards).toHaveLength(1);
    });

    test('should deal 1 card for turn 4 (river)', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCommunityCards(deck, 4);

      expect(result.communityCards).toHaveLength(1);
    });

    test('should return remaining deck without dealt cards', () => {
      const deck = shuffleDeck(createDeck());
      const originalLength = deck.length;
      const result = dealCommunityCards(deck, 2); // Turn 2 deals 3 cards

      expect(result.remainingDeck).toHaveLength(originalLength - 3);
    });

    test('should not modify original deck', () => {
      const deck = shuffleDeck(createDeck());
      const originalLength = deck.length;
      dealCommunityCards(deck, 2);

      expect(deck).toHaveLength(originalLength);
    });

    test('should deal unique cards', () => {
      const deck = shuffleDeck(createDeck());
      const result = dealCommunityCards(deck, 2); // Turn 2 deals 3 cards

      const uniqueCards = new Set(result.communityCards.map(card => `${card.rank}${card.suit}`));
      expect(uniqueCards.size).toBe(3);
    });
  });

  describe('Input Validation', () => {
    test('dealHoleCards should throw for invalid player count', () => {
      const deck = shuffleDeck(createDeck());
      expect(() => dealHoleCards(deck, 0)).toThrow();
      expect(() => dealHoleCards(deck, MIN_PLAYERS - 1)).toThrow();
      expect(() => dealHoleCards(deck, MAX_PLAYERS + 1)).toThrow();
    });

    test('dealHoleCards should throw for insufficient cards', () => {
      const smallDeck = shuffleDeck(createDeck()).slice(0, 3); // Only 3 cards
      expect(() => dealHoleCards(smallDeck, 2)).toThrow('Not enough cards');
    });

    test('dealCommunityCards should throw for invalid turn', () => {
      const deck = shuffleDeck(createDeck());
      expect(() => dealCommunityCards(deck, 0)).toThrow();
      expect(() => dealCommunityCards(deck, 5)).toThrow();
    });

    test('dealCommunityCards should throw for insufficient cards', () => {
      const smallDeck = shuffleDeck(createDeck()).slice(0, 2); // Only 2 cards
      expect(() => dealCommunityCards(smallDeck, 2)).toThrow('Not enough cards'); // Turn 2 needs 3 cards
    });
  });

});
