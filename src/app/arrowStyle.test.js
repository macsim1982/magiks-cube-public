import { describe, expect, it } from 'vitest';
import { pickArrowStyle } from './arrowStyle';

describe('pickArrowStyle', () => {
  it('draws a solid arrow by default', () => {
    expect(pickArrowStyle('', null)).toBe('continue');
  });

  it('follows the address first', () => {
    expect(pickArrowStyle('?fleche=pointilles', 'continue')).toBe('pointilles');
    expect(pickArrowStyle('?fleche=continue', 'pointilles')).toBe('continue');
  });

  it('keeps the stored choice when the address says nothing', () => {
    expect(pickArrowStyle('?autre=1', 'pointilles')).toBe('pointilles');
  });

  it('ignores unknown values', () => {
    expect(pickArrowStyle('?fleche=zigzag', 'rouge')).toBe('continue');
  });
});
