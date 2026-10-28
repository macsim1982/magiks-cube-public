import { useCallback, useRef } from 'react';

/**
 * Le tutoriel parle au cube par ces rappels stables (ses effets en
 * dépendent) : poser un cas et ses pièces à suivre, jouer la démo, sauter
 * d’un coup à l’autre.
 * Une lecture guidée annonce chaque tranche avant de la tourner, et le cube
 * ne répond plus au doigt ni au clavier jusqu’à la fin (`demoing`).
 */
export function useTutorialBridge({ cubeRef, puzzle, moves, scramble, setShow }) {
  const demoing = useRef(false);
  // Les pièces à suivre du cas posé, remises après chaque pose
  const following = useRef([]);

  const demo = useCallback((hooks) => {
    demoing.current = true;
    return {
      ...hooks,
      guide: true,
      onDone: () => {
        demoing.current = false;
        hooks?.onDone?.();
      },
    };
  }, []);

  const applyPose = useCallback(function pose(setup, tokens, hooks) {
    scramble.stop();
    const cube = cubeRef.current;
    if (!cube) {
      requestAnimationFrame(() => pose(setup, tokens, hooks));
      return;
    }
    cube.reset();
    demoing.current = false;
    const setupTokens = typeof setup === 'string' ? puzzle.parseAlg(setup) : setup;
    if (setupTokens?.length) cube.play(setupTokens, { instant: true, frame: puzzle.DEFAULT_FRAME });
    cube.follow(following.current);
    if (!tokens?.length) {
      moves.clear();
      return;
    }
    cube.play(tokens, { frame: puzzle.DEFAULT_FRAME, ...hooks });
    moves.replace(tokens);
  }, [cubeRef, scramble, moves, puzzle]);

  const onPose = useCallback((setup, pieces, focus) => {
    following.current = focus ?? [];
    setShow((prev) => {
      const next = pieces ?? [];
      if (prev.length === next.length && prev.every((id, i) => id === next[i])) return prev;
      return next;
    });
    // Le guide pose le mélange en cours de lecture : ne pas l’interrompre
    if (scramble.isPlaying(typeof setup === 'string' ? setup.trim() : '')) return;
    applyPose(setup);
  }, [scramble, applyPose, setShow]);

  const onPlay = useCallback((tokens, setup, hooks) => {
    if (setup != null) applyPose(setup, tokens, demo(hooks));
    else moves.playInCubeFrame(tokens, demo(hooks));
  }, [applyPose, moves, demo]);

  const onSeek = useCallback((playTokens, prefix) => {
    const cube = cubeRef.current;
    if (!cube || !playTokens?.length) return;
    cube.play(playTokens, { frame: puzzle.DEFAULT_FRAME, ...demo() });
    moves.replace(prefix);
  }, [cubeRef, moves, puzzle, demo]);

  return { demoing, onPose, onPlay, onSeek };
}
