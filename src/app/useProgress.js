import { useEffect, useMemo, useState } from 'react';
import { mark, PROGRESS_KEY, readProgress, writeProgress } from '../learn/progress';

function load() {
  try {
    return readProgress(localStorage.getItem(PROGRESS_KEY));
  } catch {
    return new Set();
  }
}

/**
 * Cas et étapes validés, gardés d’une visite à l’autre.
 * `done` : `Set` de clés (`learn/progress.js`) ; `api.mark(key)` stable.
 */
export function useProgress() {
  const [done, setDone] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, writeProgress(done));
    } catch {
      // Navigation privée : les coches durent jusqu’à la fin de la visite
    }
  }, [done]);

  const api = useMemo(() => ({
    mark: (key) => setDone((current) => mark(current, key)),
  }), []);

  return [done, api];
}
