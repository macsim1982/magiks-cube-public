// @ts-check
// Icônes de coups : quelles vignettes s’allument et quelles flèches dessiner
// sur les trois faces vues (U, F, R) du RubikIcon. Fonctions pures.
//
// Repère : x vers la droite, y vers le haut, z vers soi. Les tranches valent
// -1, 0 ou 1 le long de l’axe du coup.

const AXES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

// Chaque coup : [axe, sens d’un quart de tour horaire, tranches qui bougent]
// m e s (francocube) : les deux tranches extérieures, dans le sens de M E S.
const MOVES = {
  R: ['x', -1, [1]],
  L: ['x', 1, [-1]],
  M: ['x', 1, [0]],
  r: ['x', -1, [1, 0]],
  l: ['x', 1, [-1, 0]],
  m: ['x', 1, [-1, 1]],
  x: ['x', -1, [-1, 0, 1]],
  U: ['y', -1, [1]],
  D: ['y', 1, [-1]],
  E: ['y', 1, [0]],
  u: ['y', -1, [1, 0]],
  d: ['y', 1, [-1, 0]],
  e: ['y', 1, [-1, 1]],
  y: ['y', -1, [-1, 0, 1]],
  F: ['z', -1, [1]],
  B: ['z', 1, [-1]],
  S: ['z', -1, [0]],
  f: ['z', -1, [1, 0]],
  b: ['z', 1, [-1, 0]],
  s: ['z', -1, [-1, 1]],
  z: ['z', -1, [-1, 0, 1]],
};

// Faces vues : couleur, normale, puis sens des colonnes et des lignes à l’écran
const FACES = {
  U: { color: 'white', normal: [0, 1, 0], col: [1, 0, 0], row: [0, 0, 1] },
  F: { color: 'green', normal: [0, 0, 1], col: [1, 0, 0], row: [0, -1, 0] },
  R: { color: 'red', normal: [1, 0, 0], col: [0, 0, -1], row: [0, -1, 0] },
};

const TOKEN = /^([RLUDFBMESrludfbmesxyz])(2'?|'2?)?$/;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const scale = (a, k) => a.map((v) => v * k);
const add = (...vs) => vs.reduce((sum, v) => sum.map((s, i) => s + v[i]));
const round = (point) => point.map((v) => Math.round(v * 100) / 100);

// Centre d’une vignette (ligne, colonne de 0 à 2) dans le repère du cube
function stickerAt(face, row, col) {
  return add(face.normal, scale(face.col, col - 1), scale(face.row, row - 1));
}

/**
 * @param {string} token  ex. "R", "u'", "M2", "x"
 * @returns {{ faces: Record<string, string[]>, arrows: Record<string, object[]> } | null}
 */
export function moveIcon(token) {
  const match = TOKEN.exec(token);
  if (!match) return null;
  const [axisName, clockwise, layers] = MOVES[match[1]];
  const modifier = match[2] ?? '';
  const axis = AXES[axisName];
  const spin = scale(axis, clockwise * (modifier.includes("'") ? -1 : 1));
  const double = modifier.includes('2');
  const moves = (p) => layers.includes(Math.round(dot(p, axis)));

  /** @type {Record<string, string[]>} */
  const faces = {};
  /** @type {Record<string, object[]>} */
  const arrows = {};
  for (const [name, face] of Object.entries(FACES)) {
    faces[name] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        faces[name].push(moves(stickerAt(face, row, col)) ? face.color : 'hidden');
      }
    }

    const facing = dot(face.normal, axis);
    if (facing !== 0) {
      // La face tourne sur elle-même : flèche ronde
      arrows[name] = moves(face.normal)
        ? [{ kind: 'turn', clockwise: dot(spin, face.normal) < 0, double }]
        : [];
      continue;
    }

    // La face voit passer des lignes : une flèche par ligne, une seule pour tout le cube
    const lines = layers.length === 3 ? [0] : layers;
    arrows[name] = lines.map((layer) => {
      const middle = add(face.normal, scale(axis, layer));
      const v = cross(spin, middle);
      const dir = [dot(v, face.col), dot(v, face.row)];
      const at = [1.5 + dot(middle, face.col), 1.5 + dot(middle, face.row)];
      return {
        kind: 'line',
        from: round([at[0] - dir[0] * 1.2, at[1] - dir[1] * 1.2]),
        to: round([at[0] + dir[0] * 1.2, at[1] + dir[1] * 1.2]),
        double,
      };
    });
  }
  return { faces, arrows };
}

export const MOVE_ICON_TOKENS = Object.keys(MOVES);
