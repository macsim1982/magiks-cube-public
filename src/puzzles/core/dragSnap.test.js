import { describe, expect, it } from 'vitest';
import { dragSteps, snapDrag } from './dragSnap';

const QUARTER = Math.PI / 2;
const cube = { unit: QUARTER, commit: QUARTER * 0.28, steps: 2 };

describe('dragSteps', () => {
  it('allows a half turn on a cube, not on a Skewb', () => {
    expect(dragSteps(QUARTER)).toBe(2);
    expect(dragSteps((2 * Math.PI) / 3)).toBe(1);
  });
});

describe('snapDrag', () => {
  it('goes back under the commit threshold', () => {
    expect(snapDrag(QUARTER * 0.2, cube)).toBe(0);
    expect(snapDrag(-QUARTER * 0.2, cube)).toBe(0);
  });

  it('plays at least a quarter once past the threshold', () => {
    expect(snapDrag(QUARTER * 0.3, cube)).toBe(QUARTER);
    expect(snapDrag(-QUARTER * 1.4, cube)).toBe(-QUARTER);
  });

  it('plays a half turn past one and a half quarters', () => {
    expect(snapDrag(QUARTER * 1.6, cube)).toBe(2 * QUARTER);
    expect(snapDrag(-QUARTER * 2, cube)).toBe(-2 * QUARTER);
  });

  it('never goes past the allowed steps', () => {
    expect(snapDrag(QUARTER * 1.8, { ...cube, steps: 1 })).toBe(QUARTER);
  });
});
