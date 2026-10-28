import { describe, expect, it } from 'vitest';
import { cube3 } from '../puzzles/cube/createCube';
import { FACELETS, faceletsOf } from '../puzzles/cube/facelets';
import { applyTurns } from '../puzzles/core/state';
import { byFacelet, OUTLINE, VIEWS } from './layout';

const after = (alg) => applyTurns(cube3, cube3.createState(), cube3.parseAlg(alg).map((t) => cube3.toTurn(t)));

/**
 * Ce que l’appareil photo voit : le cube tenu comme le demande la photo,
 * puis ses faces dessus / devant / droite. Chaque sticker de la vue est lu
 * à sa place dans le cube tourné.
 */
function photograph(state, view, hold) {
  const held = faceletsOf(applyTurns(cube3, state, cube3.parseAlg(hold).map((t) => cube3.toTurn(t))));
  const seen = { top: 'U', left: 'F', right: 'R' };
  return view.map((sticker, k) => {
    // Même case du cadre sur la face vue : l’ordre des stickers d’une face suit la face monde
    const sameSide = view.filter((s) => s.side === sticker.side);
    const index = sameSide.indexOf(sticker);
    const worldFacelets = FACELETS.map((f, i) => ({ ...f, i })).filter((f) => f.face === seen[sticker.side]);
    // Case monde du sticker : retrouvée par la vue 1 (le cube tel quel)
    const plain = VIEWS[0].filter((s) => s.side === sticker.side)[index];
    const world = worldFacelets.find((f) => f.i === plain.facelet);
    return { facelet: sticker.facelet, letter: held[world.i], k };
  });
}

describe('VIEWS', () => {
  it('sees each of the 54 stickers exactly once over the two photos', () => {
    const facelets = VIEWS.flat().map((s) => s.facelet).sort((a, b) => a - b);
    expect(facelets).toEqual(Array.from({ length: 54 }, (_, i) => i));
  });

  it('puts white, green, red on photo 1 and yellow, orange, blue on photo 2', () => {
    const centres = (view) => Object.fromEntries(view.filter((s) => s.centre).map((s) => [s.side, FACELETS[s.facelet].face]));
    expect(centres(VIEWS[0])).toEqual({ top: 'U', left: 'F', right: 'R' });
    expect(centres(VIEWS[1])).toEqual({ top: 'D', left: 'L', right: 'B' });
  });

  it('reads a scrambled cube back, the second photo held as after z2 y', () => {
    const state = after("R U2 F' L D B2 R' U L2 F");
    const read = Array(54).fill('?');
    for (const [view, hold] of [[VIEWS[0], ''], [VIEWS[1], 'z2 y']]) {
      for (const { facelet, letter } of photograph(state, view, hold)) read[facelet] = letter;
    }
    expect(read.join('')).toBe(faceletsOf(state));
  });

  it('draws the stickers inside the frame and the outline around them', () => {
    for (const { at, corners } of VIEWS.flat()) {
      for (const [x, y] of [at, ...corners]) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(1);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(1);
      }
    }
    expect(OUTLINE).toHaveLength(6);
  });

  it('sees the cube through a phone lens: the near corner is bigger than the far one', () => {
    const top = VIEWS[0].filter((s) => s.side === 'top');
    // Dessus : la case du coin proche (devant à droite) et celle du coin du fond (derrière à gauche)
    const near = top.find((s) => s.facelet === 8);
    const far = top.find((s) => s.facelet === 0);
    expect(near.patch).toBeGreaterThan(far.patch * 1.2);
    expect(Math.min(...VIEWS.flat().map((s) => s.patch))).toBeGreaterThan(0.008);
  });
});

describe('byFacelet', () => {
  it('puts what each photo saw back on its facelet', () => {
    const shots = VIEWS.map((stickers) => stickers.map(({ facelet }) => `seen ${facelet}`));
    expect(byFacelet(shots)).toEqual(Array.from({ length: 54 }, (_, facelet) => `seen ${facelet}`));
  });
});
