// @ts-check
import SiteName from './SiteName';

/**
 * Le nom du site, en pastille contre le menu ☰, sur
 * tous les écrans, intro comprise. Il ne bouge et ne s’anime jamais : il
 * prend la suite, au pixel près, de celui de l’écran de chargement.
 */
export default function SiteTitle({ hidden }) {
  return (
    <h1 className={`site-title${hidden ? ' is-hidden' : ''}`} aria-hidden={hidden || undefined}>
      <SiteName />
    </h1>
  );
}
