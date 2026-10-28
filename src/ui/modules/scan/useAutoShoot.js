import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AIM, aimAt, motion } from '../../../scan';
import { readCells, videoSquare } from './scanCapture';

const LIVE_EVERY = 200;
// Photo prise toute seule : le flash et « Photo prise ! » restent ce temps-là
const TAKEN_MS = 900;
const START = { state: 'search', hint: 'start', progress: 0 };

/** Ce qu’il manque au cube pour la prise automatique */
const missing = (view) => {
  if (view.stickers < AIM.cells) return 'fill';
  return view.centres ? 'still' : 'centres';
};

/**
 * Visée à la caméra : pendant qu’on vise, les couleurs lues
 * s’affichent dans le cadre (`live`). Cube en place et immobile pendant
 * AIM.hold : la photo se prend seule, avec un flash, et `onShot(colors)`
 * la reçoit ensuite.
 * - `aim` : 'search' | 'aimed' | 'hold' (ne plus bouger), sa phrase
 *   (`hint`) et la barre de 0 à 1 (`progress`) ;
 * - `taken` : le flash de la photo prise.
 */
export function useAutoShoot({ camera, photo, active, onShot }) {
  const [live, setLive] = useState(null);
  const [aim, setAim] = useState(START);
  const [taken, setTaken] = useState(false);
  const track = useRef({ previous: null, since: 0 });
  // L’aperçu lit toujours la dernière version de `shoot`
  const latest = useRef(null);

  const shoot = (colors) => {
    setTaken(true);
    navigator.vibrate?.(60);
    window.setTimeout(() => {
      setTaken(false);
      // Photo suivante : il faut d’abord retourner le cube
      setAim({ state: 'search', hint: 'centres', progress: 0 });
      onShot(colors);
    }, TAKEN_MS);
  };
  useLayoutEffect(() => {
    latest.current = { shoot };
  });

  useEffect(() => {
    if (!active || camera.status !== 'live' || taken) return undefined;
    const seen = track.current;
    seen.previous = null;
    seen.since = 0;
    const timer = setInterval(() => {
      const el = camera.video.current;
      if (!el?.videoWidth) return;
      const cells = readCells(el, videoSquare(el), photo);
      setLive(cells.map((cell) => cell.rgb));
      const view = aimAt(cells, photo);
      const still = motion(seen.previous, cells) < AIM.steady;
      seen.previous = cells;
      if (!view.aimed || !still) {
        seen.since = 0;
        setAim({ state: view.aimed ? 'aimed' : 'search', hint: missing(view), progress: 0 });
        return;
      }
      const now = performance.now();
      if (!seen.since) seen.since = now;
      const progress = Math.min(1, (now - seen.since) / AIM.hold);
      setAim({ state: 'hold', hint: 'still', progress });
      if (progress >= 1) latest.current?.shoot(cells.map((cell) => cell.rgb));
    }, LIVE_EVERY);
    return () => clearInterval(timer);
  }, [active, camera.status, camera.video, photo, taken]);

  return { live, aim, taken, clearLive: () => setLive(null) };
}
