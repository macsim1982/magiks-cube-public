// @ts-check
import { QUARTER_DURATION } from './timing';

/** @typedef {import('../types.js').Turn} Turn */

/**
 * Un tour à animer, complété : vitesse 1, de 0 à son angle, joué par la
 * file (`queue`), avec l’indice au-dessus du cube et sans guide.
 * @param {Turn & { speed?: number, from?: number, to?: number, source?: string, hints?: boolean, guide?: boolean } & Record<string, any>} input
 */
export function withTurnDefaults(input) {
  return {
    speed: 1,
    from: 0,
    to: input.angle,
    source: 'queue',
    hints: true,
    guide: false,
    ...input,
  };
}

/**
 * Le tour logique qu’un tour animé laisse sur le cube : son angle d’arrivée
 * et le nombre de quarts (signé) quand le puzzle ne le donne pas.
 * @param {{ axis?: string, layer?: number | null, tip?: number[], to: number, steps?: number }} turn
 */
export function logicalTurn(turn) {
  return {
    axis: turn.axis,
    layer: turn.layer,
    tip: turn.tip,
    angle: turn.to,
    steps: turn.steps ?? (turn.to > 0 ? 1 : -1),
  };
}

/**
 * Le tour compte : il arrive au moins à mi-chemin d’un pas (`unit`), sinon
 * la couche est revenue à sa place.
 * @param {{ to: number }} turn
 * @param {number} unit
 */
export function commits(turn, unit) {
  return Math.abs(turn.to) >= unit * 0.5;
}

/**
 * Durée de l’animation (s) : un quart de tour dure QUARTER_DURATION à
 * vitesse 1, jamais moins de 0,12 s.
 * @param {{ from: number, to: number, speed: number }} turn
 * @param {number} unit
 */
export function turnDuration({ from, to, speed }, unit) {
  return Math.max(0.12, QUARTER_DURATION * (Math.abs(to - from) / unit)) / speed;
}

/**
 * La file d’une formule jouée : chaque tour de 0 à son angle, avec les
 * réglages de la lecture ; `onDone` part avec le dernier.
 * @param {Turn[]} turns
 * @param {{ speed: number, hints: boolean, guide: boolean, onStep?: Function, onDone?: Function }} options
 */
export function queuedTurns(turns, { speed, hints, guide, onStep, onDone }) {
  return turns.map((turn, i) => ({
    ...turn,
    speed,
    hints,
    guide,
    onStep,
    onDone: i === turns.length - 1 ? onDone : undefined,
    to: turn.angle,
    from: 0,
  }));
}

/** Douceur de l’animation : lente au départ et à l’arrivée (t de 0 à 1). */
export const smoothstep = (t) => t * t * (3 - 2 * t);
