import { useEffect, useState } from 'react';

const NONE = Object.freeze({ top: 0, bottom: 0, left: 0 });

const same = (a, b) => a.top === b.top && a.bottom === b.bottom && a.left === b.left;

/**
 * Place à garder libre autour du cube, mesurée sur le
 * dock (plus de colonne de gauche) :
 * - en bas : du haut du dock au bas de la scène, plus la place des
 *   blocs qui n’y sont pas encore (`--dock-reserve-extra`, posé par le CSS).
 *   Elle ne fait que grandir dans un mode : le cube ne bouge pas quand le
 *   panneau change ; elle repart de zéro au changement de mode ou de largeur ;
 * - en haut : la barre marquée `data-reserve="top"` quand elle flotte.
 *
 * Mesures en `offset*` : la glissade d’entrée du dock (`translate`) ne compte pas.
 * `dock` : l’élément (ref callback), monté seulement quand la scène est prête.
 */
export function usePanelReserve(dock, mode) {
  const [reserve, setReserve] = useState(NONE);

  useEffect(() => {
    if (!dock) return undefined;
    const stage = dock.offsetParent;
    let width = window.innerWidth;
    let max = 0;
    const update = (next) => setReserve((current) => (same(current, next) ? current : next));
    const measure = () => {
      if (!(stage instanceof HTMLElement)) return;
      const style = getComputedStyle(dock);
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        max = 0;
      }
      const extra = parseFloat(style.getPropertyValue('--dock-reserve-extra')) || 0;
      max = Math.max(max, Math.ceil(stage.clientHeight - dock.offsetTop + extra));
      const bar = dock.querySelector('[data-reserve="top"]');
      const floating = bar instanceof HTMLElement && getComputedStyle(bar).position === 'fixed';
      const top = floating ? Math.ceil(bar.getBoundingClientRect().bottom) : 0;
      update({ top, bottom: max, left: 0 });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(dock);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [dock, mode]);

  return reserve;
}
