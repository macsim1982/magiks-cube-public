// @ts-check
import { useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { animate, MD_SPATIAL, mdEmphasized } from '../lib/dom/motion';
import { fitDistance, lensShift, NO_RESERVE, SUBJECT_RADIUS } from './framing';

/**
 * Cadre le puzzle dans la zone libre du canvas, hors de `reserve` (panneau,
 * barre du haut, colonne de gauche :). Le canvas, lui, ne
 * change pas de taille : la caméra recule et l’objectif se décale
 * (`setViewOffset`). `radius` : sphère englobante du puzzle.
 * Nouvel écran : tout de suite ; nouveau panneau : le cube glisse.
 * `hold` : la distance appartient à l’intro, seul l’objectif bouge.
 */
export default function FitCamera({ rest, reserve = NO_RESERVE, radius = SUBJECT_RADIUS, hold = false }) {
  const camera = /** @type {import('three').PerspectiveCamera} */ (useThree((state) => state.camera));
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const shown = useRef(null);

  const { top = 0, bottom = 0, left = 0 } = reserve;

  useLayoutEffect(() => {
    const space = { top, bottom, left };
    const target = {
      distance: fitDistance({ fov: camera.fov, width, height, reserve: space, rest, radius }),
      shift: lensShift(space),
    };
    const apply = ({ distance, shift }) => {
      if (!hold) camera.position.setLength(distance);
      if (shift.x || shift.y) camera.setViewOffset(width, height, shift.x, shift.y, width, height);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      shown.current = { shift, width, height };
    };
    const from = shown.current;
    if (!from || from.width !== width || from.height !== height) {
      apply(target);
      return undefined;
    }
    // Part de la distance réelle : l’enfant a pu zoomer entre-temps
    const start = camera.position.length();
    return animate(MD_SPATIAL, mdEmphasized, (k) => apply({
      distance: start + (target.distance - start) * k,
      shift: {
        x: from.shift.x + (target.shift.x - from.shift.x) * k,
        y: from.shift.y + (target.shift.y - from.shift.y) * k,
      },
    }));
  }, [camera, width, height, rest, radius, top, bottom, left, hold]);

  return null;
}
