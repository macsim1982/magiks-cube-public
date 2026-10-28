// @ts-check
import './Progress.scss';

/**
 * Barre de progression décorative : `value` entre 0 et 1. Le
 * rail et la barre sont à elle ; la zone donne la taille et la place.
 */
export default function Progress({ value, className }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <span className={['progress', className].filter(Boolean).join(' ')} aria-hidden="true">
      <span style={{ width: `${percent}%` }} />
    </span>
  );
}
