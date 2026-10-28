// @ts-check

/**
 * Flèche du mode « À toi » : continue, ou en pointillés pour les
 * comparer (test A/B). `?fleche=pointilles` dans l’adresse choisit la
 * variante et la garde sur cet appareil ; `?fleche=continue` revient.
 */
export const ARROW_STYLES = ['continue', 'pointilles'];
const KEY = 'rubikscube.ab.fleche';

/**
 * L’adresse d’abord, puis le choix gardé, sinon la flèche continue (pur).
 * @param {string} search `location.search`
 * @param {string | null} stored
 */
export function pickArrowStyle(search, stored) {
  const asked = new URLSearchParams(search).get('fleche');
  if (asked && ARROW_STYLES.includes(asked)) return asked;
  if (stored && ARROW_STYLES.includes(stored)) return stored;
  return ARROW_STYLES[0];
}

/** Lit l’adresse et ce qui est gardé ; garde le choix pour la prochaine fois. */
export function readArrowStyle() {
  let stored = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch {
    // Stockage bloqué (navigation privée) : la variante vaut pour cette visite
  }
  const style = pickArrowStyle(window.location.search, stored);
  try {
    if (style !== stored) localStorage.setItem(KEY, style);
  } catch {
    // idem
  }
  return style;
}
