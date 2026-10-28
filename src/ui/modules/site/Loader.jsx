// @ts-check
import SiteName from './SiteName';
import './Loader.scss';

// `elementtiming` : le nom compte pour la mesure du premier affichage ; React le passe tel quel
const ELEMENT_TIMING = { elementtiming: 'site-name' };

/**
 * Couvre la scène au chargement, puis s’efface en fondu. La pastille du nom
 * y est déjà, à la place exacte du titre.
 * `index.html` en garde une copie statique pour la première image, avant
 * le JavaScript : les garder identiques. `elementtiming` : `main.jsx`
 * attend que le nom soit peint pour charger la 3D.
 * Sert aussi de rideau avant de rejouer l’intro : `quiet`, sans nom, roue
 * ni texte.
 */
export default function Loader({ hidden = false, quiet = false }) {
  return (
    <div
      className={`loader${hidden ? ' is-hidden' : ''}`}
      role={quiet ? undefined : 'status'}
      aria-live={quiet ? undefined : 'polite'}
      aria-hidden={hidden || quiet || undefined}
    >
      {!quiet && (
        <>
          <p className="site-title" aria-hidden="true" {...ELEMENT_TIMING}><SiteName /></p>
          <span className="loader__mark" aria-hidden="true" />
          <span>Le cube se prépare</span>
        </>
      )}
    </div>
  );
}
