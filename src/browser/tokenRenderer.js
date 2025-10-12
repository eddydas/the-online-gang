// @ts-check

/**
 * Token rendering module - creates poker chip style tokens with stars and colored stripes
 */

/**
 * @typedef {import('./tokens.js').Token} Token
 */

/**
 * Get turn color and stripe count based on turn number
 * @param {number} turn - Turn number (1-4)
 * @returns {{color: string, stripes: number}}
 */
function getTurnStyle(turn) {
  const styles = {
    1: { color: '#ecf0f1', stripes: 1 }, // White
    2: { color: '#f1c40f', stripes: 2 }, // Yellow
    3: { color: '#e67e22', stripes: 3 }, // Orange
    4: { color: '#e74c3c', stripes: 4 }  // Red
  };
  return styles[/** @type {1|2|3|4} */ (turn)] || styles[1];
}

/**
 * Generate star pattern based on number
 * @param {number} number - Token number (1-8)
 * @returns {string} - SVG path for stars
 */
function generateStarPattern(number) {
  // Star positions for different numbers (relative to 50,50 center)
  const patterns = {
    1: [[50, 50]],
    2: [[35, 50], [65, 50]],
    3: [[35, 40], [65, 40], [50, 60]],
    4: [[35, 35], [65, 35], [35, 65], [65, 65]],
    5: [[50, 30], [30, 50], [70, 50], [38, 68], [62, 68]],
    6: [[30, 35], [50, 35], [70, 35], [30, 65], [50, 65], [70, 65]],
    7: [[50, 25], [30, 40], [70, 40], [25, 60], [75, 60], [35, 75], [65, 75]],
    8: [[30, 30], [50, 30], [70, 30], [30, 50], [70, 50], [30, 70], [50, 70], [70, 70]]
  };

  const positions = patterns[/** @type {1|2|3|4|5|6|7|8} */ (number)] || patterns[1];

  return positions.map(([cx, cy]) => {
    const size = 5;
    // 5-pointed star
    return `
      <path d="M ${cx},${cy - size}
               L ${cx + size * 0.3},${cy - size * 0.3}
               L ${cx + size},${cy - size * 0.3}
               L ${cx + size * 0.5},${cy + size * 0.3}
               L ${cx + size * 0.7},${cy + size}
               L ${cx},${cy + size * 0.5}
               L ${cx - size * 0.7},${cy + size}
               L ${cx - size * 0.5},${cy + size * 0.3}
               L ${cx - size},${cy - size * 0.3}
               L ${cx - size * 0.3},${cy - size * 0.3} Z"
            fill="#fff" />
    `;
  }).join('');
}

/**
 * Generate stripe pattern for outer ring
 * @param {number} stripes - Number of stripes (1-4)
 * @param {string} color - Stripe color
 * @returns {string} - SVG path for stripes
 */
function generateStripePattern(stripes, color) {
  const segments = [];
  const anglePerStripe = 360 / (stripes * 2); // Alternating stripes and gaps

  for (let i = 0; i < stripes; i++) {
    const startAngle = i * anglePerStripe * 2;
    const endAngle = startAngle + anglePerStripe;

    // Convert to radians
    const start = (startAngle - 90) * Math.PI / 180;
    const end = (endAngle - 90) * Math.PI / 180;

    // Inner and outer radius for ring
    const outerR = 48;
    const innerR = 38;

    const x1 = 50 + outerR * Math.cos(start);
    const y1 = 50 + outerR * Math.sin(start);
    const x2 = 50 + outerR * Math.cos(end);
    const y2 = 50 + outerR * Math.sin(end);
    const x3 = 50 + innerR * Math.cos(end);
    const y3 = 50 + innerR * Math.sin(end);
    const x4 = 50 + innerR * Math.cos(start);
    const y4 = 50 + innerR * Math.sin(start);

    segments.push(`
      <path d="M ${x1},${y1}
               A ${outerR},${outerR} 0 0,1 ${x2},${y2}
               L ${x3},${y3}
               A ${innerR},${innerR} 0 0,0 ${x4},${y4} Z"
            fill="${color}" />
    `);
  }

  return segments.join('');
}

/**
 * Create a token element (poker chip design)
 * @param {Token} token - The token to render
 * @param {number} turn - Current turn number (1-4)
 * @param {boolean} interactive - Whether token is clickable
 * @returns {HTMLElement} - Token DOM element
 */
export function createTokenElement(token, turn = 1, interactive = false) {
  const tokenEl = document.createElement('div');
  tokenEl.className = 'token' + (interactive ? ' interactive' : '');
  tokenEl.dataset.tokenNumber = String(token.number);

  const turnStyle = getTurnStyle(turn);
  const stars = generateStarPattern(token.number);
  const stripes = generateStripePattern(turnStyle.stripes, turnStyle.color);

  tokenEl.innerHTML = `
    <svg viewBox="0 0 100 100" class="token-svg">
      <!-- Outer circle (border) -->
      <circle cx="50" cy="50" r="49" fill="#2c3e50" />

      <!-- Colored stripe ring -->
      <circle cx="50" cy="50" r="48" fill="#34495e" />
      ${stripes}

      <!-- Inner circle (chip face) -->
      <circle cx="50" cy="50" r="37" fill="#2c3e50" />

      <!-- Stars showing number -->
      ${stars}

      <!-- Token number text -->
      <text x="50" y="95" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">
        ${token.number}
      </text>
    </svg>
  `;

  return tokenEl;
}

/**
 * Render tokens in a container
 * @param {HTMLElement} container - Container element
 * @param {Token[]} tokens - Array of tokens
 * @param {number} turn - Current turn number
 * @param {boolean} interactive - Whether tokens are clickable
 * @param {Function} [onTokenClick] - Click handler
 */
export function renderTokens(container, tokens, turn, interactive, onTokenClick) {
  container.innerHTML = '';
  container.className = 'token-pool';

  tokens.forEach(token => {
    const tokenEl = createTokenElement(token, turn, interactive);

    if (interactive && onTokenClick) {
      tokenEl.addEventListener('click', () => {
        onTokenClick(token.number);
      });
    }

    container.appendChild(tokenEl);
  });
}

/**
 * Add token styles to document
 */
export function addTokenStyles() {
  if (document.getElementById('token-styles')) return;

  const style = document.createElement('style');
  style.id = 'token-styles';
  style.textContent = `
    .token {
      width: 60px;
      height: 60px;
      display: inline-block;
      margin: 5px;
      transition: transform 0.3s, filter 0.3s;
    }

    .token.interactive {
      cursor: pointer;
    }

    .token.interactive:hover {
      transform: scale(1.1) translateY(-5px);
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    }

    .token-svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .token-pool {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      padding: 20px;
      gap: 10px;
    }

    .token.selected {
      transform: scale(1.15);
      filter: drop-shadow(0 0 10px rgba(52, 152, 219, 0.8));
    }

    .player-tokens {
      display: flex;
      gap: 8px;
      margin: 10px 0;
    }

    .player-token-slot {
      width: 50px;
      height: 50px;
      border: 2px dashed #555;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 12px;
    }

    .player-token-slot.filled {
      border: none;
    }
  `;

  document.head.appendChild(style);
}
