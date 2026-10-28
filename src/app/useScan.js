// @ts-check
import { useMemo, useState } from 'react';

/**
 * Écran « Scanner mon cube » ouvert ou non. Le cube lu revient
 * en mélange, qu’App applique comme « Mélanger ».
 * @returns {[boolean, { open: () => void, close: () => void }]}
 */
export function useScan() {
  const [open, setOpen] = useState(false);
  const api = useMemo(() => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }), []);
  return [open, api];
}
