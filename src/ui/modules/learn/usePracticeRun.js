import { useCallback, useEffect, useState } from 'react';
import { askHint, nextPractice, showsArrow, startPractice } from '../../../learn/practice';

/**
 * À toi : l’enfant refait la formule, coup
 * par coup. La flèche montre le coup (`demo`), puis attend le sien (`wait`,
 * et `half` pour le 2e quart d’un demi-tour). `practice.key` : l’état vaut
 * pour ce cas-là, pas pour le précédent. `api` : la flèche sur le cube.
 * `hidden` : le défi, sans flèche sauf pour un indice.
 */
export function usePracticeRun({ active, api, tokens, algKey, show, hidden = false }) {
  const length = tokens.length;
  const [practice, setPractice] = useState(() => ({ key: '', replays: 0, ...startPractice(0) }));
  const token = tokens[practice.at];
  const solved = practice.key === algKey && practice.status === 'done';
  const arrow = showsArrow(practice);

  // 🎯 À toi : montrer le coup, puis attendre celui de l’enfant
  useEffect(() => {
    if (!active || !api || !token || practice.key !== algKey) return;
    const at = practice.at;
    const step = (type) => setPractice((p) => (p.key === algKey && p.at === at ? { ...p, ...nextPractice(p, { type }, length) } : p));
    if (practice.status === 'demo') {
      // L’enfant peut déjà jouer pendant que la flèche se dessine ; tout le cube aussi
      api.expect(token, step);
      api.show(token, `${algKey}:${at}:${practice.misses}:${practice.replays}`, () => step('shown'));
    } else if (practice.status === 'wait' || practice.status === 'half') {
      // La flèche reste jusqu’au coup de l’enfant, et pour le 2e quart d’un demi-tour
      api.expect(token, step, { quiet: !arrow });
    }
  }, [active, api, token, practice.key, practice.at, practice.status, practice.misses, practice.replays, arrow, algKey, length]);

  // Réussi : les pièces arrivées s’entourent de vert sur le cube
  useEffect(() => {
    if (active && solved) api?.celebrate?.(show);
  }, [active, solved, api, show]);

  const reset = useCallback(() => setPractice({ key: algKey, replays: 0, ...startPractice(length, { hidden }) }), [algKey, length, hidden]);
  const replay = () => setPractice((p) => ({ ...askHint(p), replays: p.replays + 1 }));

  return { practice, token, solved, reset, replay };
}
