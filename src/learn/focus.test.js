import { describe, expect, it } from 'vitest';
import { DEBUTANT } from './debutant';
import { caseFocus, MAX_FOCUS } from './focus';
import { pieceWith, pose, SHOW_WHITE_CROSS, WHITE } from './helpers';

const step = (title) => DEBUTANT.steps.find((s) => s.title.startsWith(title));
const algOf = (title, label) => step(title).algs.find((a) => a.label === label);

describe('caseFocus', () => {
  it('follows the one white edge that is away at the start of a cross case', () => {
    const alg = algOf('La croix blanche', 'Arête en bas');
    expect(caseFocus({ setup: alg.setup, show: SHOW_WHITE_CROSS })).toEqual([pieceWith(WHITE, 'front')]);
  });

  it('follows nothing when the case shows every piece (no show list)', () => {
    expect(caseFocus({ setup: pose('R'), show: [] })).toEqual([]);
  });

  it('follows nothing when too many pieces are away: the case is about a pattern', () => {
    const show = SHOW_WHITE_CROSS;
    expect(caseFocus({ setup: 'U', show })).toHaveLength(4);
    expect(caseFocus({ setup: 'U F2 B2', show }).length).toBeLessThanOrEqual(MAX_FOCUS);
  });

  it('keeps the pieces a case names itself', () => {
    const alg = algOf('La croix blanche', 'Arête sur le côté');
    expect(caseFocus({ setup: alg.setup, show: SHOW_WHITE_CROSS, focus: alg.focus })).toEqual([pieceWith(WHITE, 'back')]);
  });

  it('follows the belge edge only, not the white face it lifts for a while', () => {
    const s = step('Le Belge');
    expect(caseFocus({ setup: s.algs[0].setup, show: s.show })).toHaveLength(1);
  });
});
