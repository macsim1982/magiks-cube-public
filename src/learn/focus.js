// @ts-check
import { isHome } from '../puzzles/core/home';
import { applyTurns } from '../puzzles/core/state';
import { cube3 } from '../puzzles/cube/createCube';

/** Au-delà, le cas parle d’un motif (une ligne, un L), pas d’une pièce : pas de halo. */
export const MAX_FOCUS = 4;

/**
 * Les pièces à suivre d’un cas : celles qu’on regarde (`show`)
 * et qui ne sont pas chez elles au départ (`setup`). Un cas peut les écrire
 * lui-même (`focus`, des ids de pièces).
 * @param {{ setup?: string, show?: string[], focus?: string[] }} item
 * @returns {string[]}
 */
export function caseFocus({ setup = '', show = [], focus }) {
  if (focus) return focus;
  if (!show.length) return [];
  const turns = cube3.parseAlg(setup).map((token) => cube3.toTurn(token, cube3.DEFAULT_FRAME));
  const start = applyTurns(cube3, cube3.createState(), turns);
  const away = show.filter((id) => !isHome(cube3.pieces, start, id));
  return away.length <= MAX_FOCUS ? away : [];
}
