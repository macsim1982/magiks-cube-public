// @ts-check
/**
 * Registre des puzzles.
 *
 * ## Contrat `PuzzleDefinition`
 *
 * ```js
 * {
 *   id: string,              // ex. 'cube3', 'skewb'
 *   label: string,           // UI
 *   family: 'cube' | 'skewb',  // descriptif : le runtime ne la lit pas
 *   angle: number,           // π/2 ou 2π/3
 *   pieces: Piece[],         // pose résolue
 *   keys: Record<string, string>,  // keydown → token de base
 *   mirror: boolean,         // offset miroir (cube3 seulement)
 *   capabilities: { lessons, solver, race },  // ce que l’écran propose (booléens)
 *   authored: 'slot' | 'world',  // placement mesh (slotWorld vs déjà en world)
 *   Piece: ReactComponent,   // rendu d’une pièce
 *
 *   toTurn(token, frame),
 *   turnToToken(turn, frame),
 *   invert(token),
 *   invertAlg(tokens),
 *   parseAlg(alg),
 *   scramble(length?),
 *   viewFrame(view),          // repère d’une vue (`cameraView(camera)`, render/)
 *   DEFAULT_FRAME,
 *
 *   movingIds(state, turn): string[],
 *   apply(state, turn): state,   // pur
 *   createState(): state,
 *   isSolved(state): boolean,    // à l’orientation près
 *   turnAxis(turn): number[],    // axe unitaire, repère du groupe
 *
 *   slotWorld(slot): number[],
 *   drag: { angle, resolve, lockDistance?, commitRatio?, radius?(start, axis) },
 *   moveLabels: Record<string, string>,
 *   createBodyTemplate?: () => BufferGeometry,  // cube arrondi
 * }
 * ```
 *
 * Ajouter un puzzle : nouveau dossier sous `puzzles/`, exporter l’objet,
 * l’ajouter à `PUZZLES` ci-dessous.
 */

import { cube3, cube4, cube8 } from './cube/createCube';
import { skewb } from './skewb/definition';

export { createCube } from './cube/createCube';
export { skewb } from './skewb/definition';
export { default as PuzzleView } from './render/PuzzleView';
export { QUARTER_DURATION } from './core/timing';
export {
  createSolvedState,
  cloneState,
  statesEqual,
  movedIds,
  applyTurns,
} from './core/state';

/** @typedef {import('./types.js').PuzzleDefinition} PuzzleDefinition */

export const PUZZLES = {
  cube3,
  cube4,
  cube8,
  skewb,
};

export const PUZZLE_LIST = [cube3, cube4, cube8, skewb];

export const DEFAULT_PUZZLE_ID = 'cube3';

export function getPuzzle(id) {
  return PUZZLES[id] ?? PUZZLES[DEFAULT_PUZZLE_ID];
}
