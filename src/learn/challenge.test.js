import { describe, expect, it } from 'vitest';
import { DEBUTANT } from './debutant';
import { challengeCases, hasChallenge, pickChallenge } from './challenge';

const step = (title) => DEBUTANT.steps.find((s) => s.title.startsWith(title));

describe('challenge', () => {
  it('keeps the cases that start from a position of their own', () => {
    expect(challengeCases(step('La croix blanche'))).toEqual([0, 1, 2]);
    // « Retourne le cube » part du cube résolu : il ne se reconnaît pas
    expect(challengeCases(step('La croix jaune'))).toEqual([1, 2, 3]);
  });

  it('has no challenge without two cases to tell apart', () => {
    expect(hasChallenge(step('La notation'))).toBe(false);
    expect(hasChallenge(step('Placer les coins'))).toBe(false);
    expect(hasChallenge(step('La croix blanche'))).toBe(true);
  });

  it('draws another case than the last one', () => {
    const cross = step('La croix blanche');
    for (const r of [0, 0.5, 0.99]) {
      expect(pickChallenge(cross, { last: 1, random: () => r })).not.toBe(1);
    }
    expect(pickChallenge(step('La notation'))).toBe(-1);
  });
});
