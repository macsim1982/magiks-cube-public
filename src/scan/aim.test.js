import { describe, expect, it } from 'vitest';
import { AIM, aimAt, colourFamily, motion } from './aim';
import { patchStats } from './color';
import { VIEWS } from './layout';

const WHITE = [232, 232, 226];
const YELLOW = [236, 206, 30];
const RED = [178, 32, 44];
const ORANGE = [238, 112, 24];
const GREEN = [24, 146, 72];
const BLUE = [22, 72, 176];
const PLASTIC = [24, 22, 26];

/** 27 cases nettes ; les centres de la photo ont `centres` (dessus, gauche, droite) */
function cells(photo, centres, fill = WHITE) {
  return VIEWS[photo].map((sticker) => ({
    rgb: sticker.centre ? centres[sticker.side] : fill,
    share: 0.95,
  }));
}

const PHOTO_1 = { top: WHITE, left: GREEN, right: RED };
const PHOTO_2 = { top: YELLOW, left: ORANGE, right: BLUE };

describe('colourFamily', () => {
  it('sorts the six cube colours, red and orange together', () => {
    expect(colourFamily(WHITE)).toBe('white');
    expect(colourFamily(YELLOW)).toBe('yellow');
    expect(colourFamily(RED)).toBe('warm');
    expect(colourFamily(ORANGE)).toBe('warm');
    expect(colourFamily(GREEN)).toBe('green');
    expect(colourFamily(BLUE)).toBe('blue');
    expect(colourFamily(PLASTIC)).toBe('grey');
  });
});

describe('aimAt', () => {
  it('is aimed when the cells look like stickers and the centres are right', () => {
    expect(aimAt(cells(0, PHOTO_1), 0)).toEqual({ stickers: 27, centres: true, aimed: true });
    expect(aimAt(cells(1, PHOTO_2), 1)).toMatchObject({ aimed: true });
  });

  it('forgives a few cells hidden by fingers, not more', () => {
    const hidden = (count) => cells(0, PHOTO_1).map((cell, k) => (k >= 27 - count ? { rgb: [200, 160, 140], share: 0.3 } : cell));
    expect(aimAt(hidden(27 - AIM.cells), 0).aimed).toBe(true);
    expect(aimAt(hidden(27 - AIM.cells + 1), 0).aimed).toBe(false);
  });

  it('sees the black plastic when the cube is too small or off the frame', () => {
    expect(aimAt(cells(0, PHOTO_1, PLASTIC), 0)).toMatchObject({ aimed: false });
  });

  it('keeps a dark blue sticker on the shaded face', () => {
    expect(aimAt(cells(1, PHOTO_2, [15, 50, 100]), 1).aimed).toBe(true);
  });

  it('refuses the wrong way up: the first photo again, or yellow on top', () => {
    expect(aimAt(cells(1, PHOTO_1), 1)).toMatchObject({ centres: false, aimed: false });
    expect(aimAt(cells(0, { ...PHOTO_1, top: YELLOW }), 0).centres).toBe(false);
  });
});

describe('motion', () => {
  it('is zero when nothing moves and large when the view changes', () => {
    const still = cells(0, PHOTO_1);
    expect(motion(null, still)).toBe(Infinity);
    expect(motion(still, still)).toBe(0);
    expect(motion(still, cells(0, PHOTO_1, BLUE))).toBeGreaterThan(AIM.steady);
  });
});

describe('patchStats', () => {
  it('forgives the edge of a joint, not a patch across two colours', () => {
    const width = 12;
    const height = 12;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
      // Rouge à gauche, joint noir à partir de la colonne 8
      const colour = i % width < 8 ? [200, 30, 40] : [20, 20, 20];
      data.set([...colour, 255], i * 4);
    }
    expect(patchStats({ data, width, height }, [3, 6], 2).share).toBe(1);
    // Une colonne de joint sur cinq : encore un sticker
    expect(patchStats({ data, width, height }, [6, 6], 2).share).toBeGreaterThanOrEqual(AIM.share);
    // À cheval, moitié-moitié : non
    expect(patchStats({ data, width, height }, [8, 6], 3).share).toBeLessThan(AIM.share);
  });
});
