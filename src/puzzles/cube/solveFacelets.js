// @ts-check
import Cube from '../../vendor/cubejs/index.js';

let ready = false;

function ensureSolver() {
  if (ready) return;
  Cube.initSolver();
  ready = true;
}

/** @param {string} facelets */
export function solveFacelets(facelets) {
  ensureSolver();
  const solution = Cube.fromString(facelets).solve();
  return solution ? solution.split(' ') : [];
}
