// @ts-check
const { generateTokens, applyTokenAction, initializePlayerTokenHistory, updateTokenHistory } = require('../src/tokens');

describe('Token System', () => {

  describe('Token Generation', () => {
    test('should generate N tokens for N players', () => {
      const tokens = generateTokens(4);
      expect(tokens).toHaveLength(4);
    });

    test('should generate tokens numbered 1 to N', () => {
      const tokens = generateTokens(5);
      const numbers = tokens.map(t => t.number).sort();
      expect(numbers).toEqual([1, 2, 3, 4, 5]);
    });

    test('should generate tokens with no owner initially', () => {
      const tokens = generateTokens(3);
      tokens.forEach(token => {
        expect(token.ownerId).toBeNull();
      });
    });

    test('should generate tokens with initial timestamp 0', () => {
      const tokens = generateTokens(3);
      tokens.forEach(token => {
        expect(token.timestamp).toBe(0);
      });
    });

    test('should work with minimum 2 players', () => {
      const tokens = generateTokens(2);
      expect(tokens).toHaveLength(2);
      expect(tokens.map(t => t.number)).toEqual([1, 2]);
    });

    test('should work with maximum 8 players', () => {
      const tokens = generateTokens(8);
      expect(tokens).toHaveLength(8);
      expect(tokens.map(t => t.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('Token Selection', () => {
    test('should assign token to player on selection', () => {
      const tokens = generateTokens(3);
      const action = {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      };

      const updatedTokens = applyTokenAction(tokens, action);
      const token2 = updatedTokens.find(t => t.number === 2);

      expect(token2.ownerId).toBe('player1');
      expect(token2.timestamp).toBe(1000);
    });

    test('should allow different players to select different tokens', () => {
      let tokens = generateTokens(3);

      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 1,
        timestamp: 1000
      });

      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player2',
        tokenNumber: 3,
        timestamp: 1001
      });

      const token1 = tokens.find(t => t.number === 1);
      const token3 = tokens.find(t => t.number === 3);

      expect(token1.ownerId).toBe('player1');
      expect(token3.ownerId).toBe('player2');
    });

    test('should not modify original tokens array', () => {
      const tokens = generateTokens(3);
      const originalToken = tokens[0];

      applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 1,
        timestamp: 1000
      });

      expect(tokens[0].ownerId).toBeNull();
      expect(originalToken).toBe(tokens[0]);
    });
  });

  describe('Token Stealing', () => {
    test('should transfer token from one player to another', () => {
      let tokens = generateTokens(3);

      // Player1 selects token 2
      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      });

      // Player2 steals token 2
      tokens = applyTokenAction(tokens, {
        type: 'steal',
        playerId: 'player2',
        tokenNumber: 2,
        timestamp: 1500
      });

      const token2 = tokens.find(t => t.number === 2);
      expect(token2.ownerId).toBe('player2');
      expect(token2.timestamp).toBe(1500);
    });

    test('should allow stealing from unowned token (same as select)', () => {
      const tokens = generateTokens(3);

      const updatedTokens = applyTokenAction(tokens, {
        type: 'steal',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      });

      const token2 = updatedTokens.find(t => t.number === 2);
      expect(token2.ownerId).toBe('player1');
    });

    test('should handle multiple steals of same token', () => {
      let tokens = generateTokens(3);

      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      });

      tokens = applyTokenAction(tokens, {
        type: 'steal',
        playerId: 'player2',
        tokenNumber: 2,
        timestamp: 1500
      });

      tokens = applyTokenAction(tokens, {
        type: 'steal',
        playerId: 'player3',
        tokenNumber: 2,
        timestamp: 2000
      });

      const token2 = tokens.find(t => t.number === 2);
      expect(token2.ownerId).toBe('player3');
      expect(token2.timestamp).toBe(2000);
    });
  });

  describe('Conflict Resolution', () => {
    test('should keep earlier timestamp when conflict occurs', () => {
      let tokens = generateTokens(3);

      // Player1 selects at 1000
      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      });

      // Player2 tries to select same token at 999 (earlier)
      // This should override since earlier timestamp wins
      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player2',
        tokenNumber: 2,
        timestamp: 999
      });

      const token2 = tokens.find(t => t.number === 2);
      expect(token2.ownerId).toBe('player2');
      expect(token2.timestamp).toBe(999);
    });

    test('should reject later timestamp during conflict', () => {
      let tokens = generateTokens(3);

      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      });

      // Later timestamp should not override
      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player2',
        tokenNumber: 2,
        timestamp: 1001
      });

      const token2 = tokens.find(t => t.number === 2);
      expect(token2.ownerId).toBe('player1');
      expect(token2.timestamp).toBe(1000);
    });

    test('should allow explicit stealing regardless of timestamp', () => {
      let tokens = generateTokens(3);

      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      });

      // Explicit steal should work even with later timestamp
      tokens = applyTokenAction(tokens, {
        type: 'steal',
        playerId: 'player2',
        tokenNumber: 2,
        timestamp: 1500
      });

      const token2 = tokens.find(t => t.number === 2);
      expect(token2.ownerId).toBe('player2');
      expect(token2.timestamp).toBe(1500);
    });
  });

  describe('Token History', () => {
    test('should initialize empty history for player', () => {
      const history = initializePlayerTokenHistory();
      expect(history).toEqual([null, null, null, null]);
    });

    test('should update token history for specific turn', () => {
      let history = initializePlayerTokenHistory();

      history = updateTokenHistory(history, 1, 3);
      expect(history[0]).toBe(3);
      expect(history[1]).toBeNull();
      expect(history[2]).toBeNull();
      expect(history[3]).toBeNull();
    });

    test('should track tokens across all 4 turns', () => {
      let history = initializePlayerTokenHistory();

      history = updateTokenHistory(history, 1, 2);
      history = updateTokenHistory(history, 2, 3);
      history = updateTokenHistory(history, 3, 1);
      history = updateTokenHistory(history, 4, 2);

      expect(history).toEqual([2, 3, 1, 2]);
    });

    test('should allow changing token within same turn', () => {
      let history = initializePlayerTokenHistory();

      history = updateTokenHistory(history, 2, 5);
      history = updateTokenHistory(history, 2, 3);

      expect(history[1]).toBe(3);
    });

    test('should preserve history from previous turns', () => {
      let history = initializePlayerTokenHistory();

      history = updateTokenHistory(history, 1, 2);
      history = updateTokenHistory(history, 2, 4);
      history = updateTokenHistory(history, 3, 1);

      // Update turn 2 again
      history = updateTokenHistory(history, 2, 5);

      expect(history).toEqual([2, 5, 1, null]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle player selecting same token they already own', () => {
      let tokens = generateTokens(3);

      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1000
      });

      // Same player selects again (should update timestamp)
      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1500
      });

      const token2 = tokens.find(t => t.number === 2);
      expect(token2.ownerId).toBe('player1');
      expect(token2.timestamp).toBe(1500);
    });

    test('should handle player switching tokens', () => {
      let tokens = generateTokens(3);

      // Player1 selects token 1
      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 1,
        timestamp: 1000
      });

      // Player1 selects token 2 (abandoning token 1)
      tokens = applyTokenAction(tokens, {
        type: 'select',
        playerId: 'player1',
        tokenNumber: 2,
        timestamp: 1500
      });

      const token1 = tokens.find(t => t.number === 1);
      const token2 = tokens.find(t => t.number === 2);

      expect(token1.ownerId).toBeNull(); // Token 1 released
      expect(token2.ownerId).toBe('player1'); // Token 2 owned
    });
  });

});
