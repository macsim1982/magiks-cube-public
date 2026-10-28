import { describe, expect, it } from 'vitest';
import { getPuzzle } from '../index';
import { wholeTurn } from './pointer';

describe('wholeTurn', () => {
  it('turns the whole cube around the layer axis', () => {
    const cube = getPuzzle('cube3');
    expect(wholeTurn(cube, { axis: 'x', layer: 2 })).toEqual({ axis: 'x', layer: null });
    expect(cube.turnToToken({ axis: 'x', layer: null, angle: -Math.PI / 2 })).toBe('x');
  });

  it('leaves a Skewb turn alone', () => {
    const skewb = getPuzzle('skewb');
    const turn = { tip: [1, 1, 1] };
    expect(wholeTurn(skewb, turn)).toBe(turn);
  });
});
