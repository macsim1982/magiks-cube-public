// @ts-check
import { RubikIcon } from '../../components';
import { moveIcon } from '../../../learn/moveIcon';

// Un coup dessiné sur le cube : la tranche qui bouge en couleur, une flèche pour le sens
/** @param {{ move: string, size?: number }} props */
export default function MoveIcon({ move, size }) {
  const icon = moveIcon(move);
  if (!icon) return null;
  return <RubikIcon size={size} faces={icon.faces} arrows={icon.arrows} />;
}
