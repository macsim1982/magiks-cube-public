import { useEffect, useMemo, useRef, useState } from 'react';
import { INTRO, introPlan, shouldPlayIntro } from './intro';

const SEEN_KEY = 'rubikscube.intro.seen';

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Navigation privée : l’intro reviendra, ce n’est pas grave
  }
}

const OFF = { phase: 'off', startedAt: 0, skippedAt: 0 };

/**
 * Les gestes de l’intro : la lancer (`begin`), la passer (`skip`), la
 * rejouer sous un rideau (`replay`). `timers` : les minuteries en cours,
 * toutes annulées à la fin.
 */
function introApi({ cubeRef, puzzle, timers, setIntro }) {
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const outro = (skippedAt, cameraEnd) => {
    clear();
    markSeen();
    setIntro((current) => ({ ...current, phase: 'outro', skippedAt }));
    // On rend la caméra une fois posée, jamais en plein trajet
    const camera = skippedAt ? INTRO.glide : cameraEnd - performance.now();
    later(Math.max(INTRO.outro, camera + 50), () => setIntro(OFF));
  };

  const begin = () => {
    const cube = cubeRef.current;
    if (!cube) return;
    const scramble = puzzle.scramble(INTRO.moves);
    const frame = puzzle.DEFAULT_FRAME;
    cube.reset();
    cube.play(scramble, { instant: true, hints: false, frame });
    const plan = introPlan(puzzle, puzzle.invertAlg(scramble), INTRO.solve);
    const startedAt = performance.now();
    setIntro({ phase: 'play', startedAt, skippedAt: 0 });
    later(INTRO.lead, () => {
      plan.forEach(({ token, speed }, i) => {
        cube.play([token], {
          speed,
          hints: false,
          frame,
          onDone: i === plan.length - 1 ? () => outro(0, startedAt + INTRO.camera) : undefined,
        });
      });
    });
  };

  return {
    begin,
    skip() {
      const cube = cubeRef.current;
      cube?.cancel();
      cube?.reset();
      outro(performance.now(), 0);
    },
    /** `onCovered` : appelé sous le rideau, pour remettre l’écran à zéro. */
    replay(onCovered) {
      clear();
      setIntro({ ...OFF, phase: 'veil' });
      later(INTRO.veil, () => {
        onCovered?.();
        setIntro({ ...OFF, phase: 'wait' });
        later(INTRO.settle, begin);
      });
    },
  };
}

/**
 * Intro. Phases :
 * - `wait` : mélangé en Mirror, sous le loader ou le rideau ;
 * - `play` : le cube se résout, la caméra tourne, « Passer l’intro » ;
 * - `outro` : Mirror → couleurs, puis les boutons apparaissent ;
 * - `veil` : rideau qui tombe avant de rejouer ;
 * - `off`.
 * API stable : `begin`, `skip`, `replay(onCovered)`.
 */
export function useIntro(cubeRef, puzzle) {
  const [intro, setIntro] = useState(() => (
    puzzle.mirror && shouldPlayIntro({ search: window.location.search, seen: readSeen(), reducedMotion: reducedMotion() })
      ? { ...OFF, phase: 'wait' }
      : OFF
  ));
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const api = useMemo(() => introApi({ cubeRef, puzzle, timers, setIntro }), [cubeRef, puzzle]);

  const { phase } = intro;
  return useMemo(() => ({
    ...intro,
    ...api,
    /** La caméra et l’entrée appartiennent à l’intro */
    active: phase === 'wait' || phase === 'play' || phase === 'outro',
    /** Le cube est en Mirror */
    mirror: phase === 'wait' || phase === 'play',
    /** Le chrome est caché */
    hidden: phase === 'veil' || phase === 'wait' || phase === 'play',
    /** Le loader (ou le rideau) couvre la scène */
    veiled: phase === 'veil' || phase === 'wait',
    canReplay: puzzle.mirror && !reducedMotion(),
    duration: INTRO.camera,
    glide: INTRO.glide,
  }), [intro, api, phase, puzzle.mirror]);
}
