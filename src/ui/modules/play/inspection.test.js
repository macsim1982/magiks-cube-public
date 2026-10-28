import { describe, expect, it } from 'vitest';
import { crossedLevels, inspectionLevel, secondsLeft } from './inspection';

describe('inspection', () => {
  it.each([
    [0, 'calm', 15],
    [7999, 'calm', 8],
    [8000, 'warn', 7],
    [11999, 'warn', 4],
    [12000, 'critical', 3],
    [14999, 'critical', 1],
    [16000, 'critical', 1],
  ])('%d ms : %s, %d s', (elapsed, level, seconds) => {
    expect(inspectionLevel(elapsed)).toBe(level);
    expect(secondsLeft(elapsed)).toBe(seconds);
  });

  it('beeps every level crossed, in order, and none going back', () => {
    expect(crossedLevels('calm', 'warn')).toEqual(['warn']);
    expect(crossedLevels('calm', 'critical')).toEqual(['warn', 'critical']);
    expect(crossedLevels('warn', 'warn')).toEqual([]);
    expect(crossedLevels('critical', 'calm')).toEqual([]);
  });
});
