// @ts-check
import { QUARTER_DURATION } from '../puzzles';

/**
 * Intro de la première visite : le cube Mirror, mélangé, se
 * résout tout seul pendant que la caméra tourne autour, puis passe en
 * couleurs. Ce module est pur : décision et tempo.
 */

/** Durées de la séquence (ms, sauf `solve` en s). */
export const INTRO = {
  /** Coups du mélange, rejoués à l’envers */
  moves: 20,
  /** Fondu du loader avant le premier coup */
  lead: 600,
  /** Résolution complète */
  solve: 5.4,
  /** Trajet caméra : de l’ouverture à la vue de repos, un peu après le dernier coup */
  camera: 6300,
  /** Retour de la caméra quand on passe l’intro */
  glide: 600,
  /** Mirror → couleurs (0,5 s) puis boutons (0,45 s) */
  outro: 1000,
  /** Rideau avant de rejouer l’intro */
  veil: 350,
  /** Sous le rideau : le temps que le cube redevienne Mirror */
  settle: 550,
};

// Les trois derniers coups ralentissent, du dernier au troisième : le « clac » final
const SLOW_END = [3, 2.2, 1.6];

/**
 * @param {{ search?: string, seen?: boolean, reducedMotion?: boolean }} env
 * `?intro` dans l’adresse la force (démo) ; sinon une seule fois, jamais
 * avec « réduire les animations ».
 */
export function shouldPlayIntro({ search = '', seen = false, reducedMotion = false }) {
  if (new URLSearchParams(search).has('intro')) return true;
  return !seen && !reducedMotion;
}

/** Poids d’un coup : posé au début, vif au milieu, lent à la fin. */
function tempo(index, count) {
  const fromEnd = count - 1 - index;
  if (fromEnd < SLOW_END.length) return SLOW_END[fromEnd];
  return 0.8 + 0.6 * (1 - index / Math.max(1, count - 1)) ** 3;
}

/**
 * Vitesse de chaque coup pour que la résolution dure `seconds`.
 *
 * @param {import('../puzzles/types.js').PuzzleDefinition} puzzle
 * @param {string[]} tokens
 * @param {number} seconds
 * @returns {{ token: string, duration: number, speed: number }[]}
 */
export function introPlan(puzzle, tokens, seconds) {
  const quarters = tokens.map((token) => {
    const turn = puzzle.toTurn(token, puzzle.DEFAULT_FRAME);
    return Math.max(1, Math.round(Math.abs(turn?.angle ?? puzzle.angle) / puzzle.angle));
  });
  // Un demi-tour prend un peu plus de temps qu’un quart, pas le double
  const weights = tokens.map((_, i) => tempo(i, tokens.length) * Math.sqrt(quarters[i]));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return tokens.map((token, i) => {
    const duration = (seconds * weights[i]) / total;
    return { token, duration, speed: (QUARTER_DURATION * quarters[i]) / duration };
  });
}
