import { useCallback, useRef, useState } from 'react';
import { invertAlg } from '../../../puzzles/cube/notation';

/**
 * Regarder : la démo du cas, ses lettres allumées au fil des
 * coups. `frame` : les coups déjà joués. Une nouvelle lecture rend muettes
 * les précédentes (`run`). `onPlay(tokens, pose, hooks)` joue sur le cube ;
 * `onSeek(tokens, played)` y saute d’un coup à un autre. `done` vaut pour
 * le cas `caseId` seulement : un nouveau cas ne l’hérite pas.
 */
export function useReadPlayback({ caseId, tokens, pose, onPlay, onSeek }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [doneFor, setDoneFor] = useState(null);
  const setDone = (value) => setDoneFor(value ? caseId : null);
  const run = useRef(0);

  // Nouveau cas ou nouvelle pose : on repart du début, les lectures en cours sont ignorées
  const restart = useCallback(() => {
    run.current += 1;
    setFrame(0);
    setPlaying(false);
    setDoneFor(null);
  }, []);

  const seek = (to) => {
    const next = Math.max(0, Math.min(tokens.length, to));
    if (next === frame) return;
    const playTokens = next > frame
      ? tokens.slice(frame, next)
      : invertAlg(tokens.slice(next, frame));
    setFrame(next);
    setDone(next >= tokens.length);
    onSeek?.(playTokens, tokens.slice(0, next));
  };

  // Lettres allumées au fil des coups, « Bravo » à la fin
  const play = () => {
    if (!tokens.length) return;
    const fromStart = frame === 0 || frame >= tokens.length;
    const id = run.current + 1;
    run.current = id;
    setPlaying(true);
    setDone(false);
    if (fromStart) setFrame(0);
    const hooks = {
      onStep: () => {
        if (run.current === id) setFrame((f) => f + 1);
      },
      onDone: () => {
        if (run.current !== id) return;
        setPlaying(false);
        setDone(true);
      },
    };
    if (fromStart) onPlay(tokens, pose, hooks);
    else onPlay(tokens.slice(frame), undefined, hooks);
  };

  return { frame, playing, done: doneFor === caseId, restart, seek, play };
}
