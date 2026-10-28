// @ts-check
import { addScaled, cross, dot, normalize } from '../../lib/math/vec';

/**
 * La flèche du guide, en calcul pur : quand la
 * redessiner, où en est son dessin, et sa courbe autour de la tranche.
 * `render/SliceGuide` en fait un tube Three.js.
 */

// Balayage du mode « À toi » : la flèche se dessine, reste, s’efface
export const SWEEP = { draw: 0.8, hold: 0.45, fade: 0.25 };
/** Points de la courbe de la flèche (et anneaux du tube) */
export const SEGMENTS = 96;
const UP = [0, 1, 0];

/**
 * Le mode d’un indice : `stay` se dessine une fois et reste (`draw`),
 * `sweeps` se dessine ce nombre de fois (`sweep`), sinon il reste entier.
 * @param {{ sweeps?: number, stay?: boolean }} options
 */
export function hintMode({ sweeps, stay }) {
  if (stay) return 'draw';
  return sweeps ? 'sweep' : 'static';
}

/**
 * Le même coup, déjà affiché et qui reste, n’est pas redessiné ; avec
 * `sweeps` ou `stay`, la flèche se redessine toujours (pour son `onDone`).
 * @param {{ mode: string, token?: string, dashed?: boolean } | null} shown
 * @param {string | null} token
 * @param {{ sweeps?: number, stay?: boolean, dashed?: boolean }} options
 */
export function keepsHint(shown, token, { sweeps, stay, dashed }) {
  if (!token || sweeps || stay || !shown) return false;
  const stays = shown.mode === 'static' || shown.mode === 'draw';
  return stays && shown.token === token && shown.dashed === dashed;
}

/** @param {number} sweeps @param {number} elapsed */
function sweepProgress(sweeps, elapsed) {
  const cycle = SWEEP.draw + SWEEP.hold + SWEEP.fade;
  const round = Math.floor(elapsed / cycle);
  if (round >= sweeps) return { drawn: 1, opacity: 1, ended: true };
  const t = elapsed - round * cycle;
  const fading = t > SWEEP.draw + SWEEP.hold;
  return { drawn: Math.min(1, t / SWEEP.draw), opacity: fading ? 1 - (t - SWEEP.draw - SWEEP.hold) / SWEEP.fade : 1 };
}

/**
 * Où en est la flèche, `elapsed` s après son début : la part dessinée
 * (0 à 1) et son opacité.
 * - `lead` : se dessine pendant `lead` s, puis reste pendant le coup ;
 * - `sweep` : se dessine, reste, s’efface, `sweeps` fois, puis `ended` ;
 * - `draw` : se dessine une fois, puis reste et respire (`settled`) ;
 * - `static` : entière, elle respire doucement.
 * @param {{ mode: string, lead?: number, sweeps?: number }} guide
 * @param {number} elapsed
 * @returns {{ drawn: number, opacity: number, ended?: boolean, settled?: boolean }}
 */
export function guideProgress(guide, elapsed) {
  if (guide.mode === 'lead') return { drawn: Math.min(1, elapsed / (guide.lead ?? 1)), opacity: 1 };
  if (guide.mode === 'sweep') return sweepProgress(guide.sweeps ?? 0, elapsed);
  if (guide.mode === 'draw' && elapsed < SWEEP.draw + SWEEP.hold) {
    return { drawn: Math.min(1, elapsed / SWEEP.draw), opacity: 1 };
  }
  return { drawn: 1, opacity: 0.85 + 0.15 * Math.sin(elapsed * 4), settled: guide.mode === 'draw' };
}

/** Douceur du dessin : vite au début, posé à la fin */
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * Cercle de la flèche : autour de l’axe, à hauteur de la tranche, assez
 * large pour passer hors des pièces. Repère : celui du groupe des pièces.
 * @param {number[]} axis
 * @param {number[][]} positions centres des pièces de la tranche
 */
export function sliceRing(axis, positions) {
  const unit = normalize(axis);
  const along = positions.reduce((sum, p) => sum + dot(p, unit), 0) / Math.max(1, positions.length);
  const radius = Math.max(0, ...positions.map((p) => Math.hypot(...addScaled(p, unit, -dot(p, unit)))));
  // Juste au-delà des coins (demi-diagonale d’un cubie ≈ 0,71) : la flèche
  // frôle le cube sans le toucher, et reste dans le cadre
  return { axis: unit, centre: addScaled([0, 0, 0], unit, along), radius: radius + 0.9 };
}

/**
 * Arc de la flèche, tourné vers la caméra : la pointe reste visible. Un
 * demi-tour a un arc plus long. `cameraLocal` : la caméra, dans le repère
 * des pièces.
 * @param {{ axis: number[], centre: number[], radius: number }} ring
 * @param {{ sign: number, half: boolean, cameraLocal: number[] }} view
 * @returns {number[][]}
 */
export function arcPoints({ axis, centre, radius }, { sign, half, cameraLocal }) {
  const u = normalize(cross(axis, Math.abs(axis[1]) > 0.9 ? [1, 0, 0] : UP));
  const v = cross(axis, u);
  const toCamera = addScaled(cameraLocal, centre, -1);
  const flat = addScaled(toCamera, axis, -dot(toCamera, axis));
  // Axe face à la caméra : tout le cercle se voit, on part du haut de l’écran
  const facing = dot(flat, flat) < 1e-4 ? UP : flat;
  // Arc décalé vers l’arrière : la pointe arrive côté caméra, bien visible
  const middle = Math.atan2(dot(facing, v), dot(facing, u)) - sign * Math.PI * 0.15;
  const span = half ? Math.PI * 1.45 : Math.PI * 0.95;
  return Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    // Rotation positive autour de l’axe = angle croissant (v = axe × u)
    const phi = middle + sign * (i / SEGMENTS - 0.5) * span;
    return addScaled(addScaled(centre, u, Math.cos(phi) * radius), v, Math.sin(phi) * radius);
  });
}
