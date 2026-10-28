// @ts-check

/**
 * Un cube lu sticker par sticker (scan) est-il un vrai cube ?
 * Découpage de Kociemba en coins et arêtes, puis les lois du cube : chaque
 * pièce une fois, torsions des coins, retournements des arêtes, parité.
 * Rien à chercher : quelques boucles sur 54 lettres.
 *
 * Indices : ordre de `FACELETS` (U 0–8, R 9–17, F 18–26, D 27–35,
 * L 36–44, B 45–53).
 */

/** Facettes de chaque coin, la facette U ou D d’abord, puis dans le sens horaire. */
const CORNERS = [
  [8, 9, 20], // URF
  [6, 18, 38], // UFL
  [0, 36, 47], // ULB
  [2, 45, 11], // UBR
  [29, 26, 15], // DFR
  [27, 44, 24], // DLF
  [33, 53, 42], // DBL
  [35, 17, 51], // DRB
];
const CORNER_COLORS = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'];

/** Facettes de chaque arête, celle de référence (U/D, sinon F/B) d’abord. */
const EDGES = [
  [5, 10], // UR
  [7, 19], // UF
  [3, 37], // UL
  [1, 46], // UB
  [32, 16], // DR
  [28, 25], // DF
  [30, 43], // DL
  [34, 52], // DB
  [23, 12], // FR
  [21, 41], // FL
  [50, 39], // BL
  [48, 14], // BR
];
const EDGE_COLORS = ['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR'];

/** @param {number[]} order */
function parity(order) {
  let swaps = 0;
  for (let i = 0; i < order.length; i += 1) {
    for (let j = i + 1; j < order.length; j += 1) if (order[i] > order[j]) swaps += 1;
  }
  return swaps % 2;
}

/**
 * @typedef {'count' | 'corner' | 'edge' | 'twist' | 'flip' | 'parity'} Fault
 * @typedef {{ ok: true } | { ok: false, fault: Fault, at: number[] }} Verdict
 */

/**
 * @param {Fault} kind
 * @param {number[]} [at]
 * @returns {Verdict}
 */
const fault = (kind, at = []) => ({ ok: false, fault: kind, at });

/** Une pièce lue deux fois : ses deux places, sinon null */
function twice(pieces, cells, kind) {
  const again = pieces.findIndex((piece, i) => pieces.indexOf(piece) !== i);
  if (again < 0) return null;
  return fault(kind, [...cells[pieces.indexOf(pieces[again])], ...cells[again]]);
}

/** Les coins lus, et la somme de leurs torsions ; `error` : un coin impossible ou en double */
function readCorners(facelets) {
  const pieces = [];
  let twist = 0;
  for (const cells of CORNERS) {
    const ori = cells.findIndex((cell) => facelets[cell] === 'U' || facelets[cell] === 'D');
    const name = ori < 0 ? '' : [0, 1, 2].map((k) => facelets[cells[(ori + k) % 3]]).join('');
    const piece = CORNER_COLORS.indexOf(name);
    if (piece < 0) return { pieces, twist, error: fault('corner', cells) };
    pieces.push(piece);
    twist += ori;
  }
  return { pieces, twist, error: twice(pieces, CORNERS, 'corner') };
}

/** Les arêtes lues, et combien sont retournées ; `error` : une arête impossible ou en double */
function readEdges(facelets) {
  const pieces = [];
  let flip = 0;
  for (const cells of EDGES) {
    const [a, b] = cells.map((cell) => facelets[cell]);
    const straight = EDGE_COLORS.indexOf(a + b);
    const piece = straight >= 0 ? straight : EDGE_COLORS.indexOf(b + a);
    if (straight < 0) flip += 1;
    if (piece < 0) return { pieces, flip, error: fault('edge', cells) };
    pieces.push(piece);
  }
  return { pieces, flip, error: twice(pieces, EDGES, 'edge') };
}

/**
 * `at` : facettes à montrer à l’enfant (vide quand la faute n’a pas de place,
 * comme une torsion ou une parité).
 * @param {string} facelets 54 lettres
 * @returns {Verdict}
 */
export function verifyFacelets(facelets) {
  if ([...'URFDLB'].some((letter) => [...facelets].filter((f) => f === letter).length !== 9)) return fault('count');
  const corners = readCorners(facelets);
  if (corners.error) return corners.error;
  const edges = readEdges(facelets);
  if (edges.error) return edges.error;
  if (corners.twist % 3 !== 0) return fault('twist');
  if (edges.flip % 2 !== 0) return fault('flip');
  if (parity(corners.pieces) !== parity(edges.pieces)) return fault('parity');
  return { ok: true };
}
