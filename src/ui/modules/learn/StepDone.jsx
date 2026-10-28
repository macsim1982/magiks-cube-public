// @ts-check
import { Button } from '../../components';
import StepStars from './StepStars';

/**
 * Le défi réussi : l’étape fêtée, ses trois étoiles en grand, et la suite
 *. Toutes les étoiles : « c’est fait ! ».
 * @param {{ step: { title: string }, stars: { watched: boolean, solo: boolean, challenge: boolean, count: number },
 *   nextLabel: string, onNext?: () => void, onAgain: () => void }} props
 */
export default function StepDone({ step, stars, nextLabel, onNext, onAgain }) {
  const all = stars.count === 3;
  return (
    <section className="step-done" aria-live="polite" aria-label="Défi réussi">
      <p className="step-done__kicker">{all ? 'Étape terminée' : 'Défi réussi'}</p>
      <p className="step-done__title">{all ? `${step.title}, c’est fait !` : 'Bravo, tu l’as reconnu !'}</p>
      <StepStars stars={stars} />
      <div className="step-done__actions">
        <Button variant="tonal" icon="replay" caption onClick={onAgain}>
          Un autre
        </Button>
        {onNext && (
          <Button variant="filled" iconAfter="chevronRight" className="learn__play" onClick={onNext}>
            {nextLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
