import { describe, expect, it } from 'vitest';
import { addScaled, cross, dot, normalize } from './vec';

describe('vec', () => {
  it('crosses x and y into z', () => {
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  });

  it('normalizes, and leaves the zero vector alone', () => {
    expect(normalize([3, 0, 4])).toEqual([0.6, 0, 0.8]);
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('dots and moves along a vector', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    expect(addScaled([1, 1, 1], [1, 0, -1], 2)).toEqual([3, 1, -1]);
  });
});
