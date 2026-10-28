import { describe, expect, it } from 'vitest';
import { cubicBezier } from './bezier';

describe('cubicBezier', () => {
  it('starts at 0, ends at 1, and follows the line when linear', () => {
    const linear = cubicBezier([0.25, 0.25], [0.75, 0.75]);
    expect(linear(0)).toBeCloseTo(0);
    expect(linear(0.3)).toBeCloseTo(0.3);
    expect(linear(1)).toBeCloseTo(1);
  });

  it('runs ahead early on an emphasized curve', () => {
    const emphasized = cubicBezier([0.2, 0], [0, 1]);
    expect(emphasized(0.25)).toBeGreaterThan(0.5);
    expect(emphasized(1)).toBeCloseTo(1);
  });
});
