// @ts-check
import { toOklab } from './color';
import { VIEWS } from './layout';

/**
 * Viser : le cube est-il bien dans le cadre ? Lu sur l’aperçu,
 * 5 fois par seconde, pour prendre la photo tout seul :
 * - presque toutes les cases ressemblent à un sticker : une seule couleur,
 *   ni le plastique noir ni une ombre ;
 * - les trois centres ont la couleur attendue pour cette photo ;
 * - l’image ne bouge plus.
 */

export const AIM = {
  /** Part d’une case (`patchStats`) qui doit être de la même couleur : un bord de joint passe */
  share: 0.6,
  /**
   * Clarté OKLab en dessous de laquelle c’est le plastique noir (≈ 0,17).
   * Un bleu sur la face à l’ombre descend vers 0,3 : il doit rester un sticker
   */
  dark: 0.24,
  /** Cases qui doivent ressembler à un sticker : des doigts peuvent en cacher 3 */
  cells: 24,
  /** Écart moyen (OKLab) entre deux aperçus en dessous duquel rien ne bouge */
  steady: 0.035,
  /** Durée (ms) sans bouger avant la photo */
  hold: 1400,
};

/**
 * Famille de couleur, assez large pour toutes les lumières. Le rouge et
 * l’orange restent ensemble (« chaud ») : la lampe les confond, et la
 * vraie lecture se fait après, contre les centres.
 * @param {number[]} rgb 0..255
 * @returns {'white' | 'grey' | 'yellow' | 'warm' | 'green' | 'blue' | 'other'}
 */
export function colourFamily(rgb) {
  const [lightness, a, b] = toOklab(rgb);
  if (Math.hypot(a, b) < 0.06) return lightness > 0.6 ? 'white' : 'grey';
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  if (hue > 75 && hue <= 115) return 'yellow';
  if (hue > -20 && hue <= 75) return 'warm';
  if (hue > 115 && hue <= 200) return 'green';
  if (hue <= -20 && hue > -160) return 'blue';
  return 'other';
}

/** Centres attendus sur chaque photo (`layout.js`) : couleurs standard du cube */
const CENTRES = [
  { top: 'white', left: 'green', right: 'warm' },
  { top: 'yellow', left: 'warm', right: 'blue' },
];

/**
 * @typedef {{ rgb: number[], share: number }} Cell lecture d’une case
 */

/**
 * @param {Cell[]} cells les 27 lectures, dans l’ordre de `VIEWS[photo]`
 * @param {number} photo 0 ou 1
 * @returns {{ stickers: number, centres: boolean, aimed: boolean }}
 */
export function aimAt(cells, photo) {
  let stickers = 0;
  for (const { rgb, share } of cells) {
    if (share >= AIM.share && toOklab(rgb)[0] >= AIM.dark) stickers += 1;
  }
  const centres = VIEWS[photo].every((sticker, k) => (
    !sticker.centre || colourFamily(cells[k].rgb) === CENTRES[photo][sticker.side]
  ));
  return { stickers, centres, aimed: stickers >= AIM.cells && centres };
}

/**
 * Mouvement entre deux aperçus : écart moyen des cases (OKLab).
 * `Infinity` sans aperçu précédent.
 * @param {Cell[] | null} previous
 * @param {Cell[]} current
 */
export function motion(previous, current) {
  if (!previous) return Infinity;
  let sum = 0;
  current.forEach((cell, k) => {
    const p = toOklab(previous[k].rgb);
    const q = toOklab(cell.rgb);
    sum += Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  });
  return sum / current.length;
}
