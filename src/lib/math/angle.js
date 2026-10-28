// @ts-check
/**
 * L’angle le plus proche de `angle` parmi `origin + k·step` : l’aimant
 * d’orbite garde la caméra à un quart de tour de la vue de repos.
 * @param {number} angle
 * @param {number} origin
 * @param {number} step
 */
export function snapAngle(angle, origin, step) {
  return origin + Math.round((angle - origin) / step) * step;
}
