// @ts-check
import { FACELETS } from '../puzzles/cube/facelets';
import { dirName } from '../puzzles/cube/inspect';

/**
 * Les deux photos du scan : le cube vu par un coin, 3
 * faces par photo, comme le voit l’objectif d’un téléphone. Le dessus en
 * haut, la face avant en bas à gauche, la droite en bas à droite.
 *
 * Repère monde, celui du cube de l’app : x à droite, y en haut, z vers soi.
 * Cadre : coordonnées 0..1, y vers le bas.
 */

/** Demi-côté d’un sticker (un cubie = 1, il reste un joint de 0,1). */
const STICKER = 0.45;
/** Marge du cadre autour de la silhouette */
const MARGIN = 0.06;

/**
 * Champ de l’objectif sur le côté du carré, en degrés : grand angle de
 * téléphone, entre la vidéo 16:9 (≈ 41°) et le capteur 4:3 (≈ 53°).
 */
export const FIELD = 46;

// La caméra regarde le coin (1, 1, 1) depuis l’extérieur : son axe, sa droite, son haut
const TOWARD = [1, 1, 1].map((v) => v / Math.sqrt(3));
const ACROSS = [1, 0, -1].map((v) => v / Math.SQRT2);
const UP = [-1, 2, -1].map((v) => v / Math.sqrt(6));

/** @param {number[]} p @param {number[]} q */
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

/** Les 8 sommets du cube (côté 3) */
const VERTICES = [-1.5, 1.5].flatMap((x) => [-1.5, 1.5].flatMap((y) => [-1.5, 1.5].map((z) => [x, y, z])));

/**
 * Perspective d’un objectif de `field` degrés. Le cube est centré sur l’axe,
 * à la distance où il remplit le cadre jusqu’à la marge : les sommets
 * proches paraissent plus gros, comme sur une vraie photo.
 * @param {number} field degrés, sur le côté du carré
 * @returns {(point: number[]) => [number, number]} point du cube → cadre
 */
export function lens(field) {
  const half = Math.tan((field * Math.PI) / 360);
  // Le point de la silhouette le plus loin de l’axe touche la marge
  const reach = (0.5 - MARGIN) * 2 * half;
  const distance = Math.max(...VERTICES.map((v) => (
    dot(v, TOWARD) + Math.max(Math.abs(dot(v, ACROSS)), Math.abs(dot(v, UP))) / reach
  )));
  return (point) => {
    const depth = distance - dot(point, TOWARD);
    return [
      0.5 + dot(point, ACROSS) / depth / (2 * half),
      0.5 - dot(point, UP) / depth / (2 * half),
    ];
  };
}

const project = lens(FIELD);

/**
 * Les trois faces vues : la normale et deux axes dans la face.
 * @type {{ side: 'top' | 'left' | 'right', normal: number[], a: number[], b: number[] }[]}
 */
const SIDES = [
  { side: 'top', normal: [0, 1, 0], a: [1, 0, 0], b: [0, 0, 1] },
  { side: 'left', normal: [0, 0, 1], a: [1, 0, 0], b: [0, 1, 0] },
  { side: 'right', normal: [1, 0, 0], a: [0, 1, 0], b: [0, 0, 1] },
];

/**
 * Tenue du cube pour chaque photo : d’un vecteur monde au repère du cube.
 * 1. Le blanc (U) en haut, le vert (F) à gauche, le rouge (R) à droite.
 * 2. Basculé d’un demi-tour vers soi (autour de l’axe gauche-droite de
 *    l’écran) : le jaune (D) en haut, l’orange (L) à gauche, le bleu (B) à
 *    droite. Comme `z2 y`.
 * @type {((v: number[]) => number[])[]}
 */
const TO_CUBE = [
  ([x, y, z]) => [x, y, z],
  ([x, y, z]) => [-z, -y, -x],
];

/** @param {number[]} p @param {number[]} q @param {number} k */
const add = (p, q, k = 1) => p.map((v, i) => v + k * q[i]);

/** @param {number[]} cell case du cube, de -1 à 1 ; @param {string} face */
function faceletAt(cell, face) {
  const target = cell.map((v) => v + 1).join(',');
  return FACELETS.findIndex((f) => f.face === face && f.cell.join(',') === target);
}

/** Distance de `p` à la droite qui passe par `a` et `b` (cadre) */
function toLine(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.abs(dx * (a[1] - p[1]) - (a[0] - p[0]) * dy) / Math.hypot(dx, dy);
}

/**
 * @typedef {{
 *   facelet: number,
 *   side: 'top' | 'left' | 'right',
 *   centre: boolean,
 *   at: [number, number],
 *   corners: [number, number][],
 *   patch: number,
 * }} ScanSticker
 * `patch` : demi-côté (cadre) du carré où lire sa couleur. En perspective,
 * un sticker proche est plus grand qu’un sticker du fond.
 */

/** @param {(v: number[]) => number[]} toCube @returns {ScanSticker[]} */
function view(toCube) {
  const stickers = [];
  for (const { side, normal, a, b } of SIDES) {
    for (const i of [-1, 0, 1]) {
      for (const j of [-1, 0, 1]) {
        const cell = add(add(normal, a, i), b, j);
        const middle = add(add(add([0, 0, 0], normal, 1.5), a, i), b, j);
        const at = project(middle);
        const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, t]) => project(add(add(middle, a, s * STICKER), b, t * STICKER)));
        // Moitié du plus grand carré du cercle inscrit : loin des joints même
        // si le cube est un peu décalé
        const inscribed = Math.min(...corners.map((corner, k) => toLine(at, corner, corners[(k + 1) % 4])));
        stickers.push({
          facelet: faceletAt(toCube(cell), dirName(toCube(normal)) ?? ''),
          side,
          centre: i === 0 && j === 0,
          at,
          corners,
          patch: inscribed / Math.SQRT2 / 2,
        });
      }
    }
  }
  return stickers;
}

/** Les 27 stickers vus sur chaque photo. */
export const VIEWS = TO_CUBE.map(view);

/**
 * Les couleurs des deux photos, rangées par facette (0 à 53) : ce que
 * `classify` attend.
 * @template T
 * @param {T[][]} shots une valeur par case vue, photo par photo, dans l’ordre de VIEWS
 * @returns {T[]}
 */
export function byFacelet(shots) {
  const out = Array(54);
  VIEWS.forEach((stickers, p) => stickers.forEach(({ facelet }, k) => {
    out[facelet] = shots[p][k];
  }));
  return out;
}

/** Silhouette du cube dans le cadre (hexagone, sens horaire depuis le haut). */
export const OUTLINE = [
  [-1.5, 1.5, -1.5],
  [1.5, 1.5, -1.5],
  [1.5, -1.5, -1.5],
  [1.5, -1.5, 1.5],
  [-1.5, -1.5, 1.5],
  [-1.5, 1.5, 1.5],
].map(project);
