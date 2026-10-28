import { describe, expect, it } from 'vitest';
import { compactAlg, invertAlg } from './notation';

describe('compactAlg', () => {
  it.each([
    [['R', 'R'], ['R2']],
    [['R', "R'"], []],
    [['R2', 'R'], ["R'"]],
    [['U', 'R', 'R', "R'", 'F'], ['U', 'R', 'F']],
    [['y', 'y2'], ["y'"]],
  ])('%j → %j', (tokens, packed) => {
    expect(compactAlg(tokens)).toEqual(packed);
  });
});

describe('invertAlg', () => {
  it('reverses and inverts each move', () => {
    expect(invertAlg(['R', "U'", 'F2'])).toEqual(['F2', 'U', "R'"]);
  });
});
