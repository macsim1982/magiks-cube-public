// @ts-check
import { quatRotateVec } from '../../lib/math/quat';

/** Direction monde arrondie d’un sticker : 'x+', 'y-', … */
function stickerDir(quat, face) {
  const local = [0, 0, 0];
  local[face.axis] = face.sign;
  const world = quatRotateVec(quat, local).map(Math.round);
  const axis = world.findIndex((v) => v !== 0);
  return `${'xyz'[axis]}${world[axis] > 0 ? '+' : '-'}`;
}

/**
 * Résolu à l’orientation près : chaque couleur regarde une seule direction,
 * et deux couleurs jamais la même. Indépendant des centres (NxN pairs, Skewb).
 * @param {{ id: string, faces: { color: string, axis: number, sign: number }[] }[]} pieces
 * @param {import('./state.js').PuzzleState} state
 */
export function isSolvedByColor(pieces, state) {
  const dirOfColor = new Map();
  for (const piece of pieces) {
    const { quat } = state.byId[piece.id];
    for (const face of piece.faces) {
      const dir = stickerDir(quat, face);
      const known = dirOfColor.get(face.color);
      if (known === undefined) dirOfColor.set(face.color, dir);
      else if (known !== dir) return false;
    }
  }
  return new Set(dirOfColor.values()).size === dirOfColor.size;
}
