// @ts-check

/**
 * Clavier, pur : `puzzle.keys`, Espace tenue + lettre = inverse, Retour
 * arrière = annuler, Espace seule = la course avance. e.key respecte la
 * disposition (AZERTY comme QWERTY).
 */

/**
 * Espace enfoncée (`held`) ; `used` : une autre touche a servi pendant
 * l’appui, Espace n’était donc pas seule.
 * @typedef {{ held: boolean, used: boolean }} Space
 */

/** @type {Space} */
export const SPACE_UP = Object.freeze({ held: false, used: false });

/**
 * Coup joué par une touche, ou `null`.
 * @param {{ keys: Record<string, string>, invert: (token: string) => string }} puzzle
 * @param {string} key `e.key`
 * @param {boolean} spaceHeld
 * @returns {string | null}
 */
export function keyMove(puzzle, key, spaceHeld) {
  const move = puzzle.keys[key.toLowerCase()] ?? puzzle.keys[key];
  if (!move) return null;
  return spaceHeld ? puzzle.invert(move) : move;
}

/**
 * Touche enfoncée : ce qu’elle fait, et Espace après elle.
 * @param {Parameters<typeof keyMove>[0]} puzzle
 * @param {Space} space
 * @param {string} key `e.key`
 * @returns {{ space: Space, action: { type: 'undo' } | { type: 'move', token: string } | null }}
 */
export function keyDown(puzzle, space, key) {
  if (key === ' ') return { space: { held: true, used: false }, action: null };
  const next = space.held ? { held: true, used: true } : space;
  if (key === 'Backspace') return { space: next, action: { type: 'undo' } };
  const token = keyMove(puzzle, key, space.held);
  return { space: next, action: token ? { type: 'move', token } : null };
}

/**
 * Une touche qui appuie sur le bouton qui a le focus : elle reste au bouton.
 * Les lettres, elles, tournent le cube même après un clic sur un bouton.
 * @param {string} key `e.key`
 */
export const pressesButton = (key) => key === ' ' || key === 'Enter';

/**
 * Espace lâchée : `true` si elle était seule, la course avance.
 * @param {Space} space
 */
export const spaceAlone = (space) => space.held && !space.used;
