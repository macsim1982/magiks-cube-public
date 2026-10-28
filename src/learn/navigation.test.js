import { describe, expect, it } from 'vitest';
import { neighbour } from './navigation';

// Deux leçons : [étape à 3 cas, étape sans cas], [étape à 2 cas]
const lessons = [
  { steps: [{ algs: ['a', 'b', 'c'] }, { algs: [] }] },
  { steps: [{ algs: ['d', 'e'] }] },
];

describe('neighbour', () => {
  it('goes through the cases of a step first', () => {
    expect(neighbour(lessons, { lesson: 0, step: 0, alg: 0 }, 1)).toEqual({ lesson: 0, step: 0, alg: 1, newStep: false });
    expect(neighbour(lessons, { lesson: 0, step: 0, alg: 2 }, -1)).toEqual({ lesson: 0, step: 0, alg: 1, newStep: false });
  });

  it('moves to the next step only from the last case, on its first case', () => {
    expect(neighbour(lessons, { lesson: 0, step: 0, alg: 2 }, 1)).toEqual({ lesson: 0, step: 1, alg: 0, newStep: true });
  });

  it('crosses from one lesson to the next', () => {
    expect(neighbour(lessons, { lesson: 0, step: 1, alg: 0 }, 1)).toEqual({ lesson: 1, step: 0, alg: 0, newStep: true });
  });

  it('goes back to the last case of the previous step', () => {
    expect(neighbour(lessons, { lesson: 1, step: 0, alg: 0 }, -1)).toEqual({ lesson: 0, step: 1, alg: 0, newStep: true });
    expect(neighbour(lessons, { lesson: 0, step: 1, alg: 0 }, -1)).toEqual({ lesson: 0, step: 0, alg: 2, newStep: true });
  });

  it('stops at both ends', () => {
    expect(neighbour(lessons, { lesson: 0, step: 0, alg: 0 }, -1)).toBeNull();
    expect(neighbour(lessons, { lesson: 1, step: 0, alg: 1 }, 1)).toBeNull();
  });
});
