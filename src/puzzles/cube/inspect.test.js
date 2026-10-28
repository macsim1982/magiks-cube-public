import { describe, expect, it } from 'vitest';
import { applyTurns } from '../core/state';
import { cube3 } from './createCube';
import { isColorSolved } from './inspect';

function turns(tokens) {
  return tokens.map((token) => cube3.toTurn(token));
}

describe('isColorSolved', () => {
  it('stays true after turning the whole cube', () => {
    expect(isColorSolved(cube3.createState())).toBe(true);
    expect(isColorSolved(applyTurns(cube3, cube3.createState(), turns(['y', 'z2'])))).toBe(true);
  });

  it('is false after a face turn', () => {
    expect(isColorSolved(applyTurns(cube3, cube3.createState(), turns(['R'])))).toBe(false);
  });
});
