// @ts-check
/** @typedef {import('../types.js').PuzzleDefinition} PuzzleDefinition */
/** @typedef {import('../types.js').Turn} Turn */
/** @typedef {import('../types.js').Frame} Frame */

const sameAxis = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);

/**
 * Le nom du coup en cours, vu de la caméra : la lettre de la couche qui
 * tourne, avec ' ou 2 (l’indice au-dessus du cube, `FaceHints`). Le sens
 * vient de l’intention du glissé, sinon de l’angle du tour.
 * @param {Turn & { intent?: number }} highlight
 * @param {PuzzleDefinition} puzzle
 * @param {Frame} frame
 * @returns {string | null}
 */
export function turnToken(highlight, puzzle, frame) {
  const amount = highlight.intent ?? highlight.angle;
  const signed = Math.sign(amount);
  if (!signed) return null;
  // Même couche = même axe de rotation et même index de couche (null hors NxN)
  const axis = puzzle.turnAxis(highlight);
  for (const name of Object.keys(puzzle.moveLabels ?? {})) {
    const turn = puzzle.toTurn(name, frame);
    if (!turn || !sameAxis(puzzle.turnAxis(turn), axis)) continue;
    if ((turn.layer ?? null) !== (highlight.layer ?? null)) continue;
    if (Math.abs(amount) > puzzle.angle * 1.5) return `${name}2`;
    return Math.sign(turn.angle) !== signed ? `${name}'` : name;
  }
  return null;
}
