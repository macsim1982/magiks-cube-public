// @ts-check
import { moveIcon } from './moveIcon';

/**
 * Le dessin d’une étape vient d’un mot de son titre
 * (docs/workflow/ecrire-une-lecon.md). La première règle qui convient
 * gagne : l’ordre compte (« Placer les coins » avant « coin » seul ;
 * « sauf un coin » n’est pas une étape de coins).
 * @type {{ kind: string, any?: string[], all?: string[], none?: string[] }[]}
 */
const CHAPTER_RULES = [
  { kind: 'notation', any: ['notation'] },
  { kind: 'wait', any: ['attente', 'recherche'] },
  { kind: 'short', any: ['coup'] },
  { kind: 'centers', any: ['centre'] },
  { kind: 'twist', any: ['rebond'] },
  { kind: 'twist', all: ['orient', 'coin'] },
  { kind: 'corners', all: ['plac', 'coin'] },
  { kind: 'belge', any: ['belge', 'ligne', 'étage', 'etage'] },
  { kind: 'corners', all: ['coin'], none: ['sauf'] },
  { kind: 'cross', any: ['blanche', 'première', 'premiere'] },
  { kind: 'edges', any: ['arêt', 'aret', 'chaise'] },
  { kind: 'yellow', any: ['croix', 'jaune'] },
];

/**
 * @param {string} text
 * @param {{ any?: string[], all?: string[], none?: string[] }} rule
 */
const matches = (text, { any = [], all = [], none = [] }) => (
  (any.length === 0 || any.some((word) => text.includes(word)))
  && all.every((word) => text.includes(word))
  && !none.some((word) => text.includes(word))
);

/**
 * Le genre d’une étape, pour son icône : notation, wait, short, centers,
 * twist, corners, belge, cross, edges, yellow, ou step faute de mot connu.
 * @param {string} title
 * @returns {string}
 */
export function chapterKind(title) {
  const text = title.toLowerCase();
  return CHAPTER_RULES.find((rule) => matches(text, rule))?.kind ?? 'step';
}

/** Les couleurs qu’un nom de cas peut citer, dans l’ordre de la pastille. */
export const COLOR_WORDS = ['blanc', 'jaune', 'rouge', 'orange', 'vert', 'bleu'];

/** Un mot connu dans le nom d’un cas : son dessin. */
const CASE_WORDS = [
  { word: 'rebond', mark: { kind: 'icon', name: 'twist' } },
  { word: 'curieux', mark: { kind: 'cube', picto: 'corners' } },
  { word: 'chaise', mark: { kind: 'icon', name: 'edges' } },
  { word: 'belge', mark: { kind: 'cube', picto: 'belge' } },
];

/**
 * @typedef {{ kind: 'colors', colors: string[] }
 *   | { kind: 'icon', name: string }
 *   | { kind: 'cube', picto: string }
 *   | { kind: 'move', move: string }
 *   | { kind: 'glyph', text: string }
 *   | { kind: 'chapter', chapter: string }} CaseMark
 */

/**
 * La marque d’un cas sur la carte d’étape : les couleurs qu’il cite, sinon
 * un mot connu, sinon son premier coup, sinon le genre de son nom.
 * @param {{ label: string, alg: string }} item
 * @returns {CaseMark}
 */
export function caseMark({ label, alg }) {
  const text = label.toLowerCase();
  const colors = COLOR_WORDS.filter((color) => text.includes(color));
  if (colors.length) return { kind: 'colors', colors };
  const known = CASE_WORDS.find(({ word }) => text.includes(word));
  if (known) return /** @type {CaseMark} */ (known.mark);
  const moves = alg.split(' ').filter(Boolean);
  // Un seul coup (leçon Notation) : on le montre sur le cube
  if (moves.length === 1 && moveIcon(moves[0])) return { kind: 'move', move: moves[0] };
  if (moves.length) return { kind: 'glyph', text: moves[0] };
  return { kind: 'chapter', chapter: chapterKind(label) };
}
