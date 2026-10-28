// @ts-check
// Les cartes du plastique (corps ABS, stickers vinyle), en octets RGBA : du
// calcul pur, sans three, pour tourner dans un worker

export const PLASTIC_SIZE = 256;

// Générateur pseudo-aléatoire déterministe : mêmes textures à chaque chargement
/** @param {number} seed */
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bruit de valeur fBm, périodique sur `size` pour se répéter sans couture
/**
 * @param {number} size
 * @param {{ octaves: number, baseCells: number, gain?: number, seed?: number }} options
 */
function fbm(size, { octaves, baseCells, gain = 0.5, seed = 1 }) {
  const rand = mulberry32(seed);
  const out = new Float32Array(size * size);
  let amplitude = 1;
  let total = 0;

  for (let o = 0; o < octaves; o++) {
    const cells = baseCells << o;
    const lattice = Float32Array.from({ length: cells * cells }, rand);
    const step = cells / size;
    for (let y = 0; y < size; y++) {
      const gy = y * step;
      const y0 = Math.floor(gy);
      const ty = gy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      const r0 = (y0 % cells) * cells;
      const r1 = ((y0 + 1) % cells) * cells;
      for (let x = 0; x < size; x++) {
        const gx = x * step;
        const x0 = Math.floor(gx);
        const tx = gx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const c0 = x0 % cells;
        const c1 = (x0 + 1) % cells;
        const top = lattice[r0 + c0] + (lattice[r0 + c1] - lattice[r0 + c0]) * sx;
        const bottom = lattice[r1 + c0] + (lattice[r1 + c1] - lattice[r1 + c0]) * sx;
        out[y * size + x] += (top + (bottom - top) * sy) * amplitude;
      }
    }
    total += amplitude;
    amplitude *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

// Normal map (espace tangent) déduite d'un champ de hauteur par différences centrales
/**
 * @param {number} size
 * @param {Float32Array} height
 * @param {number} strength
 */
function normalData(size, height, strength) {
  const data = new Uint8Array(size * size * 4);
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      // Normalisation à la main (comme Vector3.normalize) : pas d’objet par pixel
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      data[i] = (-dx * inv * 0.5 + 0.5) * 255;
      data[i + 1] = (-dy * inv * 0.5 + 0.5) * 255;
      data[i + 2] = (inv * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  return data;
}

// Roughness map : la valeur (0..1) multiplie material.roughness (canal vert)
/**
 * @param {number} size
 * @param {Float32Array} field
 * @param {[number, number]} range la roughness à 0, puis à 1
 */
function roughnessData(size, field, [min, max]) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < field.length; i++) {
    const v = Math.max(0, Math.min(1, min + (max - min) * field[i])) * 255;
    const j = i * 4;
    data[j] = v;
    data[j + 1] = v;
    data[j + 2] = v;
    data[j + 3] = 255;
  }
  return data;
}

// Rayures fines dans la roughness : zones légèrement plus brillantes, comme un plastique manipulé
/**
 * @param {number} size
 * @param {Float32Array} field
 * @param {{ count: number, seed: number }} scratches combien, et la graine du hasard
 */
function addScratches(size, field, { count, seed }) {
  const rand = mulberry32(seed);
  for (let s = 0; s < count; s++) {
    let x = rand() * size;
    let y = rand() * size;
    const angle = rand() * Math.PI;
    const length = 10 + rand() * 60;
    const depth = 0.15 + rand() * 0.25;
    for (let t = 0; t < length; t++) {
      const i = (Math.floor(y + size) % size) * size + (Math.floor(x + size) % size);
      field[i] = Math.max(0, field[i] - depth);
      x += Math.cos(angle);
      y += Math.sin(angle);
    }
  }
}

/**
 * Toutes les cartes, `PLASTIC_SIZE`² pixels RGBA chacune.
 *
 * @returns {Record<string, Uint8Array>}
 */
export function plasticMaps() {
  const size = PLASTIC_SIZE;
  // Corps ABS : grain fin injecté (texture moulée), plus quelques rayures
  const grain = fbm(size, { octaves: 3, baseCells: 24, gain: 0.6, seed: 7 });
  const blotches = fbm(size, { octaves: 3, baseCells: 4, seed: 11 });
  const bodyRough = grain.map((g, i) => g * 0.26 + blotches[i] * 0.24);
  addScratches(size, bodyRough, { count: 20, seed: 3 });

  // Stickers vinyle : peau d'orange basse fréquence du vernis, légère variation de brillance
  const peel = fbm(size, { octaves: 3, baseCells: 6, seed: 5 });
  const stickerRough = fbm(size, { octaves: 4, baseCells: 8, seed: 9 });
  addScratches(size, stickerRough, { count: 25, seed: 13 });

  return {
    bodyNormal: normalData(size, grain, 0.5),
    bodyRoughness: roughnessData(size, bodyRough, [0.4, 1]),
    stickerClearcoatNormal: normalData(size, peel, 1.5),
    stickerRoughness: roughnessData(size, stickerRough, [0.9, 1]),
    stickerMirrorNormal: normalData(size, peel, 0.15),
    stickerMirrorRoughness: roughnessData(size, stickerRough, [0.001, 0.9]),
    stickerMirrorClearcoatNormal: normalData(size, peel, 0.5),
  };
}
