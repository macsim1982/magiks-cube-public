// @ts-check
import { quatFromAxisAngle, quatRotateVec } from '../../lib/math/quat';
import { cross } from '../../lib/math/vec';

/** @typedef {import('../types.js').Frame} Frame */
/** @typedef {import('../types.js').CameraView} CameraView */

const AXES = ['x', 'y', 'z'];

/** L’axe du monde le plus proche de `v` (hors `exclude`), avec son signe */
const dominantAxis = (v, exclude) => {
  const axis = AXES.filter((a) => a !== exclude).reduce((best, a) =>
    Math.abs(v[AXES.indexOf(a)]) > Math.abs(v[AXES.indexOf(best)]) ? a : best
  );
  return { axis, sign: v[AXES.indexOf(axis)] < 0 ? -1 : 1 };
};

const toVector = ({ axis, sign }) => AXES.map((a) => (a === axis ? sign : 0));

// La vue de repos regarde le cube sur sa diagonale (45°, `CAMERA_HOME`) et
// l’aimant d’orbite la garde à 45° + k·90° : la caméra est pile entre deux
// faces. On tourne de -45° autour de Y avant de choisir F, pour que ces vues
// tombent au milieu d’une face et non sur une égalité x / z. F reste la face
// de gauche à l’écran (+z au repos), R celle de droite.
const HOME_TWIST = quatFromAxisAngle([0, 1, 0], -Math.PI / 4);

/**
 * Repère de la vue : F vers la caméra, U haut écran, R = U × F. La vue est
 * donnée en vecteurs du monde (`cameraView` les tire d’une caméra Three.js).
 * @param {CameraView} view
 * @returns {Frame}
 */
export function viewFrame({ toCamera, screenUp }) {
  const F = dominantAxis(quatRotateVec(HOME_TWIST, toCamera));
  const U = dominantAxis(quatRotateVec(HOME_TWIST, screenUp), F.axis);
  const R = dominantAxis(cross(toVector(U), toVector(F)));
  return { R, U, F };
}

export const DEFAULT_FRAME = {
  R: { axis: 'x', sign: 1 },
  U: { axis: 'y', sign: 1 },
  F: { axis: 'z', sign: 1 },
};
