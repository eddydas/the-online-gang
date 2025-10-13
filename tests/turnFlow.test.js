// @ts-check
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { getPhaseText, updatePhaseUI, shouldShowReadyButton, shouldShowProceedButton } from '../src/browser/turnFlow.js';

/**
 * @typedef {import('../src/browser/gameState').GamePhase} GamePhase
 */

describe('Turn Flow UI', () => {

  describe('Phase Text Generation', () => {
    test('should return correct text for LOBBY phase', () => {
      expect(getPhaseText('LOBBY')).toBe('Waiting for players...');
    });

    test('should return correct text for READY_UP phase', () => {
      expect(getPhaseText('READY_UP')).toBe('Press Ready when you\'re ready to start taking tokens');
    });

    test('should return correct text for TOKEN_TRADING phase', () => {
      expect(getPhaseText('TOKEN_TRADING')).toBe('Select or steal a token');
    });

    test('should return correct text for TURN_COMPLETE phase', () => {
      expect(getPhaseText('TURN_COMPLETE')).toBe('Press Play to continue to the next turn');
    });

    test('should return correct text for END_GAME phase', () => {
      expect(getPhaseText('END_GAME')).toBe('Game Over');
    });
  });

  describe('Button Visibility Logic', () => {
    test('should show ready button only in READY_UP phase', () => {
      expect(shouldShowReadyButton('LOBBY')).toBe(false);
      expect(shouldShowReadyButton('READY_UP')).toBe(true);
      expect(shouldShowReadyButton('TOKEN_TRADING')).toBe(false);
      expect(shouldShowReadyButton('TURN_COMPLETE')).toBe(false);
      expect(shouldShowReadyButton('END_GAME')).toBe(false);
    });

    test('should show proceed button in TOKEN_TRADING and TURN_COMPLETE phases', () => {
      expect(shouldShowProceedButton('LOBBY')).toBe(false);
      expect(shouldShowProceedButton('READY_UP')).toBe(false);
      expect(shouldShowProceedButton('TURN_COMPLETE')).toBe(true);
      expect(shouldShowProceedButton('END_GAME')).toBe(false);
    });

    test('should show proceed button in TOKEN_TRADING only when all tokens owned', () => {
      const allOwned = [
        { number: 1, ownerId: 'player1', timestamp: 100 },
        { number: 2, ownerId: 'player2', timestamp: 200 }
      ];
      const someUnowned = [
        { number: 1, ownerId: 'player1', timestamp: 100 },
        { number: 2, ownerId: null, timestamp: 0 }
      ];
      const allUnowned = [
        { number: 1, ownerId: null, timestamp: 0 },
        { number: 2, ownerId: null, timestamp: 0 }
      ];

      // Should show when all tokens are owned
      expect(shouldShowProceedButton('TOKEN_TRADING', allOwned)).toBe(true);

      // Should hide when some tokens are unowned
      expect(shouldShowProceedButton('TOKEN_TRADING', someUnowned)).toBe(false);

      // Should hide when all tokens are unowned
      expect(shouldShowProceedButton('TOKEN_TRADING', allUnowned)).toBe(false);

      // Should hide when tokens array is missing
      expect(shouldShowProceedButton('TOKEN_TRADING')).toBe(false);
    });
  });

  describe('Phase UI Updates', () => {
    /** @type {{ textContent: string }} */
    let mockPhaseText;
    /** @type {{ style: { display: string } }} */
    let mockReadyButton;
    /** @type {{ classList: { add: Function, remove: Function, contains: Function } }} */
    let mockProceedButton;

    beforeEach(() => {
      // Create mock DOM elements
      mockPhaseText = { textContent: '' };
      mockReadyButton = { style: { display: '' } };
      mockProceedButton = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false)
        }
      };

      // Mock document.getElementById
      vi.stubGlobal('document', {
        getElementById: vi.fn((id) => {
          if (id === 'phase-text') return mockPhaseText;
          if (id === 'ready-button') return mockReadyButton;
          if (id === 'proceed-button') return mockProceedButton;
          return null;
        })
      });
    });

    test('should update phase text for READY_UP', () => {
      updatePhaseUI('READY_UP');
      expect(mockPhaseText.textContent).toBe('Press Ready when you\'re ready to start taking tokens');
    });

    test('should show ready button in READY_UP phase', () => {
      updatePhaseUI('READY_UP');
      expect(mockReadyButton.style.display).toBe('block');
      expect(mockProceedButton.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('should show proceed button in TOKEN_TRADING phase', () => {
      const allOwned = [
        { number: 1, ownerId: 'player1', timestamp: 100 },
        { number: 2, ownerId: 'player2', timestamp: 200 }
      ];

      updatePhaseUI('TOKEN_TRADING', allOwned);
      expect(mockReadyButton.style.display).toBe('none');
      expect(mockProceedButton.classList.remove).toHaveBeenCalledWith('hidden');
      expect(mockProceedButton.classList.remove).toHaveBeenCalledWith('waiting');
    });

    test('should hide proceed button in TOKEN_TRADING when tokens not all owned', () => {
      const someUnowned = [
        { number: 1, ownerId: 'player1', timestamp: 100 },
        { number: 2, ownerId: null, timestamp: 0 }
      ];

      updatePhaseUI('TOKEN_TRADING', someUnowned);
      expect(mockReadyButton.style.display).toBe('none');
      expect(mockProceedButton.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('should show proceed button in TURN_COMPLETE phase', () => {
      updatePhaseUI('TURN_COMPLETE');
      expect(mockReadyButton.style.display).toBe('none');
      expect(mockProceedButton.classList.remove).toHaveBeenCalledWith('hidden');
      expect(mockProceedButton.classList.remove).toHaveBeenCalledWith('waiting');
    });

    test('should hide all buttons in END_GAME phase', () => {
      updatePhaseUI('END_GAME');
      expect(mockReadyButton.style.display).toBe('none');
      expect(mockProceedButton.classList.add).toHaveBeenCalledWith('hidden');
    });
  });

});
