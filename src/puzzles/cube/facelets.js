// @ts-check
import { inspect } from './inspect';

/** Lettres de Kociemba : la couleur d’origine, pas la face où elle se trouve. */
const LETTER = {
  top: 'U',
  right: 'R',
  front: 'F',
  bottom: 'D',
  left: 'L',
  back: 'B',
};

/** @typedef {{ face: string, cell: [number, number, number] }} Facelet */

/**
 * @param {(row: number, col: number) => [number, number, number]} cellFor
 * @returns {[number, number, number][]}
 */
const grid = (cellFor) => {
  const cells = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) cells.push(cellFor(row, col));
  }
  return cells;
};

/**
 * Case (0..2 sur chaque axe) de la ligne `row`, colonne `col` de chaque
 * face, en la regardant, ligne du haut d’abord.
 * @type {[string, (row: number, col: number) => [number, number, number]][]}
 */
const FACES = [
  ['U', (row, col) => [col, 2, row]],
  ['R', (row, col) => [2, 2 - row, 2 - col]],
  ['F', (row, col) => [col, 2 - row, 2]],
  ['D', (row, col) => [col, 0, 2 - row]],
  ['L', (row, col) => [0, 2 - row, col]],
  ['B', (row, col) => [2 - col, 2 - row, 0]],
];

/**
 * Les 54 facettes dans l’ordre de Kociemba (U R F D L B) : la face que
 * regarde le sticker et la case de sa pièce.
 * @type {Facelet[]}
 */
export const FACELETS = FACES.flatMap(([face, cellFor]) => grid(cellFor).map((cell) => ({ face, cell })));

/**
 * 54 facettes, ordre U R F D L B (`FACELETS`).
 * @param {import('../core/state.js').PuzzleState} state
 */
export function faceletsOf(state) {
  const at = new Map();
  for (const piece of inspect(state)) {
    const key = piece.slot.join(',');
    for (const sticker of piece.stickers) {
      at.set(`${key}:${sticker.dir}`, LETTER[sticker.color]);
    }
  }
  return FACELETS.map(({ face, cell }) => {
    const letter = at.get(`${cell.join(',')}:${face}`);
    if (!letter) throw new Error(`facette manquante ${cell.join(',')} ${face}`);
    return letter;
  }).join('');
}
