import { useSyncExternalStore } from 'react';

/** `true` tant que la media query `query` s’applique. */
export function useMedia(query) {
  return useSyncExternalStore(
    (notify) => {
      const list = matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}
