// @ts-check
import { useCallback, useEffect, useState } from 'react';
import { LESSONS } from '../learn';
import { readResume, RESUME_KEY, writeResume } from '../learn/resume';

function load() {
  try {
    return readResume(localStorage.getItem(RESUME_KEY), LESSONS);
  } catch {
    return null;
  }
}

/**
 * Où reprendre Apprendre, gardé d’une visite à l’autre.
 * `at` : `{ lesson, step, alg }`, `null` avant la première visite ;
 * `place(at)` stable, appelé par le tutoriel à chaque étape ouverte.
 */
export function useResume() {
  const [at, setAt] = useState(load);

  useEffect(() => {
    if (!at) return;
    try {
      localStorage.setItem(RESUME_KEY, writeResume(at));
    } catch {
      // Navigation privée : on reprend au début à la prochaine visite
    }
  }, [at]);

  const place = useCallback((next) => {
    setAt((current) => (
      current && current.lesson === next.lesson && current.step === next.step && current.alg === next.alg
        ? current
        : next
    ));
  }, []);

  return [at, place];
}
