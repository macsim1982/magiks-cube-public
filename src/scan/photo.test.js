import { describe, expect, it } from 'vitest';
import { cube3 } from '../puzzles/cube/createCube';
import { faceletsOf } from '../puzzles/cube/facelets';
import { applyTurns } from '../puzzles/core/state';
import { AIM, aimAt } from './aim';
import { patchStats } from './color';
import { FIELD, lens, VIEWS } from './layout';

const SIZE = 360;
const PAINT = {
  U: [236, 236, 230],
  R: [186, 26, 36],
  F: [22, 150, 72],
  D: [242, 206, 26],
  L: [246, 116, 22],
  B: [22, 76, 182],
};
const BODY = [24, 22, 26];

const after = (alg) => applyTurns(cube3, cube3.createState(), cube3.parseAlg(alg).map((t) => cube3.toTurn(t)));

/**
 * Faces vues sur la photo 1, lues comme Kociemba : la case (ligne, colonne)
 * donne son milieu et ses deux axes. Indépendant de `layout.js`.
 */
const FACES = [
  { offset: 0, cell: (row, col) => [[col - 1, 1.5, row - 1], [1, 0, 0], [0, 0, 1]] },
  { offset: 18, cell: (row, col) => [[col - 1, 1 - row, 1.5], [1, 0, 0], [0, 1, 0]] },
  { offset: 9, cell: (row, col) => [[1.5, 1 - row, 1 - col], [0, 1, 0], [0, 0, 1]] },
];

/** Photo de synthèse : les faces U, F, R du cube, vues par un objectif de `field` degrés */
function photograph(facelets, field) {
  const project = lens(field);
  const data = new Uint8ClampedArray(SIZE * SIZE * 4).fill(200);
  const quad = ([centre, a, b], size) => [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    .map(([s, t]) => project(centre.map((v, i) => v + size * (s * a[i] + t * b[i]))))
    .map(([x, y]) => [x * SIZE, y * SIZE]);
  const fill = (corners, colour) => {
    const xs = corners.map((p) => p[0]);
    const ys = corners.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y += 1) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x += 1) {
        const signs = corners.map(([ax, ay], k) => {
          const [bx, by] = corners[(k + 1) % 4];
          return Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
        });
        if (signs.every((s) => s >= 0) || signs.every((s) => s <= 0)) data.set(colour, (y * SIZE + x) * 4);
      }
    }
  };
  for (const face of FACES) {
    fill(quad(face.cell(1, 1), 1.5), BODY);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        fill(quad(face.cell(row, col), 0.42), PAINT[facelets[face.offset + row * 3 + col]]);
      }
    }
  }
  return { data, width: SIZE, height: SIZE };
}

describe('the frame against a real phone lens', () => {
  const facelets = faceletsOf(after("R U2 F' L D B2 R' U L2 F"));

  for (const field of [40, FIELD, 54]) {
    it(`reads every sticker of a ${field}° photo through the ${FIELD}° frame`, () => {
      const image = photograph(facelets, field);
      const cells = VIEWS[0].map(({ at, patch }) => patchStats(image, [at[0] * SIZE, at[1] * SIZE], patch * SIZE));
      VIEWS[0].forEach(({ facelet }, k) => {
        expect(cells[k].rgb).toEqual(PAINT[facelets[facelet]]);
        expect(cells[k].share).toBeGreaterThanOrEqual(AIM.share);
      });
      expect(aimAt(cells, 0).aimed).toBe(true);
    });
  }
});
