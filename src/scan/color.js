// @ts-check

/**
 * Lire les couleurs d’un cube photographié. Pas de comparaison
 * d’images : chaque sticker est lu, puis rangé avec le centre qui lui
 * ressemble le plus. Les centres ne bougent jamais : ils donnent la vraie
 * couleur de chaque face sous la lumière du moment.
 */

/** Écart par canal (0..255) jusqu’auquel un pixel compte comme la couleur du sticker */
const NEAR = 40;

/** Poids de la clarté : une ombre ou un reflet la change plus que la teinte */
const LIGHTNESS = 0.6;

/** @param {number} c canal sRGB 0..255 */
const linear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/**
 * sRGB → OKLab (Björn Ottosson) : les distances y suivent l’œil.
 * @param {number[]} rgb 0..255
 * @returns {[number, number, number]} L, a, b
 */
export function toOklab([red, green, blue]) {
  const r = linear(red);
  const g = linear(green);
  const b = linear(blue);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** @param {number[]} p @param {number[]} q */
const distance = (p, q) => Math.hypot(LIGHTNESS * (p[0] - q[0]), p[1] - q[1], p[2] - q[2]);

/**
 * Couleur et netteté d’un sticker. La couleur est la médiane d’un petit
 * carré autour de son milieu : un flou local qui ignore un reflet ou un
 * bout de joint. La netteté (`share`, 0..1) est la part du carré proche de
 * cette médiane : un bord de joint la baisse un peu, un carré à cheval sur
 * deux couleurs beaucoup.
 * @param {{ data: ArrayLike<number>, width: number, height: number }} image RGBA
 * @param {number[]} centre milieu `[x, y]` (px)
 * @param {number} half demi-côté du carré (px)
 * @returns {{ rgb: [number, number, number], share: number }}
 */
export function patchStats({ data, width, height }, [x, y], half) {
  const channels = [[], [], []];
  const left = Math.max(0, Math.round(x - half));
  const right = Math.min(width - 1, Math.round(x + half));
  const top = Math.max(0, Math.round(y - half));
  const bottom = Math.min(height - 1, Math.round(y + half));
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      const at = (row * width + col) * 4;
      for (let c = 0; c < 3; c += 1) channels[c].push(data[at + c]);
    }
  }
  const rgb = /** @type {[number, number, number]} */ (
    channels.map((values) => [...values].sort((p, q) => p - q)[values.length >> 1])
  );
  const count = channels[0].length;
  let near = 0;
  for (let i = 0; i < count; i += 1) {
    if (channels.every((values, c) => Math.abs(values[i] - rgb[c]) <= NEAR)) near += 1;
  }
  return { rgb, share: count ? near / count : 0 };
}

/**
 * Couleur d’un sticker seulement (`patchStats`).
 * @param {{ data: ArrayLike<number>, width: number, height: number }} image RGBA
 * @param {number[]} centre
 * @param {number} half
 */
export function readPatch(image, centre, half) {
  return patchStats(image, centre, half).rgb;
}

/**
 * Affectation de coût minimal (méthode hongroise, matrice carrée).
 * @param {number[][]} cost
 * @returns {number[]} colonne choisie pour chaque ligne
 */
function assign(cost) {
  const n = cost.length;
  const potentials = {
    u: Array(n + 1).fill(0),
    v: Array(n + 1).fill(0),
    owner: Array(n + 1).fill(0),
    way: Array(n + 1).fill(0),
  };
  for (let row = 1; row <= n; row += 1) addRow(cost, potentials, row);
  const chosen = Array(n).fill(0);
  for (let j = 1; j <= n; j += 1) if (potentials.owner[j]) chosen[potentials.owner[j] - 1] = j - 1;
  return chosen;
}

/** Une ligne de plus dans l’affectation : on cherche un chemin augmentant, puis on le suit à rebours */
function addRow(cost, p, row) {
  const n = cost.length;
  p.owner[0] = row;
  let col = 0;
  const search = { least: Array(n + 1).fill(Infinity), used: Array(n + 1).fill(false) };
  do {
    search.used[col] = true;
    const { delta, next } = cheapestColumn(cost, p, { ...search, col });
    shiftPotentials(p, search, delta);
    col = next;
  } while (p.owner[col] !== 0);
  do {
    const prev = p.way[col];
    p.owner[col] = p.owner[prev];
    col = prev;
  } while (col);
}

/** La colonne libre la moins chère depuis `col`, en notant le chemin (`way`) */
function cheapestColumn(cost, p, { least, used, col }) {
  const r = p.owner[col];
  let delta = Infinity;
  let next = 0;
  for (let j = 1; j < least.length; j += 1) {
    if (used[j]) continue;
    const reduced = cost[r - 1][j - 1] - p.u[r] - p.v[j];
    if (reduced < least[j]) {
      least[j] = reduced;
      p.way[j] = col;
    }
    if (least[j] < delta) {
      delta = least[j];
      next = j;
    }
  }
  return { delta, next };
}

/** Les potentiels bougent de `delta` : colonnes visitées d’un côté, les autres de l’autre */
function shiftPotentials(p, { least, used }, delta) {
  for (let j = 0; j < least.length; j += 1) {
    if (used[j]) {
      p.u[p.owner[j]] += delta;
      p.v[j] -= delta;
    } else {
      least[j] -= delta;
    }
  }
}

/** Les faces dans l’ordre des facettes (`FACELETS`) */
const FACES = 'URFDLB';
/** Facette du centre de chaque face : la 5ᵉ de ses 9 */
const CENTRES = [...FACES].map((_, k) => 9 * k + 4);

/** Photo où chaque facette a été lue : U, R, F sur la 1re, D, L, B sur la 2e (`layout.js`) */
const photoOf = (facelet) => (facelet < 27 ? 0 : 1);

/** @param {number[][]} points */
const mean = (points) => points[0].map((_, c) => points.reduce((sum, p) => sum + p[c], 0) / points.length);

/**
 * Range les 54 stickers : chacun prend la face dont la couleur lui ressemble
 * le plus, avec exactement 9 stickers par face (méthode hongroise sur les 48
 * qui ne sont pas des centres).
 *
 * D’abord contre les 6 centres. Puis chaque photo apprend ses propres
 * couleurs (la moyenne de ce qu’elle a lu pour chaque face) et on range de
 * nouveau : une lampe plus chaude sur la 2e photo ne fait plus pencher le
 * blanc vers le jaune.
 * @param {number[][]} rgb couleur lue de chaque facette (index = facette)
 * @returns {{ facelets: string, doubt: number[] }} lettres U R F D L B ;
 *   doute 0 (sûr) … 1, au-dessus de 0,5 la couleur a été forcée par le compte
 */
export function classify(rgb) {
  const lab = rgb.map(toOklab);
  const others = lab.map((_, i) => i).filter((i) => !CENTRES.includes(i));
  const slots = others.length / FACES.length;
  const centres = CENTRES.map((facelet) => lab[facelet]);
  /** @type {number[][][]} référence de chaque face, pour chaque photo */
  let refs = [centres, centres];
  /** @type {number[]} face de chaque facette */
  let faceOf = [];

  for (let round = 0; round < 2; round += 1) {
    const cost = others.map((i) => others.map((_, j) => distance(lab[i], refs[photoOf(i)][Math.floor(j / slots)])));
    const chosen = assign(cost);
    faceOf = Array(54).fill(0);
    CENTRES.forEach((facelet, face) => {
      faceOf[facelet] = face;
    });
    others.forEach((facelet, k) => {
      faceOf[facelet] = Math.floor(chosen[k] / slots);
    });
    refs = [0, 1].map((photo) => centres.map((centre, face) => {
      const seen = faceOf.flatMap((f, i) => (f === face && photoOf(i) === photo ? [lab[i]] : []));
      return seen.length ? mean(seen) : centre;
    }));
  }

  const doubt = faceOf.map((face, facelet) => {
    if (CENTRES.includes(facelet)) return 0;
    const near = refs[photoOf(facelet)].map((ref) => distance(lab[facelet], ref));
    const mine = near[face];
    const rival = Math.min(...near.filter((_, f) => f !== face));
    return mine + rival === 0 ? 0 : mine / (mine + rival);
  });
  return { facelets: faceOf.map((face) => FACES[face]).join(''), doubt };
}
