// @ts-check
import { describe, test, expect } from 'vitest';
import { getInitials, getNextAvailableColor } from '../src/browser/avatarManager.js';

describe('Avatar Manager', () => {
  describe('getInitials', () => {
    test('should return first letter of each word for two-word names', () => {
      expect(getInitials('Peter Hill')).toBe('PH');
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice Smith')).toBe('AS');
    });

    test('should handle names with numbers as words', () => {
      expect(getInitials('Player 1')).toBe('P1');
      expect(getInitials('Player 2')).toBe('P2');
      expect(getInitials('Player 10')).toBe('P1');
      expect(getInitials('Test 123')).toBe('T1');
    });

    test('should return first two characters for single-word names', () => {
      expect(getInitials('Alice')).toBe('AL');
      expect(getInitials('Bob')).toBe('BO');
      expect(getInitials('X')).toBe('X');
    });

    test('should handle three or more word names (max 2 chars)', () => {
      expect(getInitials('John Doe Smith')).toBe('JD');
      expect(getInitials('Alice Bob Charlie')).toBe('AB');
    });

    test('should handle empty or invalid names', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials('   ')).toBe('?');
      // @ts-ignore - testing null case
      expect(getInitials(null)).toBe('?');
      // @ts-ignore - testing undefined case
      expect(getInitials(undefined)).toBe('?');
    });

    test('should handle names with special characters', () => {
      expect(getInitials('O\'Brien')).toBe('OB');
      expect(getInitials('Mary-Jane')).toBe('MA');
      expect(getInitials('José García')).toBe('JG');
    });

    test('should be case-insensitive', () => {
      expect(getInitials('peter hill')).toBe('PH');
      expect(getInitials('ALICE SMITH')).toBe('AS');
      expect(getInitials('bOb JoNeS')).toBe('BJ');
    });

    test('should handle names with extra spaces', () => {
      expect(getInitials('  Peter   Hill  ')).toBe('PH');
      expect(getInitials('Alice    Bob')).toBe('AB');
    });
  });

  describe('getNextAvailableColor', () => {
    test('should return first color when no colors are used', () => {
      const color = getNextAvailableColor([]);
      expect(color).toBe('#e74c3c'); // Red (first color)
    });

    test('should skip used colors', () => {
      const usedColors = ['#e74c3c', '#3498db']; // Red and Blue used
      const color = getNextAvailableColor(usedColors);
      expect(color).toBe('#2ecc71'); // Green (third color)
    });

    test('should return first color as fallback when all colors used', () => {
      const allColors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
        '#34495e', '#e67e22', '#95a5a6', '#16a085', '#27ae60', '#8e44ad'
      ];
      const color = getNextAvailableColor(allColors);
      expect(color).toBe('#e74c3c'); // First color as fallback
    });

    test('should find available color in middle of palette', () => {
      const usedColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']; // First 4 used
      const color = getNextAvailableColor(usedColors);
      expect(color).toBe('#9b59b6'); // Purple (5th color)
    });
  });
});
