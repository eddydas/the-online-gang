// @ts-check

/**
 * Renders a card as a text string
 * @param {import('./browser/deck.js').Card} card - Card to render
 * @returns {string} Card representation (e.g., "A♠")
 */
function renderCard(card) {
  return `${card.rank}${card.suit}`;
}

/**
 * @typedef {Object} EndGameData
 * @property {boolean} isWin - Whether team won
 * @property {Array} sortedPlayers - Players sorted by hand strength
 * @property {Object.<string, (number|null)[]>} tokenHistory - Map of playerId to token array (4 turns)
 * @property {Array} communityCards - 5 community cards
 * @property {Object.<string, boolean>} correctness - Map of playerId to whether their turn 4 token was correct
 */

/**
 * Renders the end-game summary table
 * @param {EndGameData} data - Game result data
 * @returns {void}
 */
export function renderEndGameTable(data) {
  const container = document.getElementById('end-game-screen');
  if (!container) {
    throw new Error('End-game screen container not found');
  }

  // Clear existing content
  container.innerHTML = '';

  // WIN/LOSS banner
  const banner = document.createElement('h1');
  banner.className = 'result-banner';
  banner.textContent = data.isWin ? 'WIN!' : 'LOSS';
  banner.style.color = data.isWin ? 'green' : 'red';
  banner.style.textAlign = 'center';
  banner.style.fontSize = '3em';
  container.appendChild(banner);

  // Create table
  const table = document.createElement('table');
  table.className = 'summary-table';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.margin = '20px 0';

  // Table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['Player', 'Turn 1', 'Turn 2', 'Turn 3', 'Turn 4', 'Cards', 'Hand'];
  headers.forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.border = '1px solid #ddd';
    th.style.padding = '12px';
    th.style.backgroundColor = '#333';
    th.style.color = 'white';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement('tbody');

  data.sortedPlayers.forEach(player => {
    const row = document.createElement('tr');

    // Player name
    const nameCell = document.createElement('td');
    nameCell.textContent = player.name;
    nameCell.style.border = '1px solid #ddd';
    nameCell.style.padding = '12px';
    row.appendChild(nameCell);

    // Token history for turns 1-4
    const history = data.tokenHistory[player.id] || [null, null, null, null];
    history.forEach((token, index) => {
      const tokenCell = document.createElement('td');
      tokenCell.textContent = token !== null ? token.toString() : '-';
      tokenCell.style.border = '1px solid #ddd';
      tokenCell.style.padding = '12px';

      // Highlight Turn 4 (index 3) with correct/incorrect color
      if (index === 3) {
        const isCorrect = data.correctness[player.id];
        tokenCell.style.backgroundColor = isCorrect ? 'lightgreen' : 'lightcoral';
        tokenCell.style.fontWeight = 'bold';
      }

      row.appendChild(tokenCell);
    });

    // All 7 cards (2 hole + 5 community)
    const cardsCell = document.createElement('td');
    if (player.holeCards) {
      const allCards = [...player.holeCards, ...data.communityCards];
      cardsCell.textContent = allCards.map(renderCard).join(' ');
    }
    cardsCell.style.border = '1px solid #ddd';
    cardsCell.style.padding = '12px';
    row.appendChild(cardsCell);

    // Hand description
    const handCell = document.createElement('td');
    handCell.textContent = player.hand.description;
    handCell.style.border = '1px solid #ddd';
    handCell.style.padding = '12px';
    row.appendChild(handCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // "Ready for Next Game" button
  const button = document.createElement('button');
  button.id = 'ready-next-game';
  button.textContent = 'Ready for Next Game';
  button.style.marginTop = '30px';
  button.style.padding = '15px 30px';
  button.style.fontSize = '1.2em';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  container.appendChild(button);

  // Show the container
  container.style.display = 'block';
}
