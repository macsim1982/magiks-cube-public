// @ts-check

/**
 * Quarts permis au glissé à un doigt : deux (R2) si deux pas font au plus un
 * demi-tour, sinon un seul. Skewb : deux tiers de tour = le coup inverse.
 * @param {number} unit angle d’un pas du puzzle (rad)
 */
export const dragSteps = (unit) => (2 * unit <= Math.PI + 1e-9 ? 2 : 1);

/**
 * Angle où se caler en lâchant : 0 sous `commit` (le cube revient), sinon
 * le pas le plus proche, au moins un, `steps` au plus.
 * @param {number} angle angle glissé (rad, signé)
 * @param {{ unit: number, commit: number, steps: number }} options
 */
export function snapDrag(angle, { unit, commit, steps }) {
  if (Math.abs(angle) < commit) return 0;
  const count = Math.min(steps, Math.max(1, Math.round(Math.abs(angle) / unit)));
  return Math.sign(angle) * count * unit;
}
