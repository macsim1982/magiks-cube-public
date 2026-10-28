import { describe, expect, it } from 'vitest';
import { caseKey, challengeKey, isStepDone, mark, readProgress, stepKey, stepStars, watchKey, writeProgress } from './progress';

const lesson = {
  id: 'debutant',
  steps: [
    { title: 'La notation', algs: [{ label: 'Droite', alg: 'R' }, { label: 'Dessus', alg: 'U' }] },
    { title: 'Le but', algs: [] },
  ],
};
const [notation, goal] = lesson.steps;

describe('progress', () => {
  it('validates a step once all its cases are done', () => {
    let done = mark(new Set(), caseKey(lesson, notation, notation.algs[0]));
    expect(isStepDone(done, lesson, notation)).toBe(false);
    done = mark(done, caseKey(lesson, notation, notation.algs[1]));
    expect(isStepDone(done, lesson, notation)).toBe(true);
  });

  it('validates a step without cases once read', () => {
    expect(isStepDone(new Set(), lesson, goal)).toBe(false);
    expect(isStepDone(mark(new Set(), stepKey(lesson, goal)), lesson, goal)).toBe(true);
  });

  it('keeps the same set when nothing is new', () => {
    const done = mark(new Set(), 'a');
    expect(mark(done, 'a')).toBe(done);
  });

  it('keys a case by its formula, not its label', () => {
    const renamed = { label: 'Face de droite', alg: 'R' };
    expect(caseKey(lesson, notation, renamed)).toBe(caseKey(lesson, notation, notation.algs[0]));
  });

  it('survives a round trip and ignores broken storage', () => {
    const done = new Set(['a', 'b']);
    expect(readProgress(writeProgress(done))).toEqual(done);
    expect(readProgress('{oops')).toEqual(new Set());
    expect(readProgress(null)).toEqual(new Set());
    expect(readProgress('[1, "a"]')).toEqual(new Set(['a']));
  });

  it('counts three stars: watched, done alone, challenge', () => {
    const [first, second] = notation.algs;
    let done = new Set();
    expect(stepStars(done, lesson, notation).count).toBe(0);
    done = mark(mark(done, watchKey(lesson, notation, first)), watchKey(lesson, notation, second));
    expect(stepStars(done, lesson, notation)).toMatchObject({ watched: true, solo: false, challenge: false, count: 1 });
    done = mark(mark(done, caseKey(lesson, notation, first)), caseKey(lesson, notation, second));
    done = mark(done, challengeKey(lesson, notation));
    expect(stepStars(done, lesson, notation)).toEqual({ watched: true, solo: true, challenge: true, count: 3 });
  });

  it('gives a step without cases all its stars once read', () => {
    expect(stepStars(new Set(), lesson, goal).count).toBe(0);
    expect(stepStars(mark(new Set(), stepKey(lesson, goal)), lesson, goal).count).toBe(3);
  });
});
