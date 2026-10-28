import { describe, expect, it } from 'vitest';
import Cube from '../../vendor/cubejs/index.js';
import { cube3 } from './createCube';
import { faceletsOf } from './facelets';
import { solveTokens } from './kociemba';
import { applyTurns, cloneState } from '../core/state';
import { centerFacing, inspect } from './inspect';

function stateAfter(tokens) {
  return applyTurns(
    cube3,
    cloneState(cube3.createState()),
    tokens.map((token) => cube3.toTurn(token)),
  );
}

function solvedCube(state) {
  const pieces = inspect(state);
  const { colorOf } = centerFacing(pieces);
  return pieces.every((piece) => piece.stickers.every((sticker) => colorOf[sticker.dir] === sticker.color));
}

describe('facettes Kociemba', () => {
  it('lit un cube résolu', () => {
    const solved = `${'U'.repeat(9)}${'R'.repeat(9)}${'F'.repeat(9)}${'D'.repeat(9)}${'L'.repeat(9)}${'B'.repeat(9)}`;
    expect(faceletsOf(cube3.createState())).toBe(solved);
    expect(new Cube().asString()).toBe(solved);
  });

  it('suit un R', () => {
    expect(faceletsOf(stateAfter(['R']))).toBe(new Cube().move('R').asString());
  });

  it('suit un mélange', () => {
    const tokens = ['U', "R'", 'F2', 'D', "L'", 'B'];
    expect(faceletsOf(stateAfter(tokens))).toBe(new Cube().move(tokens.join(' ')).asString());
  });
});

describe('recherche en deux phases', () => {
  it('résout trois mélanges en 22 coups ou moins', () => {
    for (let i = 0; i < 3; i += 1) {
      const scramble = cube3.scramble(20);
      const solution = solveTokens(scramble);
      expect(solution.length).toBeGreaterThan(0);
      expect(solution.length).toBeLessThanOrEqual(22);
      expect(solvedCube(stateAfter([...scramble, ...solution]))).toBe(true);
    }
  }, 30000);
});
