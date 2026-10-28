// @ts-check
import { DEFAULT_FRAME, viewFrame } from '../core/frame';
import { quatFromAxisAngle, quatMultiply, quatNormalize } from '../../lib/math/quat';
import { cloneState } from '../core/state';
import { randomMoves } from '../core/scramble';

export const QUARTER = Math.PI / 2;
export { DEFAULT_FRAME, viewFrame };

const AXIS_INDEX = { x: 0, y: 1, z: 2 };
const AXIS_VEC = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};

// Chaque coup : [repère vue, signe face, portée]
const MOVES_BASE = {
  R: ['R', 1, 'face'],
  L: ['R', -1, 'face'],
  M: ['R', -1, 'slice'],
  x: ['R', 1, 'cube'],
  U: ['U', 1, 'face'],
  D: ['U', -1, 'face'],
  E: ['U', -1, 'slice'],
  y: ['U', 1, 'cube'],
  F: ['F', 1, 'face'],
  B: ['F', -1, 'face'],
  S: ['F', 1, 'slice'],
  z: ['F', 1, 'cube'],
};

const TOKEN = /^([RLUDFBMESxyz])(2'?|'2?)?$/;

/**
 * @param {number} n
 * @returns {(token: string, frame?: object) => object | null}
 */
export function makeToTurn(n) {
  const mid = Math.floor(n / 2);
  return function toTurn(token, frame = DEFAULT_FRAME) {
    const match = TOKEN.exec(token);
    if (!match) return null;
    const name = match[1];
    // M E S : tranche milieu, réservés au 3×3 (et cubes impairs à tranche unique)
    if ('MES'.includes(name) && n !== 3) return null;

    const [base, faceSign, scope] = MOVES_BASE[name];
    const { axis, sign: baseSign } = frame[base];
    const sign = baseSign * faceSign;
    const modifier = match[2] ?? '';
    const turns = modifier.includes('2') ? 2 : 1;
    const direction = modifier.includes("'") ? -1 : 1;
    const angle = -sign * direction * turns * QUARTER;

    let layer = null;
    if (scope === 'face') {
      // +side → outer high index ; -side → outer low index
      layer = sign > 0 ? n - 1 : 0;
    } else if (scope === 'slice') {
      if (n % 2 === 0) return null;
      layer = mid;
      // M follows L (negative), E follows D, S follows F — already in faceSign
    }

    return { axis, layer, angle, turns: direction * turns };
  };
}

/**
 * @param {number} n
 */
export function makeTurnToToken(n) {
  const toTurn = makeToTurn(n);
  // x, y, z en dernier : tout le cube (`layer: null`), joué aux deux doigts
  const faceTokens = n === 3
    ? ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'x', 'y', 'z']
    : ['R', 'L', 'U', 'D', 'F', 'B', 'x', 'y', 'z'];

  return function turnToToken({ axis, layer, angle }, frame = DEFAULT_FRAME) {
    const raw = Math.round(angle / QUARTER) % 4;
    // 3 quarts = 1 quart dans l'autre sens
    const quarters = Math.abs(raw) === 3 ? -Math.sign(raw) : raw;
    if (!quarters) return null;
    const target = Math.sign(quarters) * QUARTER;
    for (const name of faceTokens) {
      for (const token of [name, `${name}'`]) {
        const turn = toTurn(token, frame);
        if (!turn) continue;
        if (turn.axis === axis && turn.layer === layer && Math.sign(turn.angle) === Math.sign(target)) {
          return Math.abs(quarters) === 2 ? `${name}2` : token;
        }
      }
    }
    return null;
  };
}

export function invert(token) {
  if (token.endsWith("'")) return token.slice(0, -1);
  if (token.endsWith('2')) return token;
  return `${token}'`;
}

const amountOf = (token) => {
  if (token.endsWith('2')) return 2;
  return token.endsWith("'") ? 3 : 1;
};
const SUFFIX = ['', '', '2', "'"];

/**
 * Les coups de suite sur la même face se fondent : R R → R2, R R' → rien.
 * La face est la première lettre (coups simples, sans couches numérotées).
 * @param {string[]} tokens
 */
export function compactAlg(tokens) {
  const out = [];
  for (const token of tokens) {
    const last = out.at(-1);
    if (!last || last[0] !== token[0]) {
      out.push(token);
      continue;
    }
    out.pop();
    const turns = (amountOf(last) + amountOf(token)) % 4;
    if (turns) out.push(token[0] + SUFFIX[turns]);
  }
  return out;
}

export function invertAlg(tokens) {
  const list = typeof tokens === 'string' ? parseAlg(tokens) : tokens;
  return list.slice().reverse().map(invert);
}

export function parseAlg(alg) {
  return alg.trim().split(/\s+/).filter((t) => TOKEN.test(t));
}

export function makeScramble(n, length = 20) {
  return (len = length) => randomMoves([...'RLUDFB'], ['', "'", '2'], len);
}

export const CUBE_KEYS = {
  r: 'R', l: 'L', u: 'U', d: 'D', f: 'F', b: 'B',
  m: 'M', e: 'E', s: 'S',
  x: 'x', y: 'y', z: 'z',
};

/**
 * Rotation discrète d’un slot d’indices autour d’un axe (quart de tour three.js).
 * @param {number[]} slot
 * @param {{ axis: 'x'|'y'|'z', steps: number }} turn  steps : +1 = +90° three.js (CCW looking along +axis)
 * @param {number} n
 */
export function rotateSlot(slot, { axis, steps }, n) {
  const half = (n - 1) / 2;
  let [x, y, z] = slot.map((i) => i - half);
  const s = ((steps % 4) + 4) % 4;
  for (let k = 0; k < s; k++) {
    if (axis === 'x') [y, z] = [-z, y];
    else if (axis === 'y') [x, z] = [z, -x];
    else [x, y] = [-y, x];
  }
  return [
    Math.round(x + half),
    Math.round(y + half),
    Math.round(z + half),
  ];
}

/**
 * @param {number} n
 */
export function makeApply(n) {
  return function apply(state, turn) {
    const next = cloneState(state);
    const axisIdx = AXIS_INDEX[turn.axis];
    const angle = turn.angle;
    // steps dans le sens three.js (même signe que angle)
    const steps = Math.round(angle / QUARTER);
    if (!steps) return next;

    const qDelta = quatFromAxisAngle(AXIS_VEC[turn.axis], angle);

    for (const id of Object.keys(next.byId)) {
      const pose = next.byId[id];
      if (turn.layer !== null && pose.slot[axisIdx] !== turn.layer) continue;
      pose.slot = rotateSlot(pose.slot, { axis: turn.axis, steps }, n);
      pose.quat = quatNormalize(quatMultiply(qDelta, pose.quat));
    }
    return next;
  };
}

export function makeMovingIds() {
  return function movingIds(state, turn) {
    if (turn.layer === null) return Object.keys(state.byId);
    const axisIdx = AXIS_INDEX[turn.axis];
    return Object.keys(state.byId).filter(
      (id) => state.byId[id].slot[axisIdx] === turn.layer
    );
  };
}
