// @ts-check
import { statesEqual } from '../puzzles/core/state';

/**
 * Mode « À toi » (coup par coup) : le cube montre un coup, l’enfant le refait,
 * même quand tout le cube tourne.
 * Fonctions pures : machine d’état, verdict sur un coup, mots pour le dire.
 */

const FACES = {
  R: 'la face de droite',
  L: 'la face de gauche',
  U: 'le dessus',
  D: 'le dessous',
  F: 'la face devant toi',
  B: 'la face de derrière',
  M: 'la tranche du milieu, verticale',
  E: 'la tranche du milieu, à plat',
  S: 'la tranche du milieu, face à toi',
};

/**
 * Tout le cube tourne (x, y, z).
 * @param {string} token
 */
export function isRotation(token) {
  return /^[xyz]/.test(token);
}

/**
 * Glissé à deux doigts de chaque rotation (`puzzles/core/gesture.js`) :
 * le coup, puis son contraire.
 * @type {Record<string, [string, string]>}
 */
const SLIDE = {
  y: ['vers la gauche', 'vers la droite'],
  x: ['en diagonale ↗', 'en diagonale ↙'],
  z: ['en diagonale ↘', 'en diagonale ↖'],
};

/**
 * Comment tourner tout le cube, en une phrase courte : deux
 * doigts sur écran tactile, une touche au clavier. Un demi-tour : deux
 * quarts, ou un grand geste.
 * @param {string} token rotation x, y ou z
 * @param {{ touch: boolean }} input écran tactile sans clavier
 */
export function rotationHow(token, { touch }) {
  const half = token.endsWith('2');
  const back = token.endsWith("'");
  if (touch) {
    const [forward, backward] = SLIDE[token[0]];
    return `Glisse 2 doigts ${back ? backward : forward}${half ? ', 2 fois' : ''}.`;
  }
  const key = token[0].toUpperCase();
  if (half) return `Appuie 2 fois sur ${key}.`;
  return back ? `Appuie sur Espace + ${key}.` : `Appuie sur ${key}.`;
}

/**
 * Le coup en mots, pour 10–12 ans.
 * @param {string} token
 * @returns {{ face: string, turn: string, arrow: string }}
 */
export function describeMove(token) {
  const face = isRotation(token) ? 'tout le cube' : FACES[token[0]] ?? token;
  if (token.endsWith('2')) return { face, turn: 'un demi-tour', arrow: '⟳' };
  if (token.endsWith("'")) return { face, turn: 'dans l’autre sens', arrow: '↺' };
  return { face, turn: 'comme les aiguilles d’une montre', arrow: '↻' };
}

/**
 * Verdict sur l’état du cube après le(s) coup(s) de l’enfant.
 * On compare des états, pas des lettres : un coup juste fait d’un autre
 * geste compte. Pour un demi-tour, un quart dans un sens ou l’autre est
 * « en route » (`half`).
 * @param {import('../puzzles/types.js').PuzzleDefinition} puzzle
 * @param {{ before: import('../puzzles/core/state.js').PuzzleState, after: import('../puzzles/core/state.js').PuzzleState }} move
 *   l’état avant le geste de l’enfant, et après
 * @param {string} token
 * @returns {'ok' | 'half' | 'wrong'}
 */
export function judgeMove(puzzle, { before, after }, token) {
  const play = (t) => puzzle.apply(before, puzzle.toTurn(t, puzzle.DEFAULT_FRAME));
  if (statesEqual(after, play(token))) return 'ok';
  if (token.endsWith('2')) {
    const base = token.slice(0, -1);
    if (statesEqual(after, play(base)) || statesEqual(after, play(`${base}'`))) return 'half';
  }
  return 'wrong';
}

/**
 * `hidden` : le défi, sans flèche ; elle ne vient que pour le
 * coup où l’enfant demande un indice (`hint`).
 * @typedef {{
 *   at: number,
 *   misses: number,
 *   status: 'demo' | 'wait' | 'half' | 'done',
 *   last: 'ok' | 'wrong' | null,
 *   hidden?: boolean,
 *   hint?: boolean,
 * }} Practice
 */

/** @param {number} length @param {{ hidden?: boolean }} [options] @returns {Practice} */
export function startPractice(length, { hidden = false } = {}) {
  if (!length) return { at: 0, misses: 0, status: 'done', last: null, hidden, hint: false };
  return { at: 0, misses: 0, status: hidden ? 'wait' : 'demo', last: null, hidden, hint: false };
}

/**
 * La flèche est-elle montrée pour ce coup ? Toujours, sauf au défi sans indice.
 * @param {Practice} practice
 */
export const showsArrow = (practice) => !practice.hidden || Boolean(practice.hint);

/**
 * L’enfant demande la flèche (« Revoir » ou, au défi, « Un indice ») : le coup se remontre.
 * @param {Practice} practice
 * @returns {Practice}
 */
export const askHint = (practice) => ({ ...practice, status: 'demo', hint: true });

// Après un coup, juste ou faux : on remontre la flèche, ou au défi on attend sans elle
const after = (p) => (p.hidden ? 'wait' : 'demo');

// Le coup de l’enfant compte dans ces états : démo (il peut jouer pendant la flèche), attente, demi-tour en route
const LIVE = ['demo', 'wait', 'half'];

/** @type {Record<string, (practice: Practice, length: number) => Practice>} */
const PRACTICE_STEPS = {
  shown: (p) => (p.status === 'demo' ? { ...p, status: 'wait' } : p),
  // L’enfant peut jouer pendant la démo (la flèche s’efface)
  half: (p) => (p.status === 'wait' || p.status === 'demo' ? { ...p, status: 'half' } : p),
  ok: (p, length) => {
    if (!LIVE.includes(p.status)) return p;
    const at = p.at + 1;
    return { ...p, at, misses: 0, status: at >= length ? 'done' : after(p), last: 'ok', hint: false };
  },
  wrong: (p) => (LIVE.includes(p.status) ? { ...p, misses: p.misses + 1, status: after(p), last: 'wrong' } : p),
};

/**
 * demo → (démo jouée) wait → ok : coup suivant en demo, ou done
 *                         → half : on attend la fin du demi-tour
 *                         → wrong : le cube annule, on remontre (demo)
 * @param {Practice} practice
 * @param {{ type: 'shown' | 'ok' | 'half' | 'wrong' }} event
 * @param {number} length
 * @returns {Practice}
 */
export function nextPractice(practice, event, length) {
  return PRACTICE_STEPS[event.type]?.(practice, length) ?? practice;
}
