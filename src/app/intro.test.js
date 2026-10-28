import { describe, expect, it } from 'vitest';
import { applyTurns, getPuzzle, QUARTER_DURATION, statesEqual } from '../puzzles';
import { INTRO, introPlan, shouldPlayIntro } from './intro';

const cube = getPuzzle('cube3');

describe('shouldPlayIntro', () => {
  it('plays on the first visit only', () => {
    expect(shouldPlayIntro({})).toBe(true);
    expect(shouldPlayIntro({ seen: true })).toBe(false);
  });

  it('never plays with reduced motion, unless asked in the address', () => {
    expect(shouldPlayIntro({ reducedMotion: true })).toBe(false);
    expect(shouldPlayIntro({ seen: true, reducedMotion: true, search: '?intro' })).toBe(true);
  });
});

describe('introPlan', () => {
  const tokens = ['R', 'U2', 'F\'', 'L', 'D', 'B2', 'R\'', 'U', 'F', 'L2'];
  const plan = introPlan(cube, tokens, INTRO.solve);

  it('lasts the whole solve', () => {
    const total = plan.reduce((sum, step) => sum + step.duration, 0);
    expect(total).toBeCloseTo(INTRO.solve, 6);
  });

  it('gives PuzzleView the speed that makes each move last its duration', () => {
    for (const step of plan) {
      const quarters = step.token.endsWith('2') ? 2 : 1;
      expect((QUARTER_DURATION * quarters) / step.speed).toBeCloseTo(step.duration, 6);
    }
  });

  it('slows down on the last moves', () => {
    const last = plan.at(-1).duration;
    expect(last).toBeGreaterThan(plan.at(-2).duration);
    expect(Math.max(...plan.slice(0, -3).map((step) => step.duration))).toBeLessThan(last);
  });

  it('solves the scramble when played in order', () => {
    const scramble = cube.scramble(INTRO.moves);
    const solve = introPlan(cube, cube.invertAlg(scramble), INTRO.solve).map((step) => step.token);
    const turns = [...scramble, ...solve].map((token) => cube.toTurn(token, cube.DEFAULT_FRAME));
    expect(statesEqual(applyTurns(cube, cube.createState(), turns), cube.createState())).toBe(true);
  });
});
