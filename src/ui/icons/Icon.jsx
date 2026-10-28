// @ts-check
import { ICONS } from './icons';

/**
 * Rempli, ou au trait ; couleur du texte sauf couleur fixe
 * @param {import('./icons').IconPart} part
 * @returns {import('react').CSSProperties}
 */
function paint({ stroke, color, opacity }) {
  if (stroke) {
    return { fill: 'none', stroke: color ?? 'var(--icon-stroke, currentColor)', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', opacity };
  }
  return { fill: color ?? 'var(--icon-fill, currentColor)', opacity };
}

/**
 * Une icône du registre (`ui/icons/icons.js`). Décorative par défaut ; avec
 * `label`, elle se lit comme une image.
 *
 * @param {{ name: string, size?: number, label?: string }} props
 */
export default function Icon({ name, size = 22, label }) {
  const parts = ICONS[name];
  if (!parts) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      {parts.map((part, index) => (
        <path key={index} d={part.d} style={paint(part)} />
      ))}
    </svg>
  );
}
