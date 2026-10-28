// @ts-check
// L’inspection du défi chrono, comme en compétition : 15 s pour regarder le
// cube, un bip à 8 s, deux à 12 s, puis le chrono part tout seul.

/** @typedef {'calm' | 'warn' | 'critical'} InspectionLevel */

export const INSPECT_MS = 15000;

/** @type {InspectionLevel[]} */
const ORDER = ['calm', 'warn', 'critical'];

/** @type {{ level: InspectionLevel, from: number }[]} */
const THRESHOLDS = [
  { level: 'critical', from: 12000 },
  { level: 'warn', from: 8000 },
];

/** Les bips de chaque niveau : fréquence (Hz) et décalage (s). */
export const INSPECTION_BEEPS = {
  calm: [],
  warn: [{ frequency: 660, offset: 0 }],
  critical: [{ frequency: 880, offset: 0 }, { frequency: 880, offset: 0.18 }],
};

/**
 * @param {number} elapsed ms depuis le début de l’inspection
 * @returns {InspectionLevel}
 */
export function inspectionLevel(elapsed) {
  return THRESHOLDS.find(({ from }) => elapsed >= from)?.level ?? 'calm';
}

/**
 * Les secondes affichées : 15, 14… jusqu’à 1, jamais 0.
 * @param {number} elapsed
 */
export function secondsLeft(elapsed) {
  return Math.max(1, Math.ceil(Math.max(0, INSPECT_MS - elapsed) / 1000));
}

/**
 * Les niveaux franchis en passant de `from` à `to`, dans l’ordre : chacun
 * sonne ses bips. Aucun en redescendant (nouvelle inspection).
 * @param {InspectionLevel} from
 * @param {InspectionLevel} to
 * @returns {InspectionLevel[]}
 */
export function crossedLevels(from, to) {
  return ORDER.slice(ORDER.indexOf(from) + 1, ORDER.indexOf(to) + 1);
}
