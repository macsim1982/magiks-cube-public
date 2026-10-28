// @ts-check

/**
 * Le défi d’une étape : un de ses cas, posé sans dire lequel.
 * L’enfant le reconnaît parmi les cas de l’étape, puis le fait sans flèche.
 * Seuls les cas qui partent d’une position à eux (`setup` non vide) se
 * reconnaissent : sur un cube résolu (la notation), il n’y a rien à voir.
 */

/** @typedef {{ label: string, alg?: string, setup?: string }} ChallengeCase */

/**
 * Les cas de l’étape qui peuvent tomber au défi, par leur rang.
 * @param {{ algs: ChallengeCase[] }} step
 * @returns {number[]}
 */
export function challengeCases(step) {
  return step.algs
    .map((alg, at) => ({ alg, at }))
    .filter(({ alg }) => Boolean(alg.alg?.trim()) && Boolean(alg.setup?.trim()))
    .map(({ at }) => at);
}

/**
 * Un défi a du sens avec au moins deux cas à reconnaître.
 * @param {{ algs: ChallengeCase[] }} step
 */
export const hasChallenge = (step) => challengeCases(step).length >= 2;

/**
 * Le cas tiré au sort ; un autre que `last` quand c’est possible.
 * @param {{ algs: ChallengeCase[] }} step
 * @param {{ last?: number, random?: () => number }} [options]
 */
export function pickChallenge(step, { last = -1, random = Math.random } = {}) {
  const cases = challengeCases(step);
  const pool = cases.length > 1 ? cases.filter((at) => at !== last) : cases;
  return pool[Math.floor(random() * pool.length)] ?? -1;
}
