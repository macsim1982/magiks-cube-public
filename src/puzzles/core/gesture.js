// @ts-check

/**
 * Deux doigts sur écran tactile : tout le cube tourne.
 * Le sens du glissé (moyenne des deux doigts) choisit le coup, trois droites
 * à 60° l’une de l’autre :
 * - à l’horizontale → y (vers la gauche) ou y' (vers la droite) ;
 * - en diagonale ↗ ↙ → x (↗) ou x' (↙) ;
 * - en diagonale ↘ ↖ → z (↘) ou z' (↖).
 * Le cube suit les doigts, puis se cale au quart de tour.
 *
 * Pur : positions d’écran en px, y vers le bas.
 */

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {[Point, Point]} Pair */
/** @typedef {'x' | 'y' | 'z'} Axis */

export const GESTURE = {
  /** Déplacement (px) avant de choisir l’axe */
  lock: 14,
  /** Un quart de tour = cette fraction du plus petit côté du canvas */
  quarter: 0.4,
  /** En dessous (en quarts), le cube revient ; au-delà, il avance */
  commit: 0.25,
};

/**
 * Sens du coup de chaque axe (sens horaire de la notation), en angle
 * d’écran, y vers le haut. Les trois sont à 120° ; leurs contraires (les
 * coups ') remplissent les trous : une direction tous les 60°.
 * - y tourne comme U : la face avant part à gauche ;
 * - x tourne comme R : la face avant monte, le dessus part au fond (↗) ;
 * - z tourne comme F : le dessus part à droite, la droite descend (↘).
 * @type {Record<Axis, number>}
 */
export const DIRECTION = {
  y: Math.PI,
  x: Math.PI / 3,
  z: -Math.PI / 3,
};

const AXES = /** @type {Axis[]} */ (Object.keys(DIRECTION));

/** @param {Pair} pair */
const middle = ([a, b]) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Déplacement moyen des deux doigts depuis le début du geste.
 * @param {Pair} start
 * @param {Pair} now
 */
export function readGesture(start, now) {
  const from = middle(start);
  const to = middle(now);
  return { dx: to.x - from.x, dy: to.y - from.y };
}

/**
 * Longueur du glissé le long de l’axe, signée dans le sens du coup (px).
 * @param {Axis} axis
 * @param {ReturnType<typeof readGesture>} gesture
 */
const along = (axis, { dx, dy }) => dx * Math.cos(DIRECTION[axis]) - dy * Math.sin(DIRECTION[axis]);

/**
 * Axe du geste, une fois les doigts assez partis ; `null` avant. La droite
 * la plus proche du sens du glissé l’emporte (±30° autour de chacune).
 * @param {ReturnType<typeof readGesture>} gesture
 * @returns {Axis | null}
 */
export function lockAxis(gesture) {
  if (Math.hypot(gesture.dx, gesture.dy) < GESTURE.lock) return null;
  let best = AXES[0];
  for (const axis of AXES) {
    if (Math.abs(along(axis, gesture)) > Math.abs(along(best, gesture))) best = axis;
  }
  return best;
}

/**
 * Quarts de tour, signés dans le sens du coup : seule compte la part du
 * glissé le long de la droite de l’axe.
 * @param {Axis} axis
 * @param {ReturnType<typeof readGesture>} gesture
 * @param {number} size plus petit côté du canvas (px)
 */
export function gestureQuarters(axis, gesture, size) {
  const quarters = along(axis, gesture) / (size * GESTURE.quarter);
  return Math.max(-2, Math.min(2, quarters));
}

/**
 * Quart de tour où se caler en lâchant : 0 sous le seuil, sinon au moins un
 * quart dans le sens du geste, deux au plus.
 * @param {number} quarters
 */
export function snapQuarters(quarters) {
  const size = Math.abs(quarters);
  if (size < GESTURE.commit) return 0;
  return Math.sign(quarters) * Math.min(2, Math.max(1, Math.round(size)));
}
