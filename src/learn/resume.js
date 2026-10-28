// @ts-check
import { isStepDone } from './progress';

/**
 * Où reprendre Apprendre : la dernière étape ouverte d’une vraie
 * leçon, ni le guide ni la recherche. Gardée dans `localStorage`, elle dit
 * aussi sur la porte « Apprendre » où l’enfant en est.
 */

export const RESUME_KEY = 'rubikscube.learn.at';

/** @typedef {{ lesson: number, step: number, alg: number }} Place */
/** @typedef {{ id: string, title: string, steps: { title: string, algs: { label: string, alg: string }[] }[] }} Lesson */

/**
 * La place gardée, bornée aux leçons d’aujourd’hui ; `null` si l’enfant
 * n’a jamais ouvert Apprendre (ou si la valeur est illisible).
 * @param {string | null} raw
 * @param {Lesson[]} lessons
 * @returns {Place | null}
 */
export function readResume(raw, lessons) {
  if (!raw) return null;
  try {
    const at = JSON.parse(raw);
    const lesson = Math.min(Math.max(0, Math.trunc(at.lesson) || 0), lessons.length - 1);
    const { steps } = lessons[lesson];
    const step = Math.min(Math.max(0, Math.trunc(at.step) || 0), steps.length - 1);
    const alg = Math.min(Math.max(0, Math.trunc(at.alg) || 0), Math.max(0, steps[step].algs.length - 1));
    return { lesson, step, alg };
  } catch {
    return null;
  }
}

/** @param {Place} at */
export function writeResume(at) {
  return JSON.stringify({ lesson: at.lesson, step: at.step, alg: at.alg });
}

/**
 * Ce que dit la porte « Apprendre » : l’étape où reprendre, son titre et la
 * part des étapes réussies dans sa leçon.
 * @param {Place | null} at
 * @param {Lesson[]} lessons
 * @param {Set<string>} done clés validées (`progress.js`)
 */
export function resumeDoor(at, lessons, done) {
  const place = at ?? { lesson: 0, step: 0, alg: 0 };
  const lesson = lessons[place.lesson];
  const finished = lesson.steps.filter((step) => isStepDone(done, lesson, step)).length;
  return {
    started: Boolean(at),
    label: `Étape ${place.step + 1} sur ${lesson.steps.length}`,
    title: lesson.steps[place.step].title,
    progress: finished / lesson.steps.length,
  };
}
