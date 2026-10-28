// @ts-check
import { LESSONS } from '../../../learn';
import { IconButton } from '../../components';
import ChapterMenu from './ChapterMenu';
import LessonPicker from './LessonPicker';

/**
 * Le haut d’Apprendre : l’accueil, et le parcours compté dans la leçon
 * (« Étape 2 sur 8 »). `lessonsPicker` : le choix de la leçon,
 * en réglage du look.
 */
export default function LearnHead({ lessons, place, marks, learn, lessonsPicker, onQuit }) {
  const { lessonIndex, stepIndex, lesson, step } = place;
  return (
    <>
      {lessonsPicker && (
        <LessonPicker lessons={LESSONS} current={lessonIndex < LESSONS.length ? lessonIndex : -1} onChange={(i) => learn.pickChapter(i, 0)} />
      )}
      <div className="learn-head" data-reserve="top">
        <IconButton variant="tonal" icon="house" label="Accueil" className="learn-head__quit" onClick={onQuit} />
        <ChapterMenu
          lessons={lessons}
          lessonIndex={lessonIndex}
          stepIndex={stepIndex}
          label={`Étape ${stepIndex + 1} sur ${lesson.steps.length}`}
          title={step.title}
          progress={marks.lessonProgress}
          stepDone={marks.stepDone}
          stars={marks.stars}
          caseDone={marks.caseDone}
          onPick={learn.pickChapter}
        />
      </div>
    </>
  );
}
