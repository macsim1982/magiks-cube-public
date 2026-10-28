// @ts-check
import {
  BODY_RADIUS,
  BODY_SEGMENTS,
  createBodyTemplate,
  createStickerGeometry,
  FACES,
  GAP,
  reshapeRoundedBox,
  stickerLayout,
  stickerSize,
  UNIT,
} from './geometry';
import { BoxGeometry } from 'three';
import { createSolvedState } from '../core/state';
import { isSolvedByColor } from '../core/solved';
import CubePiece from '../render/CubePiece';
import {
  CUBE_KEYS,
  makeApply,
  makeMovingIds,
  makeScramble,
  makeToTurn,
  makeTurnToToken,
  QUARTER,
  invert,
  invertAlg,
  parseAlg,
  viewFrame,
  DEFAULT_FRAME,
} from './notation';

const AXIS_INDEX = { x: 0, y: 1, z: 2 };
const AXIS_VEC = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/**
 * Coordonnées monde d’un slot (indices 0..n-1).
 * pitch = 3/n → pour n=3 : positions -1, 0, 1.
 */
export function slotWorld(slot, n) {
  const pitch = 3 / n;
  const half = (n - 1) / 2;
  return slot.map((i) => (i - half) * pitch);
}

/** Taille du cubelet (mode classique, sans miroir). */
export function cubieSize(n) {
  const pitch = 3 / n;
  const s = pitch - GAP;
  return [s, s, s];
}

/**
 * Mode miroir 3×3 : étire les arêtes selon l’offset (coords {-1,0,1}).
 * @param {number[]} worldPos
 * @param {number[]} offset
 */
export function cubeletBoxMirror(worldPos, offset) {
  return {
    size: worldPos.map((c, i) => 1 + c * offset[i] - GAP),
    center: worldPos.map((c, i) => (c === 0 ? 0 : offset[i] / 2)),
  };
}

// Les six faces extérieures, dans l’ordre de FACES : leur axe, leur côté, leur couleur
const SIDES = [
  { axis: 0, sign: 1, color: 'right' },
  { axis: 0, sign: -1, color: 'left' },
  { axis: 1, sign: 1, color: 'top' },
  { axis: 1, sign: -1, color: 'bottom' },
  { axis: 2, sign: 1, color: 'front' },
  { axis: 2, sign: -1, color: 'back' },
];
// Une pièce par nombre de stickers
const KINDS = ['inner', 'center', 'edge', 'corner'];

/** Les stickers d’une pièce : une face par côté extérieur où elle se trouve */
function stickerFaces(slot, n) {
  return SIDES.flatMap(({ axis, sign, color }, i) => (
    slot[axis] === (sign > 0 ? n - 1 : 0)
      ? [{ axis, sign, color, rotation: FACES[i].rotation, dims: FACES[i].dims }]
      : []
  ));
}

/** Les pièces visibles d’un cube N×N, de la place (0, 0, 0) à (n-1, n-1, n-1) */
function buildPieces(n) {
  const pitch = 3 / n;
  const half = (n - 1) / 2;
  const onSurface = (i) => i === 0 || i === n - 1;
  const slots = Array.from({ length: n ** 3 }, (_, k) => [Math.floor(k / (n * n)), Math.floor(k / n) % n, k % n]);
  return slots.filter((slot) => slot.some(onSurface)).map((slot) => {
    const faces = stickerFaces(slot, n);
    return {
      id: slot.join('-'),
      slot,
      world: slot.map((i) => (i - half) * pitch),
      faces,
      kind: KINDS[faces.length],
    };
  });
}

/**
 * Stratégie de drag pour couches NxN.
 * Verrouille un axe orthogonal à la normale, layer = index de grille.
 */
export function makeCubeDrag(n) {
  const pitch = 3 / n;
  const half = (n - 1) / 2;
  const AXIS_NAMES = ['x', 'y', 'z'];

  return {
    angle: QUARTER,
    lockDistance: 0.12,
    commitRatio: 0.28,

    /**
     * @returns {{ axis: string, layer: number } | null}
     */
    resolve(hit, { normal, normalAxis, delta, piecePose }) {
      let best = null;
      let bestScore = 0;
      for (const axis of AXIS_NAMES) {
        if (axis === normalAxis) continue;
        // score = |delta · (axis × normal)| approx via components
        const ax = axis === 'x' ? 1 : 0;
        const ay = axis === 'y' ? 1 : 0;
        const az = axis === 'z' ? 1 : 0;
        const tx = ay * normal.z - az * normal.y;
        const ty = az * normal.x - ax * normal.z;
        const tz = ax * normal.y - ay * normal.x;
        const score = Math.abs(delta.x * tx + delta.y * ty + delta.z * tz);
        if (score > bestScore) {
          bestScore = score;
          best = axis;
        }
      }
      if (!best || !piecePose) return null;
      const layer = piecePose.slot[AXIS_INDEX[best]];
      return { axis: best, layer };
    },

    worldOfSlot(slot) {
      return slotWorld(slot, n);
    },

    /** Index de couche le plus proche d’une position monde. */
    layerFromWorld(axis, worldPos) {
      const v = worldPos[AXIS_INDEX[axis]];
      return Math.round(v / pitch + half);
    },
  };
}

/** Labels pour FaceHints */
const MOVE_LABELS = {
  R: 'Droite', L: 'Gauche', U: 'Au dessus', D: 'En dessous',
  F: 'Devant', B: 'Derrière', M: 'Milieu', E: 'Équateur', S: 'Standing',
  x: 'Cube', y: 'Cube', z: 'Cube',
};

/**
 * La géométrie des pièces d’un cube N×N, lue par `CubePiece` : corps arrondi
 * (moins de segments et un arrondi plus fin quand les pièces rapetissent),
 * stickers, et la boîte du mode Mirror.
 * @param {number} n
 */
function cubeGeometry(n) {
  const bodySegments = n >= 6 ? 2 : BODY_SEGMENTS;
  const bodyRadius = Math.min(BODY_RADIUS, (3 / n) * 0.11);
  return {
    useRounded: true,
    bodyRadius,
    cubieSize: () => cubieSize(n),
    cubeletBoxMirror,
    createBodyTemplate: () => createBodyTemplate(bodySegments),
    reshapeRoundedBox,
    createStickerGeometry,
    stickerLayout,
    stickerSize,
    BODY_RADIUS: bodyRadius,
    BODY_SEGMENTS: bodySegments,
    GAP,
    UNIT,
    createSimpleBodyGeometry: () => {
      const s = cubieSize(n);
      return new BoxGeometry(s[0], s[1], s[2]);
    },
  };
}

/**
 * @param {number} n
 * @returns {import('../types.js').PuzzleDefinition}
 */
export function createCube(n) {
  if (!Number.isInteger(n) || n < 2) {
    throw new Error(`createCube: n must be an integer ≥ 2, got ${n}`);
  }

  const pieces = buildPieces(n);
  const toTurn = makeToTurn(n);
  const turnToToken = makeTurnToToken(n);
  const apply = makeApply(n);
  const movingIds = makeMovingIds();
  const scramble = makeScramble(n);
  const drag = makeCubeDrag(n);
  // Les tranches du milieu (M, E, S) n’existent qu’au 3×3
  const keys = { ...CUBE_KEYS };
  if (n !== 3) {
    delete keys.m;
    delete keys.e;
    delete keys.s;
  }

  return {
    id: `cube${n}`,
    label: `${n}×${n}×${n}`,
    family: 'cube',
    n,
    angle: QUARTER,
    pieces,
    keys,
    mirror: n === 3,
    capabilities: { lessons: n === 3, solver: n === 3, race: n === 3 },
    authored: 'slot',
    Piece: CubePiece,

    toTurn,
    turnToToken,
    invert,
    invertAlg,
    parseAlg,
    scramble,
    viewFrame,
    DEFAULT_FRAME,

    movingIds,
    apply,
    createState: () => createSolvedState(pieces),
    isSolved: (state) => isSolvedByColor(pieces, state),
    turnAxis: (turn) => AXIS_VEC[turn.axis],

    slotWorld: (slot) => slotWorld(slot, n),
    drag,

    moveLabels: MOVE_LABELS,

    ...cubeGeometry(n),
  };
}

export const cube3 = createCube(3);
export const cube4 = createCube(4);
export const cube8 = createCube(8);
