// @ts-check
import { useRef } from 'react';
import { sliceRing } from '../core/guidePlan';
import { lightDown, lightUp, useGlow } from './glow';
import { GUIDE_COLOR } from './SliceGuide';

// Réussite : les pièces arrivées s’allument en vert
const CHEER_COLOR = '#1f9d55';

/**
 * Les marques sur le cube : le guide d’un coup (la tranche s’allume en
 * jaune, flèche néon) et la réussite (en vert).
 * `guideRef` : le guide affiché, que `SliceGuide` dessine.
 */
export function useGuideMarks(puzzle) {
  const guideRef = useRef(null);
  const lit = useRef([]);
  const cheers = useRef([]);
  const guideGlow = useGlow(GUIDE_COLOR);
  const cheerGlow = useGlow(CHEER_COLOR);

  const clearGuide = () => {
    lightDown(lit.current);
    lit.current = [];
    guideRef.current = null;
  };
  const clearCheers = () => {
    lightDown(cheers.current);
    cheers.current = [];
  };

  /** Lumière + flèche sur la tranche de `turn` (pièces encore dans le groupe) ; `guide` : mode et réglages. */
  const showGuide = (turn, pieces, guide) => {
    clearGuide();
    lit.current = lightUp(pieces, guideGlow);
    const amount = turn.to ?? turn.angle;
    guideRef.current = {
      ring: sliceRing(puzzle.turnAxis(turn), pieces.map((piece) => piece.position.toArray())),
      sign: Math.sign(amount),
      half: Math.abs(amount) > puzzle.angle * 1.5,
      start: performance.now(),
      ...guide,
    };
  };

  const celebrate = (pieces) => {
    clearCheers();
    if (pieces.length) cheers.current = lightUp(pieces, cheerGlow);
  };

  return { guideRef, showGuide, clearGuide, clearCheers, celebrate };
}
