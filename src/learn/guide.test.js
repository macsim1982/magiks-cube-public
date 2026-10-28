import { describe, expect, it } from 'vitest';
import { cube3 } from '../puzzles/cube/createCube';
import { applyTurns } from '../puzzles/core/state';
import { guideLesson } from './guide';

function applyAlg(state, tokens) {
  return applyTurns(cube3, state, tokens.map((token) => cube3.toTurn(token)));
}

describe('guide sur un mélange', () => {
  it('écrit cinq chapitres et résout le cube', () => {
    const scramble = cube3.scramble(20);
    const lesson = guideLesson(scramble);
    expect(lesson.steps.map((step) => step.title)).toEqual([
      'La croix blanche',
      'Les coins blancs',
      'Le Belge',
      'La croix jaune',
      'Les coins, jusqu’au bout',
    ]);
    const moves = lesson.steps.flatMap((step) => step.algs.flatMap((alg) => alg.alg.split(' ')));
    const end = applyAlg(cube3.createState(), [...scramble, ...moves]);
    expect(cube3.isSolved(end)).toBe(true);
    for (const step of lesson.steps) {
      expect(step.text.length).toBeGreaterThan(1);
      for (const alg of step.algs) {
        expect(alg.setup.length).toBeGreaterThan(0);
        expect(alg.label.length).toBeGreaterThan(0);
      }
    }
  });
});
