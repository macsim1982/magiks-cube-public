import { describe, expect, it } from 'vitest';
import { nextRace } from './race';

const moves = ['R', 'U'];

describe('nextRace', () => {
  it('walks cover → inspect → run → done', () => {
    const cover = nextRace(null, { type: 'start', moves }, 0);
    expect(cover).toEqual({ phase: 'cover', moves });
    const inspect = nextRace(cover, { type: 'inspect' }, 10);
    expect(inspect).toMatchObject({ phase: 'inspect', startedAt: 10, stoppedAt: null });
    const run = nextRace(inspect, { type: 'solve' }, 25);
    expect(run).toMatchObject({ phase: 'run', startedAt: 25, stoppedAt: null });
    expect(nextRace(run, { type: 'finish' }, 40)).toMatchObject({ phase: 'done', startedAt: 25, stoppedAt: 40 });
  });

  it.each([
    ['inspect', null],
    ['solve', { phase: 'cover', moves }],
    ['finish', { phase: 'inspect', moves, startedAt: 1, stoppedAt: null }],
    ['inspect', { phase: 'run', moves, startedAt: 1, stoppedAt: null }],
  ])('ignores %s out of phase', (type, race) => {
    expect(nextRace(race, { type }, 99)).toBe(race);
  });

  it('restarts from any phase and clears', () => {
    const done = { phase: 'done', moves, startedAt: 1, stoppedAt: 2 };
    expect(nextRace(done, { type: 'start', moves: ['F'] }, 5)).toEqual({ phase: 'cover', moves: ['F'] });
    expect(nextRace(done, { type: 'clear' }, 5)).toBeNull();
  });
});
