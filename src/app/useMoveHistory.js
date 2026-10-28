import { useMemo, useRef, useState } from 'react';

/**
 * Historique `[{ token, frame }]` des coups joués, et le jeu sur le cube.
 * Le frame est figé au moment du coup : l’annulation reste juste même si la
 * caméra a tourné. Les fonctions retournées sont stables pour un puzzle.
 */
export function useMoveHistory(cubeRef, puzzle) {
  const [history, setHistory] = useState([]);
  const current = useRef(history);

  const api = useMemo(() => {
    const commit = (update) => {
      const next = update(current.current);
      if (next === current.current) return;
      current.current = next;
      setHistory(next);
    };
    const entries = (tokens, frame) => tokens.map((token) => ({ token, frame }));

    return {
      /** Coups utilisateur, dans le repère de la vue courante. */
      play(tokens, { onDone } = {}) {
        const cube = cubeRef.current;
        if (!cube || !tokens?.length) return;
        const frame = cube.getFrame();
        cube.play(tokens, { frame, onDone });
        commit((h) => [...h, ...entries(tokens, frame)]);
      },
      /** Coups du tutoriel, dans le repère du cube. `onStep` / `onDone` : suivi de lecture. */
      playInCubeFrame(tokens, { onStep, onDone, guide = false } = {}) {
        const cube = cubeRef.current;
        if (!cube || !tokens?.length) return;
        cube.play(tokens, { frame: puzzle.DEFAULT_FRAME, onStep, onDone, guide });
        commit((h) => [...h, ...entries(tokens, puzzle.DEFAULT_FRAME)]);
      },
      /** Coup déjà joué (drag souris) : seulement l’inscrire. */
      record(token, frame = puzzle.DEFAULT_FRAME) {
        commit((h) => [...h, { token, frame }]);
      },
      undo({ onDone } = {}) {
        const last = current.current.at(-1);
        if (!last) return;
        cubeRef.current?.play([puzzle.invert(last.token)], { frame: last.frame, onDone });
        commit((h) => h.slice(0, -1));
      },
      /** Remplace l’historique (pose du tutoriel), sans jouer. */
      replace(tokens) {
        commit(() => entries(tokens, puzzle.DEFAULT_FRAME));
      },
      clear() {
        commit((h) => (h.length ? [] : h));
      },
    };
  }, [cubeRef, puzzle]);

  return [history, api];
}
