// @ts-check
/** Vecteurs [x, y, z] purs — pas de Three.js. */

/** @param {number[]} a @param {number[]} b */
export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** @param {number[]} v */
export function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

/** @param {number[]} a @param {number[]} b */
export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** `a + b·k` : le point `a`, déplacé de `k` fois `b` */
export function addScaled(a, b, k) {
  return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
}
