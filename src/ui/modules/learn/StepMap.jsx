// @ts-check
import { useEffect, useRef } from 'react';
import { Dialog, IconButton } from '../../components';
import { Icon } from '../../icons';
import { chapterKind } from '../../../learn/marks';
import { ChapterIcon } from './learnMarks';
import StepStars from './StepStars';

/**
 * Les cas de l’étape en cours : un trait par cas, vert une fois réussi.
 * @param {{ count: number, caseDone: (at: number) => boolean }} props
 */
function CaseTrack({ count, caseDone }) {
  return (
    <span className="step-map__track" aria-hidden="true">
      {Array.from({ length: count }, (_, at) => (
        <span key={at} className={caseDone(at) ? 'is-done' : undefined} />
      ))}
    </span>
  );
}

/**
 * Une étape sur la carte : son dessin, son numéro, son nom, ses étoiles ;
 * celle en cours montre ses cas et « Continuer ».
 * @param {{ step: { title: string, algs: unknown[] }, at: number, current: boolean, stars: any, caseDone: (at: number) => boolean, onPick: () => void }} props
 */
function MapStep({ step, at, current, stars, caseDone, onPick }) {
  return (
    <li className={`step-map__step${current ? ' is-current' : ''}${stars.count === 3 ? ' is-done' : ''}`}>
      <button type="button" className="step-map__button" aria-current={current ? 'step' : undefined} onClick={onPick}>
        <span className="step-map__picto"><ChapterIcon title={step.title} size={34} /></span>
        <span className="step-map__text">
          {/* La notation ouvre la leçon en échauffement */}
          <span className="step-map__kicker">{chapterKind(step.title) === 'notation' ? 'Échauffement' : `Étape ${at + 1}`}</span>
          <span className="step-map__title">{step.title}</span>
          <StepStars stars={stars} />
          {current && (
            <span className="step-map__here">
              {step.algs.length > 1 && <CaseTrack count={step.algs.length} caseDone={caseDone} />}
              <span className="step-map__go">
                Continuer
                <Icon name="chevronRight" size={18} />
              </span>
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/**
 * La carte du chantier : toutes les étapes, leçon par leçon,
 * chacune avec son dessin et ses étoiles. Rien n’est fermé : on va où on
 * veut. L’étape en cours est mise en avant, avec « Continuer ».
 * @param {{ open: boolean, lessons: any[], lessonIndex: number, stepIndex: number, stars: (lesson: number, step: number) => any, caseDone: (at: number) => boolean, onPick: (lesson: number, step: number) => void, onClose: () => void }} props
 */
export default function StepMap({ open, lessons, lessonIndex, stepIndex, stars, caseDone, onPick, onClose }) {
  const list = useRef(null);
  useEffect(() => {
    if (open) list.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'center' });
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="step-map-title" className="step-map">
      <header className="step-map__head">
        <IconButton icon="close" label="Fermer la carte" className="step-map__close" onClick={onClose} />
        <h2 id="step-map-title">Ton chantier</h2>
      </header>
      <div ref={list}>
        {lessons.map((lesson, lessonAt) => lesson.steps.length > 0 && (
          <section key={lesson.id} className="step-map__lesson" aria-label={lesson.title}>
            <p className="tutorial__kicker">{lesson.title}</p>
            <ol className="step-map__steps">
              {lesson.steps.map((step, stepAt) => (
                <MapStep
                  key={step.title}
                  step={step}
                  at={stepAt}
                  current={lessonAt === lessonIndex && stepAt === stepIndex}
                  stars={stars(lessonAt, stepAt)}
                  caseDone={caseDone}
                  onPick={() => onPick(lessonAt, stepAt)}
                />
              ))}
            </ol>
            {/* Le crédit de la méthode, au bout de sa leçon */}
            {lesson.source && (
              <a className="learn__source" href={lesson.source.href} target="_blank" rel="noreferrer">
                D’après {lesson.source.label}
              </a>
            )}
          </section>
        ))}
      </div>
    </Dialog>
  );
}
