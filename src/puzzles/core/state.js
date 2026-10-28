// @ts-check
/**
 * État logique d’un puzzle : chaque pièce a un slot et une orientation.
 * Les meshes Three.js sont rebakés depuis cet état après chaque coup.
 */
import { quatRotateVec } from '../../lib/math/quat';

/** @typedef {{ slot: number[], quat: number[] }} PiecePose */
/** @typedef {{ byId: Record<string, PiecePose> }} PuzzleState */

export const IDENTITY_QUAT = Object.freeze([0, 0, 0, 1]);

/** @param {{ id: string, slot: number[] }[]} pieces */
export function createSolvedState(pieces) {
  const byId = Object.create(null);
  for (const piece of pieces) {
    byId[piece.id] = {
      slot: piece.slot.slice(),
      quat: IDENTITY_QUAT.slice(),
    };
  }
  return { byId };
}

/** @param {PuzzleState} state */
export function cloneState(state) {
  const byId = Object.create(null);
  for (const id of Object.keys(state.byId)) {
    const pose = state.byId[id];
    byId[id] = { slot: pose.slot.slice(), quat: pose.quat.slice() };
  }
  return { byId };
}

/** q et -q représentent la même orientation. */
function quatsEqual(a, b, eps = 1e-6) {
  let same = true;
  let opp = true;
  for (let i = 0; i < 4; i++) {
    if (Math.abs(a[i] - b[i]) > eps) same = false;
    if (Math.abs(a[i] + b[i]) > eps) opp = false;
  }
  return same || opp;
}

/** @param {PuzzleState} a @param {PuzzleState} b */
export function statesEqual(a, b) {
  const ids = Object.keys(a.byId);
  if (ids.length !== Object.keys(b.byId).length) return false;
  for (const id of ids) {
    const pa = a.byId[id];
    const pb = b.byId[id];
    if (!pb) return false;
    if (pa.slot.some((v, i) => v !== pb.slot[i])) return false;
    if (!quatsEqual(pa.quat, pb.quat)) return false;
  }
  return true;
}

/** Le sticker regarde-t-il le même côté dans les deux orientations ? */
function sameSide(qa, qb, { axis, sign }) {
  const local = [0, 0, 0];
  local[axis] = sign;
  const a = quatRotateVec(qa, local).map(Math.round);
  const b = quatRotateVec(qb, local).map(Math.round);
  return a.every((v, i) => v === b[i]);
}

/**
 * Pièces qui ont changé à l’œil (pur) : une autre place, ou un sticker
 * tourné vers un autre côté. Un centre qui tourne sur lui-même ne compte pas.
 * @param {{ id: string, faces: { axis: number, sign: number }[] }[]} pieces
 * @param {PuzzleState} before
 * @param {PuzzleState} after
 * @returns {string[]}
 */
export function movedIds(pieces, before, after) {
  return pieces.filter(({ id, faces }) => {
    const pa = before.byId[id];
    const pb = after.byId[id];
    if (!pa || !pb) return false;
    if (pa.slot.some((v, i) => v !== pb.slot[i])) return true;
    return !faces.every((face) => sameSide(pa.quat, pb.quat, face));
  }).map(({ id }) => id);
}

/**
 * Applique une liste de tours sur un état (pur).
 * @param {object} puzzle
 * @param {PuzzleState} state
 * @param {object[]} turns
 */
export function applyTurns(puzzle, state, turns) {
  let next = state;
  for (const turn of turns) {
    next = puzzle.apply(next, turn);
  }
  return next;
}
