import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Un menu ou une bulle ouverts (`open`) se ferment d’un geste ailleurs : un
 * appui hors de `ref`, ou Échap. `onDismiss` peut changer à chaque rendu.
 */
export function useDismiss(ref, open, onDismiss) {
  const latest = useRef(onDismiss);
  useLayoutEffect(() => {
    latest.current = onDismiss;
  });

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!ref.current?.contains(event.target)) latest.current();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') latest.current();
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [ref, open]);
}
