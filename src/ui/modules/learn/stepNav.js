// @ts-check
import { neighbour } from '../../../learn/navigation';

/**
 * ‹ › de la carte d’étape : les cas de l’étape d’abord, puis son défi s’il
 * y en a un, puis l’étape voisine. Depuis le défi, ‹ revient au
 * dernier cas et › va à l’étape suivante.
 * @param {any[]} lessons
 * @param {{ lesson: number, step: number, alg: number }} here
 * @param {{ challenge: boolean, inChallenge: boolean, go: (target: any) => void, toChallenge: () => void }} options
 */
export function stepNav(lessons, here, { challenge, inChallenge, go, toChallenge }) {
  const last = Math.max(0, lessons[here.lesson].steps[here.step].algs.length - 1);
  const from = inChallenge ? { ...here, alg: last } : here;
  const prev = inChallenge ? { ...here, alg: last, newStep: false } : neighbour(lessons, here, -1);
  const next = neighbour(lessons, from, 1);
  const challengeNext = challenge && !inChallenge && (!next || next.newStep);
  return {
    prevLabel: prev && !prev.newStep ? 'Cas d’avant' : 'Étape d’avant',
    nextLabel: challengeNext ? 'Défi' : next && !next.newStep ? 'Cas suivant' : 'Étape suivante',
    canPrev: Boolean(prev),
    canNext: challengeNext || Boolean(next),
    onPrev: () => go(prev),
    onNext: () => (challengeNext ? toChallenge() : go(next)),
  };
}
