// @ts-check

/**
 * Ce que l’enfant a validé en mode Apprendre. Pur : `useProgress`
 * le garde dans `localStorage`.
 *
 * - un **cas** est validé quand l’enfant le réussit seul en À toi ; un cas
 *   sans coup l’est dès qu’on l’a vu ;
 * - une **étape** est validée quand tous ses cas le sont ; une étape sans
 *   cas l’est dès qu’on l’a lue.
 *
 * Clés stables : id de leçon, titre d’étape, formule. Changer le libellé
 * d’un cas ne perd pas sa coche ; changer sa formule, si.
 *
 * Trois étoiles par étape : **regardé** (la démo de chaque cas
 * vue jusqu’au bout), **fait seul** (chaque cas réussi en À toi) et
 * **défi** (le défi de l’étape réussi).
 */

/** @typedef {{ id: string, steps: { title: string, algs: { alg?: string }[] }[] }} LessonLike */

export const PROGRESS_KEY = 'rubikscube.progress';

/** @param {{ id: string }} lesson @param {{ title: string }} step @param {{ alg?: string }} alg */
export const caseKey = (lesson, step, alg) => `${lesson.id}|${step.title}|${alg.alg ?? ''}`;

/** @param {{ id: string }} lesson @param {{ title: string }} step */
export const stepKey = (lesson, step) => `${lesson.id}|${step.title}`;

/** @param {{ id: string }} lesson @param {{ title: string }} step @param {{ alg?: string }} alg */
export const watchKey = (lesson, step, alg) => `${caseKey(lesson, step, alg)}|vu`;

/** @param {{ id: string }} lesson @param {{ title: string }} step */
export const challengeKey = (lesson, step) => `${stepKey(lesson, step)}|defi`;

/**
 * @param {Set<string>} done
 * @param {string} key
 * @returns {Set<string>} le même ensemble s’il n’y a rien de neuf
 */
export function mark(done, key) {
  if (done.has(key)) return done;
  return new Set(done).add(key);
}

/** @param {Set<string>} done @param {LessonLike} lesson @param {LessonLike['steps'][number]} step */
export function isStepDone(done, lesson, step) {
  if (!step.algs.length) return done.has(stepKey(lesson, step));
  return step.algs.every((alg) => done.has(caseKey(lesson, step, alg)));
}

/**
 * Les étoiles d’une étape. Une étape sans cas n’a qu’une étoile à gagner :
 * l’avoir lue (`solo`).
 * @param {Set<string>} done @param {LessonLike} lesson @param {LessonLike['steps'][number]} step
 * @returns {{ watched: boolean, solo: boolean, challenge: boolean, count: number }}
 */
export function stepStars(done, lesson, step) {
  const solo = isStepDone(done, lesson, step);
  const cases = step.algs.length > 0;
  const watched = cases ? step.algs.every((alg) => done.has(watchKey(lesson, step, alg))) : solo;
  const challenge = cases ? done.has(challengeKey(lesson, step)) : solo;
  return { watched, solo, challenge, count: [watched, solo, challenge].filter(Boolean).length };
}

/** @param {string | null} raw */
export function readProgress(raw) {
  try {
    const keys = JSON.parse(raw ?? '[]');
    return new Set(Array.isArray(keys) ? keys.filter((key) => typeof key === 'string') : []);
  } catch {
    return new Set();
  }
}

/** @param {Set<string>} done */
export const writeProgress = (done) => JSON.stringify([...done]);
