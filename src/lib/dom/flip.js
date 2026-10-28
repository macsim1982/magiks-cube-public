// @ts-check
/**
 * Technique FLIP (First, Last, Invert, Play) pour animer un changement de mise
 * en page à 60 fps : seules `transform` et `opacity` bougent.
 *
 * Un élément participe avec `data-flip="clé"`. Un élément qui apparaît peut
 * partir d’un autre avec `data-flip-from="autre-clé"`.
 */

const EASING = 'cubic-bezier(0.2, 0, 0, 1)';

/** @typedef {Map<string, DOMRect>} FlipSnapshot */

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * First : positions de tous les éléments `[data-flip]` sous `root`.
 * @param {ParentNode} root
 * @returns {FlipSnapshot}
 */
export function snapshot(root) {
  const rects = new Map();
  root.querySelectorAll('[data-flip]').forEach((el) => {
    rects.set(/** @type {HTMLElement} */ (el).dataset.flip, el.getBoundingClientRect());
  });
  return rects;
}

/**
 * Invert : transformation qui ramène `to` sur `from`.
 * @param {DOMRect} from
 * @param {DOMRect} to
 */
export function invert(from, to) {
  const sx = to.width ? from.width / to.width : 1;
  const sy = to.height ? from.height / to.height : 1;
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`;
}

/**
 * Last + Invert + Play : après le changement, chaque élément repart de son
 * ancienne place et glisse vers la nouvelle. Un nouvel élément sans origine
 * apparaît en fondu.
 * @param {ParentNode} root
 * @param {FlipSnapshot} before
 * @param {{ duration?: number }} [options]
 */
export function play(root, before, { duration = 460 } = {}) {
  root.querySelectorAll('[data-flip]').forEach((node) => {
    const el = /** @type {HTMLElement} */ (node);
    const from = before.get(el.dataset.flip) ?? before.get(el.dataset.flipFrom ?? '');
    const to = el.getBoundingClientRect();
    if (reduced()) {
      if (!before.has(el.dataset.flip)) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      return;
    }
    if (!from) {
      el.animate(
        [{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }],
        { duration, easing: EASING },
      );
      return;
    }
    if (Math.abs(from.left - to.left) < 1 && Math.abs(from.top - to.top) < 1
      && Math.abs(from.width - to.width) < 1 && Math.abs(from.height - to.height) < 1) return;
    el.animate(
      [
        { transformOrigin: 'top left', transform: invert(from, to), opacity: before.has(el.dataset.flip) ? 1 : 0.4 },
        { transformOrigin: 'top left', transform: 'none', opacity: 1 },
      ],
      { duration, easing: EASING },
    );
  });
}

/**
 * Sortie : `el` rétrécit jusque dans `target` avant d’être retiré.
 * @param {HTMLElement} el
 * @param {Element} target
 * @param {{ duration?: number }} [options]
 * @returns {Promise<void>}
 */
export function flyInto(el, target, { duration = 320 } = {}) {
  if (reduced()) return Promise.resolve();
  const animation = el.animate(
    [
      { transformOrigin: 'top left', transform: 'none', opacity: 1 },
      { transformOrigin: 'top left', transform: invert(target.getBoundingClientRect(), el.getBoundingClientRect()), opacity: 0 },
    ],
    { duration, easing: EASING, fill: 'forwards' },
  );
  return animation.finished.then(() => undefined, () => undefined);
}
