// @ts-check
import { Icon } from '../../icons';

const STAR_NAMES = ['regardé', 'fait seul', 'défi'];

/**
 * Les trois étoiles d’une étape : regardé, fait seul, défi.
 * @param {{ stars: { watched: boolean, solo: boolean, challenge: boolean, count: number } }} props
 */
export default function StepStars({ stars }) {
  const won = [stars.watched, stars.solo, stars.challenge];
  const said = STAR_NAMES.filter((_, at) => won[at]).join(', ') || 'aucune';
  return (
    <span className="step-stars" role="img" aria-label={`${stars.count} étoile${stars.count > 1 ? 's' : ''} sur 3 : ${said}`}>
      {won.map((on, at) => (
        <span key={STAR_NAMES[at]} className={`step-stars__star${on ? ' is-won' : ''}`}>
          <Icon name="star" size={18} />
        </span>
      ))}
    </span>
  );
}
