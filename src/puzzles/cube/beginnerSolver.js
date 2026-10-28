// @ts-check
import { cube3 } from './createCube';
import { applyTurns, cloneState } from '../core/state';
import { centerFacing, inspect } from './inspect';
import { compactAlg as compact, invertAlg as inverse } from './notation';

/** Résolution débutant : croix blanche, coins blancs, Belge, croix jaune, coins. */

const DS = [[], ['D'], ['D2'], ["D'"]];
const YAWS = [[], ['y'], ['y2'], ["y'"]];

const INSERT_F = ['F', 'D', "F'"];
const INSERT_R = ["R'", "D'", 'R'];
const INSERT_D = ['F', "D'", "F'", "R'", 'D2', 'R'];
const TWIST_F = ['F', 'D', "F'", "D'", 'F', 'D', "F'"];
const TWIST_R = ["R'", "D'", 'R', 'D', "R'", "D'", 'R'];

const BELGE_RIGHT = ["D'", "R'", 'D', 'R', 'D', 'F', "D'", "F'"];
const BELGE_LEFT = ['D', 'L', "D'", "L'", "D'", "F'", 'D', 'F'];

const LINE = ['F', 'R', 'U', "R'", "U'", "F'"];
const ELL = ['F', 'U', 'R', "U'", "R'", "F'"];
const CHAISE = ['R', 'U2', "R'", "U'", 'R', "U'", "R'"];
const CURIEUX = ["L'", 'U', 'R', "U'", 'L', 'U', "R'", "U'"];
const BOUNCE = [...CHAISE, "L'", 'U2', 'L', 'U', "L'", 'U', 'L'];

const EDGE_DIRS = [
  { alg: CHAISE, back: false },
  { alg: inverse(CHAISE), back: true },
];
const CORNER_DIRS = [
  { alg: CURIEUX, back: false },
  { alg: inverse(CURIEUX), back: true },
];
const BOUNCE_DIRS = [
  { alg: BOUNCE, back: false },
  { alg: inverse(BOUNCE), back: true },
];

const COLOR_ORDER = ['top', 'bottom', 'front', 'right', 'back', 'left'];

const WHITE_EDGES = cube3.pieces
  .filter((piece) => piece.kind === 'edge' && piece.faces.some((face) => face.color === 'top'))
  .sort((a, b) => COLOR_ORDER.indexOf(sideColors(a)[0]) - COLOR_ORDER.indexOf(sideColors(b)[0]));

// Ids `x-y-z` à un chiffre : l’ordre des codes suffit, sans le coût du
// premier `localeCompare` (création du collateur ICU au chargement)
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const WHITE_CORNERS = cube3.pieces
  .filter((piece) => piece.kind === 'corner' && piece.faces.some((face) => face.color === 'top'))
  .sort(byId);

const EQ_EDGES = cube3.pieces
  .filter((piece) => piece.kind === 'edge'
    && !piece.faces.some((face) => face.color === 'top' || face.color === 'bottom'))
  .sort(byId);

const YELLOW_EDGES = cube3.pieces
  .filter((piece) => piece.kind === 'edge' && piece.faces.some((face) => face.color === 'bottom'));

const YELLOW_CORNERS = cube3.pieces
  .filter((piece) => piece.kind === 'corner' && piece.faces.some((face) => face.color === 'bottom'));

const ALL = cube3.pieces.filter((piece) => piece.kind !== 'center');
const FIRST_TWO = [...WHITE_EDGES, ...WHITE_CORNERS, ...EQ_EDGES];

function sideColors(piece) {
  return piece.faces
    .map((face) => face.color)
    .filter((color) => color !== 'top' && color !== 'bottom')
    .sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b));
}

export function pieceName(piece) {
  const colors = piece.faces.map((face) => face.color);
  return [...colors].sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b));
}

function applyTokens(state, tokens) {
  if (!tokens.length) return state;
  return applyTurns(cube3, state, tokens.map((token) => cube3.toTurn(token)));
}

function slotDirs(slot) {
  const dirs = [];
  if (slot[1] === 2) dirs.push('U');
  else if (slot[1] === 0) dirs.push('D');
  if (slot[0] === 2) dirs.push('R');
  else if (slot[0] === 0) dirs.push('L');
  if (slot[2] === 2) dirs.push('F');
  else if (slot[2] === 0) dirs.push('B');
  return dirs;
}

function view(state) {
  const pieces = inspect(state);
  return { pieces, byId: new Map(pieces.map((piece) => [piece.id, piece])), ...centerFacing(pieces) };
}

function isSolved(seen, piece) {
  const found = seen.byId.get(piece.id);
  return found.stickers.every((sticker) => seen.colorOf[sticker.dir] === sticker.color);
}

function solvedNow(state, piece) {
  return isSolved(view(state), piece);
}

function allSolved(state, pieces) {
  const seen = view(state);
  return pieces.every((piece) => isSolved(seen, piece));
}

function placedCorner(seen, piece) {
  const found = seen.byId.get(piece.id);
  const wanted = new Set(found.at.map((dir) => seen.colorOf[dir]));
  const has = new Set(found.stickers.map((sticker) => sticker.color));
  if (wanted.size !== has.size) return false;
  for (const color of wanted) if (!has.has(color)) return false;
  return true;
}

/** Le meilleur candidat : le plus de pièces placées, puis le moins de répétitions, puis le plus court */
const beats = (candidate, best) => !best
  || candidate.count > best.count
  || (candidate.count === best.count && (candidate.repeats < best.repeats
    || (candidate.repeats === best.repeats && candidate.tokens.length < best.tokens.length)));

/** Parmi `candidates`, celui qui place le plus de pièces (`score`) sans rien casser (`ok`) */
function pickBest(state, candidates, { start, score, ok }) {
  let best = null;
  for (const { tokens, repeats, back } of candidates) {
    const next = applyTokens(state, tokens);
    if (!ok(next)) continue;
    const count = score(next);
    if (count <= start) continue;
    const candidate = { tokens: compact(tokens), count, repeats, back: repeats === 1 && back };
    if (beats(candidate, best)) best = candidate;
  }
  return best;
}

/** Deux formules de suite, chacune après sa préparation */
const twoAlgs = (setups, dirs) => setups.flatMap((left) => setups.flatMap((right) => dirs.flatMap((first) => dirs.map((second) => ({
  tokens: [...left, ...first.alg, ...right, ...second.alg],
  repeats: 2,
  back: false,
})))));

/**
 * Une formule (`dirs`, dans un sens ou l’autre) après une préparation
 * (`setups`) qui place plus de pièces ; sinon deux. `score` compte les
 * pièces placées, `ok` refuse ce qui casse le reste.
 */
function aim(state, { dirs, setups, score, ok }) {
  const goal = { start: score(state), score, ok };
  const once = setups.flatMap((setup) => dirs.map((dir) => ({ tokens: [...setup, ...dir.alg], repeats: 1, back: dir.back })));
  return pickBest(state, once, goal) ?? pickBest(state, twoAlgs(setups, dirs), goal);
}

function fail(message, tokens) {
  const error = new Error(`${message}${tokens ? ` — ${tokens.join(' ')}` : ''}`);
  error.name = 'GuideError';
  throw error;
}

function keep(state, pieces, label) {
  if (!allSolved(state, pieces)) fail(`${label} a défait une pièce déjà posée`);
}

function yUntil(state, piece, ready) {
  for (const yaw of YAWS) {
    const next = applyTokens(state, yaw);
    if (ready(next)) return { yaw, next };
  }
  return null;
}

function pieceOn(state, piece, dir) {
  return slotDirs(state.byId[piece.id].slot).includes(dir);
}

/**
 * @param {import('../core/state.js').PuzzleState} start
 * @param {string[]} faces
 * @param {(state: import('../core/state.js').PuzzleState) => boolean} goal
 */
/**
 * Le plus court chemin (en profondeur croissante) vers `goal`, avec les
 * faces `faces`, sans dépasser `maxDepth` coups.
 * @param {import('../core/state.js').PuzzleState} start
 * @param {{ faces: string[], goal: (state: import('../core/state.js').PuzzleState) => boolean, maxDepth: number }} search
 */
function search(start, { faces, goal, maxDepth }) {
  const moves = faces.flatMap((face) => [face, `${face}'`, `${face}2`]);
  const path = [];
  const visit = (state, depth, last) => {
    if (goal(state)) return true;
    if (!depth) return false;
    for (const token of moves) {
      if (token[0] === last) continue;
      path.push(token);
      if (visit(cube3.apply(state, cube3.toTurn(token)), depth - 1, token[0])) return true;
      path.pop();
    }
    return false;
  };
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    path.length = 0;
    if (visit(start, depth, '')) return path.slice();
  }
  return null;
}

function snapshotEdge(state, piece) {
  const seen = view(state);
  const found = seen.byId.get(piece.id);
  const side = found.stickers.find((sticker) => sticker.color !== 'top');
  return {
    layer: found.at.includes('U') ? 'U' : found.at.includes('D') ? 'D' : 'E',
    white: found.stickers.find((sticker) => sticker.color === 'top').dir,
    side: side.color,
    sideDir: side.dir,
    at: found.at,
  };
}

function dropCrossFromEquator(state, edge, preserved) {
  const at = slotDirs(state.byId[edge.id].slot);
  const candidates = [];
  for (const face of at) {
    for (const mid of ['D', "D'", 'D2']) {
      candidates.push([`${face}'`, mid, face]);
      candidates.push([face, mid, `${face}'`]);
    }
  }
  for (const tokens of candidates) {
    const next = applyTokens(state, tokens);
    if (!pieceOn(next, edge, 'D')) continue;
    if (allSolved(next, preserved)) return tokens;
  }
  return null;
}

function dTo(from, to) {
  const cycle = ['F', 'R', 'B', 'L'];
  const turns = (cycle.indexOf(to) - cycle.indexOf(from) + 4) % 4;
  return DS[turns];
}

/**
 * Place les pièces une à une : une pièce déjà juste est notée « done » ;
 * sinon `place(state, piece, preserved)` rend la décision et l’état d’après.
 * Les pièces posées entrent dans `preserved`, que la suite ne doit pas casser.
 */
function placeEach(state, { id, pieces, preserved, place }) {
  const decisions = [];
  for (const piece of pieces) {
    if (solvedNow(state, piece)) {
      decisions.push({ kind: 'done', piece, tokens: [] });
    } else {
      const placed = place(state, piece, preserved);
      decisions.push(placed.decision);
      state = placed.state;
    }
    preserved.push(piece);
  }
  return { id, state, decisions };
}

/** Arête de la croix blanc dessous : glissée sous sa place, puis un demi-tour la remonte */
function raiseCrossEdge({ state, edge, preserved }, { tokens, cur, mid, shot }) {
  const home = view(cur).dirOf[mid.side];
  const all = [...tokens, ...dTo(mid.sideDir, home), `${home}2`];
  const next = applyTokens(state, all);
  if (!solvedNow(next, edge)) fail('croix : remontée', all);
  keep(next, preserved, 'croix');
  return { state: next, decision: { kind: 'cross-down', piece: edge, tokens: all, shot } };
}

/** Arête de la croix blanc sur le côté : le plus court chemin qui la pose sans rien casser */
function searchCrossEdge({ state, edge, preserved }, { tokens, cur, mid, shot }) {
  const home = view(cur).dirOf[mid.side];
  const faces = [...new Set(['D', mid.sideDir, home, 'F', 'R', 'L', 'B'])];
  const goal = (next) => solvedNow(next, edge) && allSolved(next, preserved);
  const found = search(cur, { faces, goal, maxDepth: 4 }) ?? search(cur, { faces: faces.slice(0, 4), goal, maxDepth: 5 });
  if (!found) fail('croix : blanc sur le côté', [edge.id, ...tokens]);
  const all = [...tokens, ...found];
  const next = applyTokens(state, all);
  keep(next, preserved, 'croix');
  return { state: next, decision: { kind: shot.layer === 'D' ? 'cross-flip' : 'cross-move', piece: edge, tokens: all, shot } };
}

/** Une arête de la croix : d’abord en bas (depuis le haut ou le milieu), puis à sa place */
function placeCrossEdge(state, edge, preserved) {
  const shot = snapshotEdge(state, edge);
  let tokens = [];
  if (shot.layer === 'U') tokens = [`${shot.at.find((dir) => dir !== 'U')}2`];
  else if (shot.layer === 'E') {
    tokens = dropCrossFromEquator(state, edge, preserved);
    if (!tokens) fail('croix : arête de côté', [edge.id]);
  }
  const cur = applyTokens(state, tokens);
  const mid = snapshotEdge(cur, edge);
  const at = { tokens, cur, mid, shot };
  const piece = { state, edge, preserved };
  return mid.white === 'D' ? raiseCrossEdge(piece, at) : searchCrossEdge(piece, at);
}

function solveCross(state) {
  return placeEach(state, { id: 'cross', pieces: WHITE_EDGES, preserved: [], place: placeCrossEdge });
}

/** Le coin est-il à la place faite de ces trois faces ? (pour `yUntil`) */
const cornerAt = (corner, dirs) => (next) => {
  const at = slotDirs(next.byId[corner.id].slot);
  return dirs.every((dir) => at.includes(dir));
};
const UFR = ['U', 'F', 'R'];
const DFR = ['D', 'F', 'R'];

/** La face où regarde le blanc du coin */
const whiteOf = (state, corner) => view(state).byId.get(corner.id).stickers.find((sticker) => sticker.color === 'top').dir;

/** Coin à sa place mais tordu : on le tourne sur lui-même */
function twistCorner(state, corner) {
  const parked = yUntil(state, corner, cornerAt(corner, UFR));
  if (!parked) fail('coin : orientation', [corner.id]);
  const twist = whiteOf(parked.next, corner) === 'R' ? TWIST_R : TWIST_F;
  return { tokens: compact([...parked.yaw, ...twist]), kind: 'corner-twist' };
}

/** Les départs d’un coin : là où il est, s’il est en bas ; sinon descendu sans rien casser */
function cornerStarts(state, corner, preserved) {
  if (!pieceOn(state, corner, 'U')) return [{ tokens: [], next: state }];
  const parked = yUntil(state, corner, cornerAt(corner, UFR));
  if (!parked) fail('coin : descente', [corner.id]);
  const starts = [INSERT_F, INSERT_R]
    .map((kick) => [...parked.yaw, ...kick])
    .map((attempt) => ({ tokens: attempt, next: applyTokens(state, attempt) }))
    .filter(({ next }) => pieceOn(next, corner, 'D') && allSolved(next, preserved));
  if (!starts.length) fail('coin : descente impossible', [corner.id]);
  return starts;
}

/** Depuis un départ et un tour du bas : le coin sous sa place, puis inséré ; null s’il n’y arrive pas */
function insertFrom({ state, corner, preserved, onTop }, start, spin) {
  const aligned = applyTokens(start.next, spin);
  const homes = colorDirs(view(start.next), sideColors(corner));
  if (!homes.every((dir) => slotDirs(aligned.byId[corner.id].slot).includes(dir))) return null;
  const parked = yUntil(aligned, corner, cornerAt(corner, DFR));
  if (!parked) return null;
  const white = whiteOf(parked.next, corner);
  const trig = white === 'F' ? INSERT_F : white === 'R' ? INSERT_R : INSERT_D;
  const tokens = compact([...start.tokens, ...spin, ...parked.yaw, ...trig]);
  const next = applyTokens(state, tokens);
  if (!solvedNow(next, corner) || !allSolved(next, preserved)) return null;
  const down = white === 'D';
  return { tokens, kind: onTop ? (down ? 'corner-drop-down' : 'corner-drop') : (down ? 'corner-down' : 'corner-insert') };
}

/** Le coin descendu (s’il le faut), puis inséré par le plus court chemin */
function insertCorner(state, corner, preserved) {
  const ctx = { state, corner, preserved, onTop: pieceOn(state, corner, 'U') };
  let best = null;
  for (const start of cornerStarts(state, corner, preserved)) {
    for (const spin of DS) {
      const candidate = insertFrom(ctx, start, spin);
      if (candidate && (!best || candidate.tokens.length < best.tokens.length)) best = candidate;
    }
  }
  if (!best) fail('coin non posé', [corner.id]);
  return best;
}

/** Un coin blanc : tordu sur place, ou descendu puis inséré */
function placeCorner(state, corner, preserved) {
  const seen = view(state);
  const found = seen.byId.get(corner.id);
  const { tokens, kind } = found.at.includes('U') && placedCorner(seen, corner)
    ? twistCorner(state, corner)
    : insertCorner(state, corner, preserved);
  const next = applyTokens(state, tokens);
  if (!solvedNow(next, corner)) fail('coin non posé', tokens);
  keep(next, preserved, 'coins blancs');
  return { state: next, decision: { kind, piece: corner, tokens, shot: { at: found.at } } };
}

function solveCorners(state) {
  return placeEach(state, { id: 'corners', pieces: WHITE_CORNERS, preserved: [...WHITE_EDGES], place: placeCorner });
}

function colorDirs(seen, colors) {
  return colors.map((color) => seen.dirOf[color]);
}

/** @type {[string, string[]][]} */
const BELGE_SIDES = [['right', BELGE_RIGHT], ['left', BELGE_LEFT]];
// Chaque Belge, après une rotation du cube et un tour du bas, déjà compacté
const BELGE_MOVES = YAWS.flatMap((yaw) => DS.flatMap((spin) => BELGE_SIDES.map(([kind, alg]) => ({
  kind,
  tokens: compact([...yaw, ...spin, ...alg]),
}))));

/** Les Belges qui mènent l’arête là où `accept` le veut sans rien casser, du plus court au plus long */
function belgeMacros(state, edge, { preserved, accept }) {
  const found = [];
  for (const { kind, tokens } of BELGE_MOVES) {
    const next = applyTokens(state, tokens);
    if (accept(next, edge) && allSolved(next, preserved)) found.push({ tokens, kind, next });
  }
  found.sort((a, b) => a.tokens.length - b.tokens.length);
  return found;
}

const solvedAccept = (next, piece) => solvedNow(next, piece);

/** Arête coincée au milieu : un Belge la fait sortir en bas, un autre la pose */
function belgeOut(state, edge, preserved) {
  let best = null;
  for (const ejected of belgeMacros(state, edge, { preserved, accept: (next, piece) => pieceOn(next, piece, 'D') })) {
    const inserted = belgeMacros(ejected.next, edge, { preserved, accept: solvedAccept })[0];
    const tokens = inserted && compact([...ejected.tokens, ...inserted.tokens]);
    if (tokens && (!best || tokens.length < best.tokens.length)) best = { tokens, side: inserted.kind };
  }
  if (!best) fail('belge : sortie', [edge.id]);
  return best;
}

/** Une arête du milieu : un Belge direct, ou sortie puis posée */
function placeBelgeEdge(state, edge, preserved) {
  const onBottom = pieceOn(state, edge, 'D');
  const direct = belgeMacros(state, edge, { preserved, accept: solvedAccept })[0];
  if (!direct && onBottom) fail('belge : insertion', [edge.id]);
  const { tokens, side } = direct ? { tokens: direct.tokens, side: direct.kind } : belgeOut(state, edge, preserved);
  const next = applyTokens(state, tokens);
  if (!solvedNow(next, edge)) fail('belge : arête non posée', tokens);
  keep(next, preserved, 'belge');
  return { state: next, decision: { kind: direct ? 'belge' : 'belge-out', piece: edge, tokens, side, onBottom } };
}

function solveBelge(state) {
  return placeEach(state, { id: 'belge', pieces: EQ_EDGES, preserved: [...WHITE_EDGES, ...WHITE_CORNERS], place: placeBelgeEdge });
}

function yellowUp(seen) {
  return seen.dirOf.bottom;
}

function orientedYellow(state) {
  const seen = view(state);
  const up = yellowUp(seen);
  return YELLOW_EDGES.filter((edge) => {
    const found = seen.byId.get(edge.id);
    return found.stickers.some((sticker) => sticker.color === 'bottom' && sticker.dir === up);
  });
}

function yellowPattern(state) {
  const seen = view(state);
  const up = yellowUp(seen);
  const sides = [];
  for (const edge of YELLOW_EDGES) {
    const found = seen.byId.get(edge.id);
    const yellow = found.stickers.find((sticker) => sticker.color === 'bottom');
    if (yellow.dir !== up) continue;
    sides.push(found.at.find((dir) => dir !== 'U' && dir !== 'D'));
  }
  if (sides.length === 0) return 'point';
  if (sides.length === 4) return 'cross';
  if (sides.length === 2) {
    const opposite = { F: 'B', B: 'F', R: 'L', L: 'R' };
    return opposite[sides[0]] === sides[1] ? 'line' : 'L';
  }
  return 'odd';
}

/** Une décision de formule répétée (chaise, petit curieux, chaise rebondissante) */
const aimDecision = (kind, best, before) => ({
  kind,
  piece: null,
  tokens: best.tokens,
  times: best.repeats,
  ...(before === undefined ? {} : { before }),
  back: best.back,
});

/** Les formules à essayer pour un motif jaune : une ligne, un L, ou les deux */
const yellowOptions = (pattern) => {
  if (pattern === 'line') return [['line', LINE]];
  if (pattern === 'L') return [['L', ELL]];
  return [['line', LINE], ['L', ELL]];
};

/** Un pas de la croix jaune : la formule qui monte le plus d’arêtes jaunes */
function orientYellowStep(state) {
  const pattern = yellowPattern(state);
  let best = null;
  for (const spin of [[], ['U'], ["U'"], ['U2']]) {
    for (const [algKind, alg] of yellowOptions(pattern)) {
      const tokens = compact([...spin, ...alg]);
      const next = applyTokens(state, tokens);
      if (!allSolved(next, FIRST_TWO)) continue;
      const count = orientedYellow(next).length;
      if (!best || count > best.count || (count === best.count && tokens.length < best.tokens.length)) {
        best = { tokens, count, algKind, pattern };
      }
    }
  }
  if (!best || best.count <= orientedYellow(state).length) fail('croix jaune : cas', best?.tokens);
  return { kind: 'yellow-orient', piece: null, tokens: best.tokens, pattern: best.pattern, algKind: best.algKind };
}

const yellowEdgesDone = (state) => YELLOW_EDGES.filter((edge) => solvedNow(state, edge)).length;
const EDGE_SETUPS = [...YAWS, ['U'], ["U'"], ['U2']];

/** Un pas des arêtes jaunes : la chaise qui en place le plus */
function yellowEdgesStep(state) {
  const best = aim(state, {
    dirs: EDGE_DIRS,
    setups: EDGE_SETUPS,
    score: yellowEdgesDone,
    ok: (next) => orientedYellow(next).length === 4 && allSolved(next, FIRST_TWO),
  });
  if (!best) fail('arêtes jaunes : chaise');
  return aimDecision('yellow-edges', best, yellowEdgesDone(state));
}

/** Répète `step` tant que `done` n’est pas vrai, au plus `limit` fois au-delà de la première */
function repeatUntil(state, { done, step, limit, label }) {
  const decisions = [];
  let guard = 0;
  while (!done(state)) {
    if (guard++ > limit) fail(label);
    const decision = step(state);
    decisions.push(decision);
    state = applyTokens(state, decision.tokens);
  }
  return { state, decisions };
}

function solveYellow(start) {
  const flipped = applyTokens(start, ['z2']);
  const oriented = repeatUntil(flipped, { done: (state) => orientedYellow(state).length >= 4, step: orientYellowStep, limit: 4, label: 'croix jaune' });
  const placed = repeatUntil(oriented.state, { done: (state) => yellowEdgesDone(state) >= 4, step: yellowEdgesStep, limit: 6, label: 'arêtes jaunes' });
  keep(placed.state, FIRST_TWO, 'jaune');
  const decisions = [{ kind: 'flip', piece: null, tokens: ['z2'] }, ...oriented.decisions, ...placed.decisions];
  return { id: 'yellow', state: placed.state, decisions };
}

const cornersPlaced = (state) => YELLOW_CORNERS.filter((corner) => placedCorner(view(state), corner)).length;

function solveFinish(start) {
  const edges = [...FIRST_TWO, ...YELLOW_EDGES];
  const permuted = repeatUntil(start, {
    done: (state) => cornersPlaced(state) >= 4,
    step: (state) => {
      const best = aim(state, { dirs: CORNER_DIRS, setups: YAWS, score: cornersPlaced, ok: (next) => allSolved(next, edges) });
      if (!best) fail('petit curieux');
      return aimDecision('corners-perm', best, cornersPlaced(state));
    },
    limit: 6,
    label: 'coins jaunes',
  });
  const oriented = repeatUntil(permuted.state, {
    done: (state) => allSolved(state, YELLOW_CORNERS),
    step: (state) => {
      const best = aim(state, {
        dirs: BOUNCE_DIRS,
        setups: YAWS,
        score: (next) => YELLOW_CORNERS.filter((corner) => solvedNow(next, corner)).length,
        ok: (next) => allSolved(next, edges) && cornersPlaced(next) === 4,
      });
      if (!best) fail('chaise rebondissante');
      return aimDecision('corners-orient', best);
    },
    limit: 6,
    label: 'orientation des coins',
  });
  if (!allSolved(oriented.state, ALL)) fail('cube non fini');
  return { id: 'finish', state: oriented.state, decisions: [...permuted.decisions, ...oriented.decisions] };
}

export function solveBeginner(tokens) {
  let state = applyTokens(cloneState(cube3.createState()), tokens);
  const cross = solveCross(state);
  const corners = solveCorners(cross.state);
  const belge = solveBelge(corners.state);
  const yellow = solveYellow(belge.state);
  const finish = solveFinish(yellow.state);
  return {
    phases: [cross, corners, belge, yellow, finish],
    state: finish.state,
  };
}

export function replaySolved(tokens) {
  const { state } = solveBeginner(tokens);
  return allSolved(state, ALL);
}
