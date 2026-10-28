// @ts-check

/**
 * Navigation « Suivant / Avant » du mode Apprendre : d’abord les cas de
 * l’étape, l’étape voisine seulement depuis le dernier (ou le premier) cas.
 * En reculant, on arrive sur le dernier cas de l’étape d’avant : on refait
 * le chemin à l’envers.
 */

/** @typedef {{ lesson: number, step: number, alg: number }} Place */
/** @typedef {{ steps: { algs: unknown[] }[] }} LessonLike */

/**
 * @param {LessonLike[]} lessons
 * @param {Place} at
 * @param {1 | -1} dir
 * @returns {(Place & { newStep: boolean }) | null} `null` au bout du parcours
 */
export function neighbour(lessons, at, dir) {
  const algs = lessons[at.lesson]?.steps[at.step]?.algs ?? [];
  const alg = at.alg + dir;
  if (alg >= 0 && alg < algs.length) return { ...at, alg, newStep: false };

  const steps = lessons.flatMap((lesson, li) => lesson.steps.map((step, si) => ({
    lesson: li,
    step: si,
    count: step.algs.length,
  })));
  const here = steps.findIndex((item) => item.lesson === at.lesson && item.step === at.step);
  const next = here < 0 ? undefined : steps[here + dir];
  if (!next) return null;
  return {
    lesson: next.lesson,
    step: next.step,
    alg: dir > 0 ? 0 : Math.max(0, next.count - 1),
    newStep: true,
  };
}
