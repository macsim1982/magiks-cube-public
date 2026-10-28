import { useMemo, useRef } from 'react';

/**
 * Lecture animée du mélange. Refs seulement : rien à afficher, mais la
 * course (fin forcée à l’inspection) et le tutoriel (pose déjà en cours)
 * doivent savoir où en est la lecture.
 */
export function useScramble(cubeRef) {
  const playback = useRef({ moves: [], at: 0, frame: null, playing: false });

  return useMemo(() => ({
    /** `track` : suivre la lecture (course ou tutoriel) ; sinon jouer seulement. */
    start(moves, frame, track) {
      const p = playback.current;
      Object.assign(p, { moves, at: 0, frame, playing: track });
      cubeRef.current?.play(moves, {
        speed: 3,
        hints: false,
        frame,
        onStep: () => {
          p.at += 1;
          if (p.at >= moves.length) p.playing = false;
        },
      });
    },
    /** Termine d’un coup la lecture en cours. */
    finish() {
      const p = playback.current;
      if (!p.playing) return;
      const cube = cubeRef.current;
      const rest = p.moves.slice(p.at);
      cube?.cancel();
      if (rest.length) cube?.play(rest, { instant: true, hints: false, frame: p.frame });
      p.playing = false;
      p.at = p.moves.length;
    },
    stop() {
      playback.current.playing = false;
    },
    /** Le mélange `alg` est-il celui en train d’être joué ? */
    isPlaying(alg) {
      const p = playback.current;
      return p.playing && alg === p.moves.join(' ');
    },
  }), [cubeRef]);
}
