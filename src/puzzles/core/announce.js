// @ts-check

/**
 * L’annonce d’un cas, en secondes après la pose : la
 * pièce à suivre s’allume tout de suite, sa place d’arrivée apparaît en
 * fondu (`in` → `shown`), reste (`shown` → `out`), puis s’efface (`out` → `end`).
 */
export const ANNOUNCE = { in: 0.6, shown: 1, out: 2.4, end: 3 };

/**
 * L’opacité du fantôme de la place d’arrivée, `t` secondes après la pose ;
 * `null` une fois l’annonce finie.
 * @param {number} t
 * @returns {number | null}
 */
export function ghostFade(t) {
  if (t >= ANNOUNCE.end) return null;
  if (t < ANNOUNCE.in) return 0;
  if (t < ANNOUNCE.shown) return (t - ANNOUNCE.in) / (ANNOUNCE.shown - ANNOUNCE.in);
  if (t < ANNOUNCE.out) return 1;
  return (ANNOUNCE.end - t) / (ANNOUNCE.end - ANNOUNCE.out);
}
