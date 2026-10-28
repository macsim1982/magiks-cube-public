// @ts-check
import { quatRotateVec } from '../../lib/math/quat';

/**
 * La place d’une pièce : là où chacune de ses couleurs touche le
 * centre de la même couleur. Elle se lit sur les centres, pas sur le repère :
 * elle suit le cube tourné en entier (x, y, z) et les centres qu’une tranche
 * du milieu emmène. Seulement pour un puzzle à six centres (le 3×3).
 */

/** @typedef {{ id: string, kind?: string, faces: { color: string, axis: number, sign: number }[] }} HomePiece */
/** @typedef {import('./state.js').PuzzleState} PuzzleState */

/**
 * Le cœur du cube et le côté (±1 sur un axe) où regarde chaque couleur.
 * @param {HomePiece[]} pieces
 * @param {PuzzleState} state
 * @returns {{ core: number[], sides: Map<string, number[]> } | null}
 */
export function centerSides(pieces, state) {
  const centers = pieces.filter((piece) => piece.kind === 'center');
  if (centers.length !== 6) return null;
  const slots = centers.map((piece) => state.byId[piece.id].slot);
  const core = [0, 1, 2].map((axis) => slots.reduce((sum, slot) => sum + slot[axis], 0) / slots.length);
  const sides = new Map();
  centers.forEach((piece, at) => {
    sides.set(piece.faces[0].color, slots[at].map((v, axis) => Math.sign(v - core[axis])));
  });
  return { core, sides };
}

/**
 * Où va la pièce `id` : son slot, et le côté de chacune de ses couleurs.
 * `null` pour un centre, ou sans six centres.
 * @param {HomePiece[]} pieces
 * @param {PuzzleState} state
 * @param {string} id
 * @returns {{ slot: number[], faces: { color: string, side: number[] }[] } | null}
 */
export function homeOf(pieces, state, id) {
  const piece = pieces.find((p) => p.id === id);
  const read = centerSides(pieces, state);
  if (!piece || piece.kind === 'center' || !read) return null;
  const faces = piece.faces.map(({ color }) => ({ color, side: read.sides.get(color) }));
  const slot = read.core.map((v, axis) => faces.reduce((sum, face) => sum + face.side[axis], v));
  return { slot, faces };
}

/**
 * La pièce est-elle chez elle : à sa place, chaque couleur du bon côté ?
 * @param {HomePiece[]} pieces
 * @param {PuzzleState} state
 * @param {string} id
 */
export function isHome(pieces, state, id) {
  const home = homeOf(pieces, state, id);
  if (!home) return true;
  const pose = state.byId[id];
  if (home.slot.some((v, axis) => v !== pose.slot[axis])) return false;
  const piece = pieces.find((p) => p.id === id);
  return piece.faces.every((face, at) => {
    const local = [0, 0, 0];
    local[face.axis] = face.sign;
    const looks = quatRotateVec(pose.quat, local).map(Math.round);
    return looks.every((v, axis) => v === home.faces[at].side[axis]);
  });
}
