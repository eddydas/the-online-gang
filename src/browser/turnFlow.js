// @ts-check

/**
 * @typedef {import('./gameState').GamePhase} GamePhase
 */

/**
 * Returns phase-specific instructional text for the UI
 * @param {GamePhase} phase - Current game phase
 * @returns {string} Instructional text for the player
 */
function getPhaseText(phase) {
  switch (phase) {
    case 'LOBBY':
      return 'Waiting for players...';
    case 'READY_UP':
      return 'Press Ready when you\'re ready to start taking tokens';
    case 'TOKEN_TRADING':
      return 'Select or steal a token';
    case 'TURN_COMPLETE':
      return 'Press Play to continue to the next turn';
    case 'END_GAME':
      return 'Game Over';
    default:
      return '';
  }
}

/**
 * Determines if ready button should be visible
 * @param {GamePhase} phase - Current game phase
 * @returns {boolean} True if ready button should show
 */
function shouldShowReadyButton(phase) {
  return phase === 'READY_UP';
}

/**
 * Determines if proceed button should be visible
 * @param {GamePhase} phase - Current game phase
 * @param {import('./tokens.js').Token[]} [tokens] - Token array (optional, required for TOKEN_TRADING phase)
 * @returns {boolean} True if proceed button should show
 */
function shouldShowProceedButton(phase, tokens) {
  if (phase === 'TURN_COMPLETE') {
    return true;
  }

  if (phase === 'TOKEN_TRADING') {
    // Only show proceed button if all tokens are owned
    if (!tokens) return false;
    return tokens.every(t => t.ownerId !== null);
  }

  return false;
}

/**
 * Updates the phase UI based on current game phase
 * @param {GamePhase} phase - Current game phase
 * @param {import('./tokens.js').Token[]} [tokens] - Token array (optional, needed for TOKEN_TRADING phase)
 */
function updatePhaseUI(phase, tokens) {
  const phaseTextEl = document.getElementById('phase-text');
  const readyButtonEl = document.getElementById('ready-button');
  const proceedButtonEl = document.getElementById('proceed-button');

  if (phaseTextEl) {
    phaseTextEl.textContent = getPhaseText(phase);
  }

  if (readyButtonEl) {
    readyButtonEl.style.display = shouldShowReadyButton(phase) ? 'block' : 'none';
  }

  if (proceedButtonEl) {
    // Use 'hidden' class instead of display to prevent reflow
    const shouldShow = shouldShowProceedButton(phase, tokens);
    if (shouldShow) {
      proceedButtonEl.classList.remove('hidden');
    } else {
      proceedButtonEl.classList.add('hidden');
    }

    // Toggle "waiting" class based on token ownership
    if (phase === 'TOKEN_TRADING') {
      // Show spinner if not all tokens are owned
      const allTokensOwned = tokens && tokens.every(t => t.ownerId !== null);
      if (allTokensOwned) {
        proceedButtonEl.classList.remove('waiting');
      } else {
        proceedButtonEl.classList.add('waiting');
      }
    } else if (phase === 'TURN_COMPLETE') {
      // Always show play icon (not waiting) during TURN_COMPLETE
      proceedButtonEl.classList.remove('waiting');
    }
  }
}

export {
  getPhaseText,
  shouldShowReadyButton,
  shouldShowProceedButton,
  updatePhaseUI
};
