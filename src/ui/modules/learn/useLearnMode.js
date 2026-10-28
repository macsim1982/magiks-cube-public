import { useCallback, useState } from 'react';
import { flyInto } from '../../../lib/dom/flip';
import { useFlip } from '../../hooks';

/**
 * Regarder, faire, ou le défi : `mode` vaut
 * 'read', 'practice' ou 'challenge'. Changer d’étape, de cas ou de mode
 * glisse d’un écran à l’autre (FLIP) ; un nouveau cas repart toujours sur
 * Regarder. `onEnter(next)` remet la démo et À toi au départ du cas, en
 * entrant dans un mode ; `canPractice` : le cas a des coups à refaire ;
 * `canChallenge` : l’étape a un défi.
 */
export function useLearnMode({ place, practiceApi, onPracticeChange, canPractice, canChallenge, onEnter }) {
  const [mode, setMode] = useState('read');
  const flip = useFlip(useCallback(() => document.querySelector('.stage'), []));
  const practicing = mode === 'practice';
  // Hors de Regarder, changer de cas ou d’étape repasse par Regarder
  const away = mode !== 'read';

  const backToRead = (change) => {
    practiceApi?.stop();
    flip(() => {
      change();
      setMode('read');
      onPracticeChange?.(false);
    });
  };

  // Nouvelle étape : on regarde d’abord (regarder → faire)
  const pickChapter = (lessonAt, stepAt, algAt = 0) => {
    const change = () => place.moveTo(lessonAt, stepAt, algAt);
    if (away) backToRead(change);
    else change();
  };

  // Nouveau cas : on le regarde d’abord, même depuis À toi
  const pickAlg = (next) => {
    if (next < 0 || next >= place.step.algs.length) return;
    if (away) backToRead(() => place.pickAlg(next));
    else place.pickAlg(next);
  };

  const changeMode = (next) => {
    if (next === mode || (next === 'practice' && !canPractice) || (next === 'challenge' && !canChallenge)) return;
    practiceApi?.stop();
    const enter = () => {
      setMode(next);
      onEnter(next);
    };
    // Retour à Regarder : la bulle se replie d’abord dans le bouton « À toi ! »
    const coach = document.querySelector('.coach');
    const target = document.querySelector('[data-flip="mode-practice"]');
    if (next === 'read' && coach instanceof HTMLElement && target) {
      flyInto(coach, target).then(() => flip(enter));
    } else {
      flip(enter);
    }
  };

  return { mode, practicing, challenging: mode === 'challenge', pickChapter, pickAlg, changeMode };
}
