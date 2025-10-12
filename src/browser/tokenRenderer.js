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
    3: [[50, 35], [40, 60], [60, 60]],
    4: [[35, 35], [65, 35], [35, 65], [65, 65]],
    5: [[50, 30], [30, 50], [70, 50], [38, 68], [62, 68]],
    6: [[30, 35], [50, 35], [70, 35], [30, 65], [50, 65], [70, 65]],
    7: [[50, 25], [30, 42], [70, 42], [25, 58], [75, 58], [38, 75], [62, 75]],
    8: [[30, 30], [50, 30], [70, 30], [30, 50], [70, 50], [30, 70], [50, 70], [70, 70]]
  };

  const positions = patterns[/** @type {1|2|3|4|5|6|7|8} */ (number)] || patterns[1];

  return positions.map(([cx, cy]) => {
    const size = 6;
    // 5-pointed star with better proportions
    return `
      <path d="M ${cx},${cy - size}
               L ${cx + size * 0.35},${cy - size * 0.35}
               L ${cx + size},${cy - size * 0.3}
               L ${cx + size * 0.5},${cy + size * 0.35}
               L ${cx + size * 0.65},${cy + size}
               L ${cx},${cy + size * 0.5}
               L ${cx - size * 0.65},${cy + size}
               L ${cx - size * 0.5},${cy + size * 0.35}
               L ${cx - size},${cy - size * 0.3}
               L ${cx - size * 0.35},${cy - size * 0.35} Z"
            fill="#f39c12" stroke="#d68910" stroke-width="0.3" />
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
      <!-- 3D shadow layer -->
      <ellipse cx="50" cy="52" rx="48" ry="46" fill="rgba(0,0,0,0.3)" />

      <!-- Outer circle (border) with gradient -->
      <defs>
        <radialGradient id="border-grad-${token.number}-${turn}">
          <stop offset="0%" stop-color="#1a1a1a" />
          <stop offset="100%" stop-color="#0a0a0a" />
        </radialGradient>
        <radialGradient id="chip-grad-${token.number}-${turn}">
          <stop offset="0%" stop-color="#3a4a5a" />
          <stop offset="100%" stop-color="#2c3e50" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="49" fill="url(#border-grad-${token.number}-${turn})" />

      <!-- Colored stripe ring -->
      <circle cx="50" cy="50" r="47" fill="#34495e" />
      ${stripes}

      <!-- Inner circle (chip face) with gradient -->
      <circle cx="50" cy="50" r="37" fill="url(#chip-grad-${token.number}-${turn})" />

      <!-- Stars showing number -->
      ${stars}

      <!-- Token number text (smaller, bottom) -->
      <text x="50" y="94" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="10" font-weight="bold">
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
      width: 80px;
      height: 80px;
      display: inline-block;
      margin: 5px;
      transition: transform 0.2s ease, filter 0.2s ease;
    }

    .token.interactive {
      cursor: pointer;
    }

    .token.interactive:hover {
      transform: scale(1.1);
      filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5)) brightness(1.1);
    }

    .token.interactive:active {
      transform: scale(1.05);
    }

    .token-svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
    }

    .token-pool {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      padding: 20px;
      gap: 12px;
    }

    .token.selected {
      transform: scale(1.15);
      filter: drop-shadow(0 0 16px rgba(243, 156, 18, 0.8));
    }

    .token.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(50%);
    }

    .token.disabled:hover {
      transform: none;
      filter: grayscale(50%);
    }

    /* Mini tokens for player history */
    .token.mini {
      width: 40px;
      height: 40px;
      margin: 2px;
    }

    .token.mini .token-svg {
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
    }

    .player-tokens {
      display: flex;
      gap: 8px;
      margin: 10px 0;
      align-items: center;
    }

    .player-token-slot {
      width: 40px;
      height: 40px;
      border: 2px dashed #555;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 10px;
      text-align: center;
      position: relative;
    }

    .player-token-slot.filled {
      border: none;
    }

    .token-placeholder {
      width: 40px;
      height: 40px;
      border: 2px dashed rgba(149, 165, 166, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #7f8c8d;
      text-align: center;
      padding: 4px;
    }

    /* Responsive sizing */
    @media (max-width: 768px) {
      .token {
        width: 60px;
        height: 60px;
        margin: 3px;
      }

      .token.mini {
        width: 35px;
        height: 35px;
      }

      .token-pool {
        gap: 8px;
        padding: 12px;
      }
    }
  `;

  document.head.appendChild(style);
}
