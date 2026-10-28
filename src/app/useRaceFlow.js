import { useCallback } from 'react';

/**
 * La course côté app : le cube résolu arrête le chrono ; la
 * couverture lève l’inspection, le mélange se finit d’un coup.
 */
export function useRaceFlow({ cubeRef, puzzle, raceApi, scramble }) {
  const finishIfSolved = useCallback(() => {
    if (raceApi.phase() !== 'run' || !puzzle.capabilities.race) return;
    const state = cubeRef.current?.getState();
    if (state && puzzle.isSolved(state)) raceApi.finish();
  }, [cubeRef, raceApi, puzzle]);

  const beginInspection = useCallback(() => {
    if (raceApi.phase() !== 'cover') return;
    scramble.finish();
    raceApi.inspect();
  }, [raceApi, scramble]);

  return { finishIfSolved, beginInspection };
}
