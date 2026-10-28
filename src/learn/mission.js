// @ts-check

/**
 * La carte d’un cas en phrases courtes : la mission dit quoi
 * faire, l’astuce aide si on bloque. Sans phrase écrite pour le cas, on
 * reprend le but de l’étape et la première phrase de son explication.
 */

/**
 * Première phrase d’un paragraphe.
 * @param {string | undefined} text
 */
export function firstSentence(text) {
  return text?.split(/(?<=[.!?…])\s+/)[0]?.trim() ?? '';
}

/**
 * Que dois-je faire ? Une phrase.
 * @param {{ goal: string }} step
 * @param {{ mission?: string } | undefined} alg
 */
export function caseMission(step, alg) {
  return alg?.mission ?? step.goal;
}

/**
 * L’astuce d’une étape : une phrase, ou rien.
 * @param {{ tip?: string, text?: string[] }} step
 */
export function stepTip(step) {
  return step.tip ?? firstSentence(step.text?.[0]);
}
