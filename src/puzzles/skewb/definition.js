// @ts-check
import { DEFAULT_FRAME, viewFrame } from '../core/frame';
import {
  quatFromAxisAngle,
  quatMultiply,
  quatNormalize,
  quatRotateVec,
} from '../../lib/math/quat';
import { cloneState, createSolvedState } from '../core/state';
import { isSolvedByColor } from '../core/solved';
import { randomMoves } from '../core/scramble';
import SkewbPiece from '../render/SkewbPiece';
import {
  createCenterGeometry,
  createCenterStickers,
  createCornerGeometry,
  createCornerStickers,
  HALF,
  STICKER_LIFT,
} from './geometry';

export const THIRD = (2 * Math.PI) / 3;

/** Coins : signes ±1 sur x,y,z. */
const CORNERS = [
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
  [-1, 1, 1],
  [-1, 1, -1],
  [-1, -1, 1],
  [-1, -1, -1],
];

const CENTERS = [
  { id: 'center-right', face: 'right', normal: [1, 0, 0] },
  { id: 'center-left', face: 'left', normal: [-1, 0, 0] },
  { id: 'center-top', face: 'top', normal: [0, 1, 0] },
  { id: 'center-bottom', face: 'bottom', normal: [0, -1, 0] },
  { id: 'center-front', face: 'front', normal: [0, 0, 1] },
  { id: 'center-back', face: 'back', normal: [0, 0, -1] },
];

const cornerId = (s) => `corner-${s[0]},${s[1]},${s[2]}`;

function buildPieces() {
  const pieces = [];
  for (const s of CORNERS) {
    const faces = [];
    if (s[0] === 1) faces.push({ color: 'right', axis: 0, sign: 1 });
    if (s[0] === -1) faces.push({ color: 'left', axis: 0, sign: -1 });
    if (s[1] === 1) faces.push({ color: 'top', axis: 1, sign: 1 });
    if (s[1] === -1) faces.push({ color: 'bottom', axis: 1, sign: -1 });
    if (s[2] === 1) faces.push({ color: 'front', axis: 2, sign: 1 });
    if (s[2] === -1) faces.push({ color: 'back', axis: 2, sign: -1 });
    pieces.push({
      id: cornerId(s),
      kind: 'corner',
      slot: s.slice(),
      signs: s.slice(),
      faces,
    });
  }
  for (const c of CENTERS) {
    pieces.push({
      id: c.id,
      kind: 'center',
      slot: c.normal.slice(),
      face: c.face,
      faces: [{ color: c.face, axis: c.normal.findIndex((v) => v !== 0), sign: c.normal.find((v) => v !== 0) }],
    });
  }
  return pieces;
}

const PIECES = buildPieces();

/** Axe unitaire du coin (diagonale). */
export function axisFromCorner(signs) {
  const len = Math.hypot(...signs) || 1;
  return signs.map((v) => v / len);
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Recolle un vecteur tourné sur un slot Skewb :
 * coin (±1,±1,±1) ou centre (±e_i).
 */
export function snapSlot(v) {
  const abs = v.map(Math.abs);
  if (abs[0] + abs[1] + abs[2] > 1.5) {
    return v.map((x) => (Math.abs(x) < 1e-6 ? 0 : Math.sign(x)));
  }
  let i = 0;
  if (abs[1] > abs[i]) i = 1;
  if (abs[2] > abs[i]) i = 2;
  const out = [0, 0, 0];
  out[i] = Math.sign(v[i]) || 1;
  return out;
}

function turnAngle(turn) {
  if (typeof turn.angle === 'number' && turn.angle !== 0) return turn.angle;
  if (turn.steps < 0 || turn.steps === 2) return -THIRD;
  if (!turn.steps) return 0;
  return THIRD;
}

/**
 * Tourne le demi-espace `tip · slot > 0` (le coin attrapé + 3 coins + 3 centres).
 * Le coin opposé et l’autre moitié restent immobiles.
 * Slot et orientation viennent du même quaternion.
 */
export function applyTipTurn(state, tip, angle) {
  const next = cloneState(state);
  if (!angle) return next;

  const qDelta = quatFromAxisAngle(axisFromCorner(tip), angle);

  for (const id of Object.keys(next.byId)) {
    const pose = next.byId[id];
    if (dot(pose.slot, tip) <= 0) continue;
    pose.slot = snapSlot(quatRotateVec(qDelta, pose.slot));
    pose.quat = quatNormalize(quatMultiply(qDelta, pose.quat));
  }
  return next;
}

function movingIdsForTip(state, tip) {
  const ids = [];
  for (const id of Object.keys(state.byId)) {
    const slot = state.byId[id].slot;
    if (dot(slot, tip) > 0) ids.push(id);
  }
  return ids;
}

/** 4 coins du « haut » (composante U > 0), ordonnancés 1..4. */
function upperCorners(frame) {
  const U = [0, 0, 0];
  U[{ x: 0, y: 1, z: 2 }[frame.U.axis]] = frame.U.sign;
  const F = [0, 0, 0];
  F[{ x: 0, y: 1, z: 2 }[frame.F.axis]] = frame.F.sign;
  const R = [0, 0, 0];
  R[{ x: 0, y: 1, z: 2 }[frame.R.axis]] = frame.R.sign;

  const tops = CORNERS.filter((c) => dot(c, U) > 0);
  // 1 = front-right, 2 = front-left, 3 = back-right, 4 = back-left
  const score = (c) => ({
    f: dot(c, F),
    r: dot(c, R),
    c,
  });
  const ranked = tops.map(score);
  const find = (fWant, rWant) => ranked.find((t) => Math.sign(t.f) === fWant && Math.sign(t.r) === rWant)?.c;
  return {
    1: find(1, 1),
    2: find(1, -1),
    3: find(-1, 1),
    4: find(-1, -1),
  };
}

const TOKEN = /^([1-4RLBU])(')?$/;
const ALIAS = { R: '1', L: '2', B: '3', U: '4', r: '1', l: '2', b: '3', u: '4' };

function toTurn(token, frame = DEFAULT_FRAME) {
  const match = TOKEN.exec(token);
  if (!match) return null;
  let name = match[1];
  if (ALIAS[name]) name = ALIAS[name];
  const prime = Boolean(match[2]);
  const map = upperCorners(frame);
  const tip = map[name];
  if (!tip) return null;
  const steps = prime ? -1 : 1;
  const angle = steps * THIRD;
  return { tip: tip.slice(), angle, steps };
}

function turnToToken(turn, frame = DEFAULT_FRAME) {
  if (!turn?.tip) return null;
  const map = upperCorners(frame);
  for (const [name, tip] of Object.entries(map)) {
    if (tip && tip.every((v, i) => v === turn.tip[i])) {
      const prime = turn.steps < 0 || turn.angle < 0;
      return prime ? `${name}'` : name;
    }
  }
  return null;
}

function invert(token) {
  if (token.endsWith("'")) return token.slice(0, -1);
  return `${token}'`;
}

function invertAlg(tokens) {
  const list = typeof tokens === 'string' ? parseAlg(tokens) : tokens;
  return list.slice().reverse().map(invert);
}

function parseAlg(alg) {
  return alg.trim().split(/\s+/).filter((t) => Boolean(toTurn(t)));
}

function scramble(length = 20) {
  return randomMoves(['1', '2', '3', '4'], ['', "'"], length);
}

function apply(state, turn) {
  return applyTipTurn(state, turn.tip, turnAngle(turn));
}

function movingIds(state, turn) {
  return movingIdsForTip(state, turn.tip);
}

const drag = {
  angle: THIRD,
  lockDistance: 0.12,
  commitRatio: 0.28,

  /**
   * Sur un coin : tip = ses signes.
   * Sur un centre : choisir le tip adjacent selon la direction du drag.
   */
  resolve(hit, { piece, piecePose, delta }) {
    if (!piece) return null;
    if (piece.kind === 'corner') {
      const tip = piecePose.slot.slice();
      return { tip };
    }
    // Centre : 3 coins adjacents (même demi-espace que la normale)
    const n = piecePose.slot;
    const candidates = CORNERS.filter((c) => dot(c, n) > 0);
    // Choisir le coin dont la tangente (axis × something) aligne le mieux le drag
    let best = candidates[0];
    let bestScore = -Infinity;
    for (const tip of candidates) {
      // Tangente approx : tip × normal direction in plane
      const tx = tip[1] * n[2] - tip[2] * n[1];
      const ty = tip[2] * n[0] - tip[0] * n[2];
      const tz = tip[0] * n[1] - tip[1] * n[0];
      const score = Math.abs(delta.x * tx + delta.y * ty + delta.z * tz);
      if (score > bestScore) {
        bestScore = score;
        best = tip;
      }
    }
    return { tip: best.slice() };
  },

  /** Rayon depuis le centre du puzzle, pas depuis l’axe : sensation de drag d’origine. */
  radius(start) {
    return Math.hypot(start[0], start[1], start[2]);
  },
};

/** Géométrie déjà en world : pas de translation, seulement state.quat. */
function slotWorld() {
  return [0, 0, 0];
}

/** @type {import('../types.js').PuzzleDefinition} */
export const skewb = {
  id: 'skewb',
  label: 'Skewb',
  family: 'skewb',
  angle: THIRD,
  pieces: PIECES,
  keys: {
    '1': '1', '2': '2', '3': '3', '4': '4',
    r: 'R', l: 'L', b: 'B', u: 'U',
  },
  mirror: false,
  capabilities: { lessons: false, solver: false, race: false },
  authored: 'world',
  Piece: SkewbPiece,

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
  createState: () => createSolvedState(PIECES),
  isSolved: (state) => isSolvedByColor(PIECES, state),
  turnAxis: (turn) => axisFromCorner(turn.tip),

  slotWorld,
  drag,

  moveLabels: {
    1: 'Coin 1', 2: 'Coin 2', 3: 'Coin 3', 4: 'Coin 4',
    R: 'Coin 1', L: 'Coin 2', B: 'Coin 3', U: 'Coin 4',
  },

  createCornerGeometry,
  createCenterGeometry,
  createCornerStickers,
  createCenterStickers,
  HALF,
  STICKER_LIFT,
};

export { PIECES as SKEWB_PIECES, CORNERS, upperCorners };
