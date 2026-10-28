// @ts-check
import { useCallback, useState } from 'react';
import { pickChallenge } from '../../../learn/challenge';

/**
 * Le défi de l’étape : le cas tiré au sort (`index`), et où en
 * est l’enfant : il le reconnaît (`guess`, ses essais faux dans `wrong`),
 * le fait sans flèche (`do`), l’a réussi (`won`). L’état vaut pour une
 * étape (`stepId`) : une autre étape repart de zéro.
 * @param {{ step: { algs: { label: string, alg?: string, setup?: string }[] }, stepId: string }} options
 */
export function useChallenge({ step, stepId }) {
  const [state, setState] = useState({ stepId: '', index: -1, stage: 'guess', wrong: /** @type {number[]} */ ([]) });
  const here = state.stepId === stepId;
  const win = useCallback(() => setState((s) => (s.stepId === stepId ? { ...s, stage: 'won' } : s)), [stepId]);
  return {
    index: here ? state.index : -1,
    stage: here ? state.stage : 'guess',
    wrong: here ? state.wrong : [],
    /** Un nouveau cas, un autre que le dernier si possible */
    start: () => setState((s) => ({ stepId, index: pickChallenge(step, { last: s.index }), stage: 'guess', wrong: [] })),
    /** @param {number} at le cas choisi ; `true` s’il est juste */
    guess: (at) => {
      if (at === state.index) {
        setState((s) => ({ ...s, stage: 'do' }));
        return true;
      }
      setState((s) => ({ ...s, wrong: s.wrong.includes(at) ? s.wrong : [...s.wrong, at] }));
      return false;
    },
    win,
  };
}
