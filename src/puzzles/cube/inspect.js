// @ts-check
import { quatRotateVec } from '../../lib/math/quat';
import { cube3 } from './createCube';

/**
 * Directions du repère fixe : U haut, D bas, R droite, L gauche, F avant, B arrière.
 * @type {[name: string, axis: number, sign: number][]}
 */
const DIRS = [
  ['U', 1, 1],
  ['D', 1, -1],
  ['R', 0, 1],
  ['L', 0, -1],
  ['F', 2, 1],
  ['B', 2, -1],
];

const DIR_VEC = Object.fromEntries(DIRS.map(([name, axis, sign]) => {
  const v = [0, 0, 0];
  v[axis] = sign;
  return [name, v];
}));

export const DIR_NAMES = DIRS.map(([name]) => name);

/** @param {number[]} vec */
export function dirName(vec) {
  const r = vec.map((v) => Math.round(v));
  for (const [name, axis, sign] of DIRS) {
    if (r[axis] === sign && r.every((v, i) => i === axis || v === 0)) return name;
  }
  return null;
}

/**
 * Stickers visibles : couleur d’origine + direction monde après orientation.
 * @param {import('../core/state.js').PuzzleState} state
 * @param {typeof cube3.pieces} [pieces]
 */
export function inspect(state, pieces = cube3.pieces) {
  return pieces.map((piece) => {
    const pose = state.byId[piece.id];
    const stickers = piece.faces.map((face) => {
      const local = [0, 0, 0];
      local[face.axis] = face.sign;
      return { color: face.color, dir: dirName(quatRotateVec(pose.quat, local)) };
    });
    const dirs = [];
    if (pose.slot[1] === 2) dirs.push('U');
    if (pose.slot[1] === 0) dirs.push('D');
    if (pose.slot[0] === 2) dirs.push('R');
    if (pose.slot[0] === 0) dirs.push('L');
    if (pose.slot[2] === 2) dirs.push('F');
    if (pose.slot[2] === 0) dirs.push('B');
    return {
      id: piece.id,
      kind: piece.kind,
      slot: pose.slot,
      at: dirs,
      stickers,
    };
  });
}

/** @param {ReturnType<typeof inspect>} pieces */
export function centerFacing(pieces) {
  /** @type {Record<string, string>} */
  const colorOf = {};
  /** @type {Record<string, string>} */
  const dirOf = {};
  for (const piece of pieces) {
    if (piece.kind !== 'center') continue;
    const { color, dir } = piece.stickers[0];
    colorOf[dir] = color;
    dirOf[color] = dir;
  }
  return { colorOf, dirOf };
}

export function facingVector(dir) {
  return DIR_VEC[dir];
}

/** Chaque sticker regarde le centre de sa couleur, quelle que soit l’orientation du cube. */
export function isColorSolved(state, pieces = cube3.pieces) {
  const seen = inspect(state, pieces);
  const { dirOf } = centerFacing(seen);
  return seen.every((piece) => piece.stickers.every((sticker) => sticker.dir && sticker.dir === dirOf[sticker.color]));
}
