import { useState } from 'react';

/**
 * Où en est l’enfant : la leçon, l’étape et le cas ouverts. Une leçon
 * calculée (guide, recherche) peut raccourcir : l’étape et le cas restent
 * alors dans ses bornes. `index` et `selected` : les valeurs gardées, avant
 * ce recalage.
 */
export function useLessonPlace(lessons, opening) {
  const [lessonIndex, setLessonIndex] = useState(opening.lesson);
  const [index, setIndex] = useState(opening.step);
  const [selected, setSelected] = useState(opening.alg);
  const lesson = lessons[Math.min(lessonIndex, lessons.length - 1)];
  const stepIndex = Math.min(index, lesson.steps.length - 1);
  if (stepIndex !== index) {
    setIndex(stepIndex);
    setSelected(0);
  }
  const step = lesson.steps[stepIndex];
  const algIndex = step.algs.length === 0 ? 0 : Math.min(selected, step.algs.length - 1);
  if (algIndex !== selected) setSelected(algIndex);

  return {
    lessonIndex,
    stepIndex,
    algIndex,
    lesson,
    step,
    alg: step.algs[algIndex],
    index,
    selected,
    moveTo: (lessonAt, stepAt, algAt) => {
      setLessonIndex(lessonAt);
      setIndex(stepAt);
      setSelected(algAt);
    },
    pickAlg: setSelected,
  };
}
