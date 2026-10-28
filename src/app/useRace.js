import { useMemo, useRef, useState } from 'react';
import { nextRace } from './race';

/**
 * État de course + lecture synchrone de la phase : les callbacks de
 * PuzzleView (onDone, onTurn) arrivent hors du cycle React.
 * Les fonctions retournées sont stables.
 */
export function useRace() {
  const [race, setRace] = useState(null);
  const current = useRef(null);

  const api = useMemo(() => {
    const dispatch = (action) => {
      const next = nextRace(current.current, action, performance.now());
      if (next === current.current) return;
      current.current = next;
      setRace(next);
    };
    return {
      phase: () => current.current?.phase ?? null,
      start: (moves) => dispatch({ type: 'start', moves }),
      inspect: () => dispatch({ type: 'inspect' }),
      solve: () => dispatch({ type: 'solve' }),
      finish: () => dispatch({ type: 'finish' }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, []);

  return [race, api];
}
