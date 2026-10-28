// @ts-check
import { challengeCases } from '../../../learn/challenge';
import { StepMark } from './learnMarks';

/**
 * Le défi, d’abord : quel cas est sur le cube ? Un bouton par
 * cas de l’étape ; un essai faux se grise et le dit, sans rien dévoiler.
 * @param {{ step: { algs: { label: string, alg: string, setup?: string }[] }, wrong: number[], onGuess: (at: number) => void }} props
 */
export default function ChallengeGuess({ step, wrong, onGuess }) {
  const missed = wrong.length > 0;
  return (
    <section className="challenge" aria-label="Défi">
      <p className="challenge__ask" aria-live="polite">
        {missed ? 'Pas celui-là. Regarde encore le cube.' : 'Quel cas vois-tu sur le cube ?'}
      </p>
      <div className="challenge__choices">
        {challengeCases(step).map((at) => {
          const alg = step.algs[at];
          const no = wrong.includes(at);
          return (
            <button
              key={alg.label}
              type="button"
              className={`challenge__choice${no ? ' is-wrong' : ''}`}
              disabled={no}
              aria-label={no ? `${alg.label}, pas celui-là` : alg.label}
              onClick={() => onGuess(at)}
            >
              <StepMark alg={alg} />
              <span>{alg.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
