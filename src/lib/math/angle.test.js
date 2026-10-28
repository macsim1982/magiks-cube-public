import { describe, expect, it } from 'vitest';
import { snapAngle } from './angle';

const QUARTER = Math.PI / 2;

describe('snapAngle', () => {
  it.each([
    [0.3, 0.25, 0.25],
    [0.25 + QUARTER * 0.6, 0.25, 0.25 + QUARTER],
    [0.25 - QUARTER * 1.4, 0.25, 0.25 - QUARTER],
  ])('%f from %f → %f', (angle, origin, snapped) => {
    expect(snapAngle(angle, origin, QUARTER)).toBeCloseTo(snapped);
  });
});
