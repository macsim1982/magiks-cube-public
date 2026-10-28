// @ts-check
// Vérifier les couleurs lues : les règles et les phrases, sans React

export const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

/** Une case lue moins sûre que ça : en pointillés, à vérifier */
export const DOUBTFUL = 0.45;

const FAULTS = {
  count: 'Il faut 9 cases de chaque couleur. Touche celles qui sont fausses pour les corriger.',
  corner: 'Ce coin n’existe pas sur un vrai cube : vérifie ses couleurs.',
  edge: 'Cette arête n’existe pas sur un vrai cube : vérifie ses couleurs.',
  twist: 'Un coin est tourné sur lui-même. Vérifie les coins… ou remets-le droit à la main.',
  flip: 'Une arête est retournée. Vérifie les arêtes… ou remets-la à l’endroit à la main.',
  parity: 'Deux pièces sont échangées. Vérifie les couleurs.',
};

/**
 * La phrase sous les deux vues.
 * @param {{ ok: boolean, fault?: string }} verdict de `verifyFacelets`
 * @param {{ failed: boolean, solved: boolean, doubtful: boolean }} state
 * @returns {string}
 */
export function verdictText(verdict, { failed, solved, doubtful }) {
  if (failed) return 'Le calcul n’a pas marché. Réessaie.';
  if (!verdict.ok) return FAULTS[verdict.fault ?? 'count'];
  if (solved) return 'Ton cube est déjà résolu. Bravo !';
  return doubtful ? 'Ça a l’air bon ! Vérifie les cases en pointillés.' : 'Tout est bon !';
}

/**
 * Une case repeinte par l’enfant : sa lettre change, elle n’est plus douteuse.
 * @param {{ facelets: string, doubt: number[] }} read
 * @param {number} facelet
 * @param {string} letter
 */
export function repaint(read, facelet, letter) {
  return {
    facelets: read.facelets.slice(0, facelet) + letter + read.facelets.slice(facelet + 1),
    doubt: read.doubt.map((d, i) => (i === facelet ? 0 : d)),
  };
}
