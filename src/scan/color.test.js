import { describe, expect, it } from 'vitest';
import { cube3 } from '../puzzles/cube/createCube';
import { faceletsOf } from '../puzzles/cube/facelets';
import { applyTurns } from '../puzzles/core/state';
import { classify, readPatch, toOklab } from './color';

const scrambled = (alg) => faceletsOf(applyTurns(cube3, cube3.createState(), cube3.parseAlg(alg).map((t) => cube3.toTurn(t))));

// Couleurs d’un vrai cube en photo, un peu ternes
const PAINT = {
  U: [232, 232, 226],
  R: [178, 32, 44],
  F: [24, 146, 72],
  D: [236, 206, 30],
  L: [238, 112, 24],
  B: [22, 72, 176],
};

/** Hasard reproductible (mulberry32) */
function random(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Ce que liraient les deux photos : chaque facette peinte, du bruit, et la
 * 2ᵉ photo (faces D, L, B) sous une lampe plus chaude et plus sombre.
 */
function photographed(facelets, seed = 1) {
  const next = random(seed);
  return [...facelets].map((letter, i) => {
    const second = i >= 27 && i < 54 && !(i >= 9 && i < 27);
    const cast = second ? [0.86, 0.8, 0.66] : [1, 1, 1];
    return PAINT[letter].map((v, c) => Math.max(0, Math.min(255, v * cast[c] + (next() - 0.5) * 30)));
  });
}

describe('toOklab', () => {
  it('puts white at the top, black at the bottom, both without colour', () => {
    const [L, a, b] = toOklab([255, 255, 255]);
    expect(L).toBeCloseTo(1, 3);
    expect(Math.hypot(a, b)).toBeLessThan(1e-3);
    expect(toOklab([0, 0, 0])[0]).toBeCloseTo(0, 6);
  });
});

describe('readPatch', () => {
  it('takes the median: a glare spot or a joint does not count', () => {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i += 1) data.set([200, 30, 40, 255], i * 4);
    // Reflet blanc sur deux pixels
    data.set([255, 255, 255, 255], (5 * width + 5) * 4);
    data.set([255, 255, 255, 255], (5 * width + 6) * 4);
    expect(readPatch({ data, width, height }, [5, 5], 2)).toEqual([200, 30, 40]);
  });
});

describe('classify', () => {
  it('reads a scrambled cube back, even under a warmer, darker second photo', () => {
    for (const [alg, seed] of [["R U R' U' F2 D L' B2", 1], ["D2 B' L U2 R F' D' B L2 U F R2", 7]]) {
      const facelets = scrambled(alg);
      expect(classify(photographed(facelets, seed)).facelets).toBe(facelets);
    }
  });

  it('keeps nine of each colour and doubts the sticker it had to force', () => {
    const facelets = scrambled("R U R' U' F2 D L' B2");
    const rgb = photographed(facelets, 3);
    // Un sticker orange (L) lu presque rouge : il reste orange, faute de place chez les rouges
    const orange = [...facelets].findIndex((f, i) => f === 'L' && i % 9 !== 4);
    rgb[orange] = [200, 52, 40];
    const { facelets: read, doubt } = classify(rgb);
    for (const letter of 'URFDLB') expect([...read].filter((f) => f === letter)).toHaveLength(9);
    expect(read).toBe(facelets);
    expect(doubt[orange]).toBeGreaterThan(0.5);
    expect(Math.max(...doubt.filter((_, i) => i !== orange))).toBeLessThan(0.5);
  });
});
