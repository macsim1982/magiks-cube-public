import { describe, expect, it } from 'vitest';
import { commits, logicalTurn, queuedTurns, smoothstep, turnDuration, withTurnDefaults } from './turnPlan';

const Q = Math.PI / 2;

describe('turnPlan', () => {
  it('fills a turn with the queue defaults, and keeps what is given', () => {
    expect(withTurnDefaults({ axis: 'x', layer: 1, angle: Q })).toMatchObject({ speed: 1, from: 0, to: Q, source: 'queue', hints: true, guide: false });
    expect(withTurnDefaults({ axis: 'x', layer: 1, angle: Q, to: -Q, source: 'pointer' })).toMatchObject({ to: -Q, source: 'pointer' });
  });

  it('leaves a logical turn with its arrival angle and signed steps', () => {
    expect(logicalTurn({ axis: 'y', layer: null, to: -Q })).toEqual({ axis: 'y', layer: null, tip: undefined, angle: -Q, steps: -1 });
    expect(logicalTurn({ axis: 'y', layer: 1, to: 2 * Q, steps: 2 })).toMatchObject({ steps: 2 });
  });

  it('counts a turn from half a step', () => {
    expect(commits({ to: Q * 0.5 }, Q)).toBe(true);
    expect(commits({ to: -Q * 0.49 }, Q)).toBe(false);
  });

  it('times a quarter turn, faster with speed, never under 0.12 s', () => {
    expect(turnDuration({ from: 0, to: Q, speed: 1 }, Q)).toBeCloseTo(0.3);
    expect(turnDuration({ from: 0, to: 2 * Q, speed: 2 }, Q)).toBeCloseTo(0.3);
    expect(turnDuration({ from: 0, to: 0.01, speed: 1 }, Q)).toBeCloseTo(0.12);
  });

  it('queues a formula, the last turn carrying onDone', () => {
    const onDone = () => {};
    const queued = queuedTurns([{ axis: 'x', angle: Q }, { axis: 'y', angle: -Q }], { speed: 1, hints: true, guide: false, onDone });
    expect(queued.map((t) => [t.from, t.to, t.onDone])).toEqual([[0, Q, undefined], [0, -Q, onDone]]);
  });

  it('eases in and out', () => {
    expect([smoothstep(0), smoothstep(0.5), smoothstep(1)]).toEqual([0, 0.5, 1]);
  });
});
