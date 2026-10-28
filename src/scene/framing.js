// @ts-check

/** Sphère englobante du puzzle : cube de 3 unités, stickers et étirement miroir compris */
export const SUBJECT_RADIUS = 2.9;

/**
 * Cube classique : rayon de sa silhouette la plus large (vue selon une
 * grande diagonale, √(2/3) × 3 ≈ 2,45), stickers compris. Le cadre suit le
 * cube, pas sa sphère englobante : il gagne ~15 %.
 */
export const CLASSIC_RADIUS = 2.5;

/** Place gardée libre autour du canvas (px) : panneau du bas, barre du haut, colonne de gauche. */
export const NO_RESERVE = Object.freeze({ top: 0, bottom: 0, left: 0 });

// Recul horizontal de la vue de repos : celui de l’ancienne vue [4, 4, 6]
const HOME_REACH = Math.hypot(4, 6);

/**
 * Position de départ de la caméra (Canvas) : vue de trois quarts, en haut à
 * droite, sur la diagonale du cube. L’arête verticale de devant cache celle
 * du fond, les faces gauche et droite sont symétriques.
 */
/** @type {[number, number, number]} */
export const CAMERA_HOME = [HOME_REACH / Math.SQRT2, 4, HOME_REACH / Math.SQRT2];

/** Angle polaire permis par `OrbitSnap` autour de l’horizon */
export const POLAR_MIN = (Math.PI / 2) * 0.7;
export const POLAR_MAX = (Math.PI / 2) * 1.3;

/**
 * Vue de repos en sphériques (conventions de `THREE.Spherical`), bornée
 * comme le fera `OrbitControls` : rendre la main ne fait pas sauter la vue.
 */
export function homePose() {
  const [x, y, z] = CAMERA_HOME;
  const phi = Math.acos(y / Math.hypot(x, y, z));
  return { theta: Math.atan2(x, z), phi: Math.min(POLAR_MAX, Math.max(POLAR_MIN, phi)) };
}

// Intro : un tour complet, de haut et de loin, jusqu’à la vue de repos
const INTRO_TURN = Math.PI * 2;
const INTRO_PHI = 0.35;
const INTRO_DIP = 0.45;
const INTRO_FAR = 0.3;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;

/**
 * Pose de la caméra pendant l’intro, `t` de 0 à 1. La caméra plonge un peu
 * sous la vue de repos à mi-parcours, puis remonte s’y poser.
 *
 * @param {number} t
 * @param {{ theta: number, phi: number, distance: number }} end
 */
export function introPose(t, end) {
  const k = easeInOut(Math.min(1, Math.max(0, t)));
  return {
    theta: end.theta - INTRO_TURN * (1 - k),
    phi: INTRO_PHI + (end.phi - INTRO_PHI) * k + INTRO_DIP * Math.sin(Math.PI * k),
    distance: end.distance * (1 + (INTRO_FAR - 1) * (1 - easeOut(Math.min(1, Math.max(0, t))))),
  };
}

/** @typedef {{ top?: number, bottom?: number, left?: number }} Reserve */

/**
 * Distance caméra–centre pour que le puzzle tienne dans la zone libre du
 * canvas : le canvas moins la place gardée (`reserve`). Jamais plus près
 * que `rest`.
 *
 * @param {{ fov: number, width: number, height: number, reserve?: Reserve, rest: number, radius?: number }} view
 */
export function fitDistance({ fov, width, height, reserve = NO_RESERVE, rest, radius = SUBJECT_RADIUS }) {
  const { top = 0, bottom = 0, left = 0 } = reserve;
  const freeHeight = Math.max(1, height - top - bottom);
  const freeWidth = Math.max(1, width - left);
  const tan = Math.tan((fov * Math.PI) / 360);
  const vertical = Math.atan(tan * (freeHeight / height));
  const horizontal = Math.atan(tan * (freeWidth / height));
  return Math.max(rest, radius / Math.sin(Math.min(vertical, horizontal)));
}

/**
 * Décalage d’objectif (px, pour `camera.setViewOffset`) qui place le centre
 * du puzzle au milieu de la zone libre plutôt qu’au milieu du canvas.
 *
 * @param {Reserve} reserve
 */
export function lensShift({ top = 0, bottom = 0, left = 0 } = NO_RESERVE) {
  return { x: -left / 2, y: (bottom - top) / 2 };
}
