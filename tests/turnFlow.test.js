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
      expect(getPhaseText('READY_UP')).toBe('Press Ready when you\'re ready to see your cards');
    });

    test('should return correct text for TOKEN_TRADING phase', () => {
      expect(getPhaseText('TOKEN_TRADING')).toBe('Select or steal a token');
    });

    test('should return correct text for TURN_COMPLETE phase', () => {
      expect(getPhaseText('TURN_COMPLETE')).toBe('Press Proceed to continue to the next turn');
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

    test('should show proceed button only in TURN_COMPLETE phase', () => {
      expect(shouldShowProceedButton('LOBBY')).toBe(false);
      expect(shouldShowProceedButton('READY_UP')).toBe(false);
      expect(shouldShowProceedButton('TOKEN_TRADING')).toBe(false);
      expect(shouldShowProceedButton('TURN_COMPLETE')).toBe(true);
      expect(shouldShowProceedButton('END_GAME')).toBe(false);
    });
  });

  describe('Phase UI Updates', () => {
    let mockPhaseText;
    let mockReadyButton;
    let mockProceedButton;

    beforeEach(() => {
      // Create mock DOM elements
      mockPhaseText = { textContent: '' };
      mockReadyButton = { style: { display: '' } };
      mockProceedButton = { style: { display: '' } };

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
      expect(mockPhaseText.textContent).toBe('Press Ready when you\'re ready to see your cards');
    });

    test('should show ready button in READY_UP phase', () => {
      updatePhaseUI('READY_UP');
      expect(mockReadyButton.style.display).toBe('block');
      expect(mockProceedButton.style.display).toBe('none');
    });

    test('should hide ready button in TOKEN_TRADING phase', () => {
      updatePhaseUI('TOKEN_TRADING');
      expect(mockReadyButton.style.display).toBe('none');
      expect(mockProceedButton.style.display).toBe('none');
    });

    test('should show proceed button in TURN_COMPLETE phase', () => {
      updatePhaseUI('TURN_COMPLETE');
      expect(mockReadyButton.style.display).toBe('none');
      expect(mockProceedButton.style.display).toBe('block');
    });

    test('should hide all buttons in END_GAME phase', () => {
      updatePhaseUI('END_GAME');
      expect(mockReadyButton.style.display).toBe('none');
      expect(mockProceedButton.style.display).toBe('none');
    });
  });

});
