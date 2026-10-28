// @ts-check
import { useMemo, useState } from 'react';

/**
 * Écran affiché : l’accueil et ses trois portes, Jouer, ou
 * Apprendre. `entry` dit où Apprendre s’ouvre : là où l’enfant s’était
 * arrêté (`resume`) ou sur le guide du mélange (`guide`).
 */
/**
 * @returns {[{ screen: string, entry: string }, { home: () => void, play: () => void, learn: (entry?: string) => void }]}
 */
export function useScreen() {
  const [state, setState] = useState({ screen: 'home', entry: 'resume' });
  const api = useMemo(() => ({
    home: () => setState((s) => ({ ...s, screen: 'home' })),
    play: () => setState((s) => ({ ...s, screen: 'play' })),
    learn: (entry = 'resume') => setState({ screen: 'learn', entry }),
  }), []);
  return [state, api];
}
