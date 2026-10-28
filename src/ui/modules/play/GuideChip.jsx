// @ts-check
import { Button } from '../../components';
import { Icon } from '../../icons';
import './GuideChip.scss';

/**
 * Dans Jouer, après un mélange : ouvre le guide débutant sur ce
 * mélange, étape par étape.
 */
export default function GuideChip({ onOpen }) {
  return (
    <Button variant="tonal" className="guide-chip" onClick={onOpen}>
      <Icon name="learn" size={20} />
      Comment le résoudre ?
    </Button>
  );
}
