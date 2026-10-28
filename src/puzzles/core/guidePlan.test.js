import { describe, expect, it } from 'vitest';
import { arcPoints, guideProgress, hintMode, keepsHint, SEGMENTS, sliceRing, SWEEP } from './guidePlan';

describe('hints', () => {
  it('picks the mode: stay draws once, sweeps repeat, else static', () => {
    expect(hintMode({ stay: true, sweeps: 2 })).toBe('draw');
    expect(hintMode({ sweeps: 2 })).toBe('sweep');
    expect(hintMode({})).toBe('static');
  });

  it('keeps the same staying hint, redraws for sweeps, stay or another token', () => {
    const shown = { mode: 'static', token: 'R', dashed: false };
    expect(keepsHint(shown, 'R', { dashed: false })).toBe(true);
    expect(keepsHint(shown, 'R', { dashed: true })).toBe(false);
    expect(keepsHint(shown, 'U', { dashed: false })).toBe(false);
    expect(keepsHint(shown, 'R', { stay: true, dashed: false })).toBe(false);
    expect(keepsHint({ ...shown, mode: 'sweep' }, 'R', { dashed: false })).toBe(false);
  });
});

describe('guideProgress', () => {
  it('draws a lead arrow during its lead', () => {
    expect(guideProgress({ mode: 'lead', lead: 0.5 }, 0.25).drawn).toBeCloseTo(0.5);
  });

  it('sweeps, fades, then ends after its rounds', () => {
    const cycle = SWEEP.draw + SWEEP.hold + SWEEP.fade;
    expect(guideProgress({ mode: 'sweep', sweeps: 2 }, cycle + SWEEP.draw / 2).drawn).toBeCloseTo(0.5);
    expect(guideProgress({ mode: 'sweep', sweeps: 2 }, cycle - SWEEP.fade / 2).opacity).toBeCloseTo(0.5);
    expect(guideProgress({ mode: 'sweep', sweeps: 2 }, 2 * cycle).ended).toBe(true);
  });

  it('settles a drawn arrow after drawing and holding', () => {
    expect(guideProgress({ mode: 'draw' }, 0.4).settled).toBeUndefined();
    expect(guideProgress({ mode: 'draw' }, SWEEP.draw + SWEEP.hold).settled).toBe(true);
  });
});

describe('arrow geometry', () => {
  const ring = sliceRing([1, 0, 0], [[1, 1, 1], [1, -1, 1], [1, 0, 0]]);

  it('rings the slice just outside its pieces', () => {
    expect(ring.centre).toEqual([1, 0, 0]);
    expect(ring.radius).toBeCloseTo(Math.SQRT2 + 0.9);
  });

  it('draws the arc on that ring, longer for a half turn', () => {
    const quarter = arcPoints(ring, { sign: 1, half: false, cameraLocal: [5, 4, 5] });
    const half = arcPoints(ring, { sign: 1, half: true, cameraLocal: [5, 4, 5] });
    expect(quarter).toHaveLength(SEGMENTS + 1);
    for (const [x, y, z] of quarter) {
      expect(x).toBeCloseTo(1);
      expect(Math.hypot(y, z)).toBeCloseTo(ring.radius);
    }
    const chord = (points) => Math.hypot(points[0][1] - points.at(-1)[1], points[0][2] - points.at(-1)[2]);
    expect(chord(half)).not.toBeCloseTo(chord(quarter));
  });
});
