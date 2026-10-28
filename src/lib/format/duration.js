// @ts-check
const pad = (value) => String(value).padStart(2, '0');

/**
 * Une durée de chrono : minutes, secondes et centièmes (« 1:05,32 »).
 * Une durée négative vaut zéro.
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const clamped = Math.max(0, ms);
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  const centis = Math.floor((clamped % 1000) / 10);
  return `${minutes}:${pad(seconds)},${pad(centis)}`;
}
