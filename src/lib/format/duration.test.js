import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';

describe('formatDuration', () => {
  it.each([
    [0, '0:00,00'],
    [1234, '0:01,23'],
    [65320, '1:05,32'],
    [599999, '9:59,99'],
    [-50, '0:00,00'],
  ])('%d ms → %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});
