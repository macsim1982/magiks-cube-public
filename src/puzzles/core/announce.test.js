import { describe, expect, it } from 'vitest';
import { ANNOUNCE, ghostFade } from './announce';

describe('ghostFade', () => {
  it('waits, fades in, holds, fades out, then ends', () => {
    expect(ghostFade(0)).toBe(0);
    expect(ghostFade((ANNOUNCE.in + ANNOUNCE.shown) / 2)).toBeCloseTo(0.5);
    expect(ghostFade(ANNOUNCE.shown)).toBe(1);
    expect(ghostFade((ANNOUNCE.out + ANNOUNCE.end) / 2)).toBeCloseTo(0.5);
    expect(ghostFade(ANNOUNCE.end)).toBeNull();
  });
});
