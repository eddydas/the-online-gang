// @ts-check

// Main entry point for the browser app
import { evaluateHand } from './browser/poker.js';
import { determineWinLoss } from './browser/winCondition.js';
import { renderEndGameTable } from './browser/endGame.js';

// Demo: Show end-game table with sample data
document.addEventListener('DOMContentLoaded', () => {
  // Example community cards (Royal Flush possible!)
  const communityCards = [
    { rank: 'A', suit: '♠' },
    { rank: 'K', suit: '♠' },
    { rank: 'Q', suit: '♠' },
    { rank: 'J', suit: '♠' },
    { rank: '10', suit: '♠' }
  ];

  // Example players with different hands
  const players = [
    {
      id: 'p1',
      name: 'Alice',
      holeCards: [
        { rank: '9', suit: '♠' },
        { rank: '8', suit: '♠' }
      ],
      hand: evaluateHand([
        { rank: '9', suit: '♠' },
        { rank: '8', suit: '♠' },
        ...communityCards
      ]),
      currentToken: 3 // Turn 4 token
    },
    {
      id: 'p2',
      name: 'Bob',
      holeCards: [
        { rank: '2', suit: '♥' },
        { rank: '3', suit: '♦' }
      ],
      hand: evaluateHand([
        { rank: '2', suit: '♥' },
        { rank: '3', suit: '♦' },
        ...communityCards
      ]),
      currentToken: 1 // Turn 4 token
    },
    {
      id: 'p3',
      name: 'Charlie',
      holeCards: [
        { rank: '7', suit: '♠' },
        { rank: '6', suit: '♠' }
      ],
      hand: evaluateHand([
        { rank: '7', suit: '♠' },
        { rank: '6', suit: '♠' },
        ...communityCards
      ]),
      currentToken: 2 // Turn 4 token
    }
  ];

  // Determine win/loss
  const result = determineWinLoss(players);

  // Example token history (4 turns)
  const tokenHistory = {
    'p1': [1, 2, 3, 3], // Alice
    'p2': [3, 3, 1, 1], // Bob
    'p3': [2, 1, 2, 2]  // Charlie
  };

  // Prepare end-game data
  const endGameData = {
    isWin: result.isWin,
    sortedPlayers: result.sortedPlayers,
    tokenHistory: tokenHistory,
    communityCards: communityCards,
    correctness: result.correctness
  };

  // Render the table
  renderEndGameTable(endGameData);

  // Add event listener for "Ready for Next Game" button
  const button = document.getElementById('ready-next-game');
  if (button) {
    button.addEventListener('click', () => {
      alert('Ready for next game! (In the real game, this would reset and start a new game)');
    });
  }

  console.log('End-game data:', endGameData);
  console.log('Game result:', result.isWin ? 'WIN' : 'LOSS');
});
