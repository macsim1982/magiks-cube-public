// @ts-check
import { useEffect, useRef } from 'react';
import './Dialog.scss';

// Le bouton qui a ouvert ne garde pas le focus : son anneau ne traîne pas
const blurActive = () => {
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
};

/**
 * Fenêtre modale native : `open` l’ouvre et la ferme ; Échap,
 * un clic hors du panneau ou la fermeture appellent `onClose`. `title` est
 * l’id du titre qui la nomme. `closedBy="closerequest"` : Échap seulement,
 * un clic hors du panneau ne ferme pas (comme l’attribut HTML `closedby`).
 *
 * @param {{ open: boolean, onClose: () => void, title: string, className?: string, closedBy?: string, children?: import('react').ReactNode }} props
 */
export default function Dialog({ open, onClose, title, className, closedBy = 'any', children }) {
  const dialog = useRef(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={['dialog', className].filter(Boolean).join(' ')}
      aria-labelledby={title}
      onClose={() => {
        onClose();
        queueMicrotask(blurActive);
      }}
      onClick={(event) => {
        if (closedBy === 'any' && event.target === dialog.current) onClose();
      }}
    >
      <div className="dialog__panel">{children}</div>
    </dialog>
  );
}
