import { describe, it, expect } from 'vitest';
import { formatTime } from '../src/ui/PlayerUI.js';

describe('PlayerUI time formatting', () => {
  it('formats seconds as MM:SS accurately across timeline bounds', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(5.8)).toBe('00:05');
    expect(formatTime(17.9)).toBe('00:17');
    expect(formatTime(32.0)).toBe('00:32');
    expect(formatTime(-3)).toBe('00:00');
  });
});
