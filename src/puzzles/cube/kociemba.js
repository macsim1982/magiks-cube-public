// @ts-check
import { applyTurns, cloneState } from '../core/state';
import { cube3 } from './createCube';
import { faceletsOf } from './facelets';
import { solveFacelets } from './solveFacelets';

export { solveFacelets };

/** @param {string[]} tokens */
export function solveTokens(tokens) {
  const state = applyTurns(
    cube3,
    cloneState(cube3.createState()),
    tokens.map((token) => cube3.toTurn(token)),
  );
  return solveFacelets(faceletsOf(state));
}
