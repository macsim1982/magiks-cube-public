// @ts-check
import { RubikIcon } from '../../components';
import { SITE_NAME } from './sitePages';
import './SiteName.scss';

const full = (color) => Array(9).fill(color);

const FACES = {
  U: full('yellow'),
  F: full('orange'),
  R: full('blue'),
};

/**
 * La pastille du nom : petit cube et nom du site. Même rendu dans le titre
 * et sur l’écran de chargement ; `index.html` en garde une copie
 * statique, à régénérer si on la change.
 */
export default function SiteName() {
  return (
    <>
      <RubikIcon faces={FACES} />
      {SITE_NAME}
    </>
  );
}
