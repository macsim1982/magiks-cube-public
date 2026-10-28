import { useCallback, useLayoutEffect, useRef } from 'react';
import { play, snapshot } from '../../lib/dom/flip';

/**
 * `run(change)` : mesure les `[data-flip]` (First), applique `change` (état
 * React), puis anime juste après le rendu (Last, Invert, Play).
 */
export function useFlip(getRoot) {
  const pending = useRef(null);

  useLayoutEffect(() => {
    const before = pending.current;
    if (!before) return;
    pending.current = null;
    const root = getRoot();
    if (root) play(root, before);
  });

  return useCallback((change) => {
    const root = getRoot();
    pending.current = root ? snapshot(root) : null;
    change();
  }, [getRoot]);
}
