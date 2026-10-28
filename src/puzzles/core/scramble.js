// @ts-check
/**
 * Un mélange au hasard : `length` coups, chacun une face de `faces` (jamais
 * deux fois la même de suite) et un modificateur de `modifiers`.
 * @param {string[]} faces
 * @param {string[]} modifiers
 * @param {number} length
 */
export function randomMoves(faces, modifiers, length) {
  const moves = [];
  let previous;
  while (moves.length < length) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face === previous) continue;
    previous = face;
    moves.push(face + modifiers[Math.floor(Math.random() * modifiers.length)]);
  }
  return moves;
}
