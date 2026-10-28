// @ts-check
import { useState } from 'react';
import { Button, Progress } from '../../components';
import { Icon } from '../../icons';
import { ChapterIcon } from './learnMarks';
import StepMap from './StepMap';

/** Étoile d’une étape réussie. */
function StepStar() {
  return (
    <span className="learn__star" role="img" aria-label="étape réussie">
      <Icon name="star" size={20} />
    </span>
  );
}

/**
 * Le parcours : l’étape en cours, sa leçon en barre de progression
 * ; un appui ouvre la carte du chantier.
 * @param {{ lessons: any[], lessonIndex: number, stepIndex: number, label: string, title: string, progress: number,
 *   stepDone: (lesson: number, step: number) => boolean, stars: (lesson: number, step: number) => any,
 *   caseDone: (at: number) => boolean, onPick: (lesson: number, step: number) => void }} props
 */
export default function ChapterMenu({ lessons, lessonIndex, stepIndex, label, title, progress, stepDone, stars, caseDone, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="learn__menu">
      <Button
        variant={open ? 'filled' : 'tonal'}
        className="learn-head__chapter"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <ChapterIcon title={title} />
        <span className="learn-head__text">
          <span className="learn-head__count">
            {label}
            {stepDone(lessonIndex, stepIndex) && <StepStar />}
          </span>
          <span className="learn-head__title">{title}</span>
        </span>
        <Icon name="map" />
        <Progress value={progress} className="learn-head__progress" />
      </Button>
      <StepMap
        open={open}
        lessons={lessons}
        lessonIndex={lessonIndex}
        stepIndex={stepIndex}
        stars={stars}
        caseDone={caseDone}
        onClose={() => setOpen(false)}
        onPick={(lessonAt, stepAt) => {
          setOpen(false);
          // L’étape en cours : on la reprend où on en était
          if (lessonAt !== lessonIndex || stepAt !== stepIndex) onPick(lessonAt, stepAt);
        }}
      />
    </div>
  );
}
