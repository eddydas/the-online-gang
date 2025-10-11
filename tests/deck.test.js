const { createDeck, shuffleDeck, randomizeCardBackColor, RANKS, SUITS } = require('../src/deck');

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

});
