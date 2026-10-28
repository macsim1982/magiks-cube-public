import { useEffect } from 'react';
import { LESSONS } from '../../../learn';
import { caseKey, challengeKey, isStepDone, stepKey, stepStars, watchKey } from '../../../learn/progress';

const NO_STARS = { watched: false, solo: false, challenge: false, count: 0 };

/**
 * Coches et étoiles, pour les vraies leçons : pas le
 * guide ni la recherche. Un cas se valide réussi seul en À toi (`solved`),
 * ou dès qu’on le voit s’il n’a pas de coup ; une étape sans cas aussi. La
 * démo vue jusqu’au bout (`watched`) donne l’étoile « regardé », le défi
 * réussi (`challengeWon`) l’étoile « défi ».
 * `lessonProgress` : la part des étapes réussies de la leçon, pour sa barre.
 */
export function useProgressMarks({ progress, lessons, place, solved, watched, challengeWon, length, onValidate }) {
  const { lessonIndex, lesson, step, alg } = place;
  const saved = (at) => at < LESSONS.length && Boolean(progress);
  const caseDone = (at) => saved(lessonIndex) && progress.has(caseKey(lesson, step, step.algs[at]));
  const stepDone = (at, stepAt) => saved(at) && isStepDone(progress, lessons[at], lessons[at].steps[stepAt]);
  const stars = (at, stepAt) => (saved(at) ? stepStars(progress, lessons[at], lessons[at].steps[stepAt]) : NO_STARS);
  const thisCase = saved(lessonIndex) && alg ? caseKey(lesson, step, alg) : null;
  const thisWatch = saved(lessonIndex) && alg ? watchKey(lesson, step, alg) : null;
  const thisStep = saved(lessonIndex) && !alg ? stepKey(lesson, step) : null;
  const thisChallenge = saved(lessonIndex) ? challengeKey(lesson, step) : null;

  useEffect(() => {
    if (thisCase && (solved || length === 0)) onValidate?.(thisCase);
  }, [thisCase, solved, length, onValidate]);
  useEffect(() => {
    if (thisWatch && (watched || length === 0)) onValidate?.(thisWatch);
  }, [thisWatch, watched, length, onValidate]);
  useEffect(() => {
    if (thisStep) onValidate?.(thisStep);
  }, [thisStep, onValidate]);
  useEffect(() => {
    if (thisChallenge && challengeWon) onValidate?.(thisChallenge);
  }, [thisChallenge, challengeWon, onValidate]);

  const done = lesson.steps.filter((_, at) => stepDone(lessonIndex, at)).length;
  return { caseDone, stepDone, stars, lessonProgress: done / lesson.steps.length };
}
