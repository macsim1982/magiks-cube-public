import { useEffect, useEffectEvent, useRef } from 'react';
import { keyDown, pressesButton, SPACE_UP, spaceAlone } from './keyboard';

/**
 * Clavier global (règles dans `keyboard.js`) : un seul listener, handlers
 * toujours à jour.
 */
export function useKeyboard(puzzle, { onMove, onUndo, onSpace }) {
  const space = useRef(SPACE_UP);

  // Sur un bouton, seules Espace et Entrée lui reviennent : les lettres tournent le cube
  const ignored = (e) => e.metaKey || e.ctrlKey || e.altKey
    || e.target.closest?.('input, textarea, select, dialog')
    || (pressesButton(e.key) && e.target.closest?.('button'));

  const onKeyDown = useEffectEvent((e) => {
    if (e.repeat && e.key === ' ') e.preventDefault();
    if (e.repeat || ignored(e)) return;
    if (e.key === ' ' || e.key === 'Backspace') e.preventDefault();
    const { space: next, action } = keyDown(puzzle, space.current, e.key);
    space.current = next;
    if (action?.type === 'undo') onUndo();
    else if (action?.type === 'move') onMove(action.token);
  });

  const onKeyUp = useEffectEvent((e) => {
    if (e.key !== ' ') return;
    const alone = spaceAlone(space.current);
    space.current = SPACE_UP;
    if (alone && !ignored(e)) onSpace();
  });

  useEffect(() => {
    const down = (e) => onKeyDown(e);
    const up = (e) => onKeyUp(e);
    // Fenêtre quittée Espace enfoncée : le keyup ne viendra pas
    const blur = () => {
      space.current = SPACE_UP;
    };
    // Un bouton cliqué à la souris ou au doigt rend le focus : Espace revient au cube.
    // Au clavier (`detail` à 0), il le garde ; dans une boîte de dialogue aussi.
    const click = (e) => {
      if (e.detail === 0 || e.target.closest?.('dialog')) return;
      e.target.closest?.('button')?.blur();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    window.addEventListener('click', click);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      window.removeEventListener('click', click);
    };
  }, []);
}
