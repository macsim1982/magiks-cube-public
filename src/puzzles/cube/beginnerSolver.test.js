import { describe, expect, it } from 'vitest';
import { cube3 } from './createCube';
import { solveBeginner } from './beginnerSolver';

describe('méthode débutant', () => {
  it('résout un cas d’arêtes récalcitrant', () => {
    const scramble = "L' U2 D B R' F U D U2 L2 F' R D2 R F2 U2 D B2 U2 D2".split(' ');
    expect(cube3.isSolved(solveBeginner(scramble).state)).toBe(true);
  });

  it('résout vingt mélanges', () => {
    for (let i = 0; i < 20; i += 1) {
      const scramble = cube3.scramble(20);
      let solved;
      try {
        solved = solveBeginner(scramble);
      } catch (error) {
        throw new Error(`${error.message} | ${scramble.join(' ')}`, { cause: error });
      }
      expect(cube3.isSolved(solved.state), scramble.join(' ')).toBe(true);
    }
  }, 30000);
});
