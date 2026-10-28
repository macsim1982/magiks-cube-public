// @ts-check
import { Icon } from '../../icons';

/** La pastille « Défi » : un défi se reconnaît d’un coup d’œil */
export default function ChallengeChip() {
  return (
    <span className="challenge__chip">
      <Icon name="star" size={16} />
      Défi
    </span>
  );
}
