// @ts-check
import { BufferAttribute, BufferGeometry, Quaternion, Vector3 } from 'three';

/** Demi-arête du cube (même boîte que le 3×3). */
export const HALF = 1.5;
/** Jeu entre pièces pour voir les coupes. */
export const GAP = 0.02;
export const STICKER_LIFT = 0.003;
const STICKER_INSET = 0.08;

const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _n = new Vector3();

/** Normale unitaire du triangle `[p, q, r]` (sens direct) ; écrite dans `_n` */
function triNormal([p, q, r]) {
  _a.fromArray(p);
  _b.fromArray(q);
  _c.fromArray(r);
  return _n.subVectors(_b, _a).cross(_c.clone().sub(_a)).normalize();
}

/** Ajoute le triangle `tri` (trois sommets et leur normale) au maillage `mesh` */
function pushTri(mesh, tri) {
  const normal = triNormal(tri);
  for (const v of tri) {
    mesh.positions.push(v[0], v[1], v[2]);
    mesh.normals.push(normal.x, normal.y, normal.z);
  }
}

/** Le triangle rétréci vers son centre de la part `inset` */
function shrinkTri(tri, inset) {
  const centre = [0, 1, 2].map((k) => (tri[0][k] + tri[1][k] + tri[2][k]) / 3);
  const t = 1 - inset;
  return tri.map((v) => v.map((c, k) => centre[k] + (c - centre[k]) * t));
}

/** Le triangle décollé de `amount` le long de sa normale */
function liftTri(tri, amount) {
  const normal = triNormal(tri);
  return tri.map((v) => [v[0] + normal.x * amount, v[1] + normal.y * amount, v[2] + normal.z * amount]);
}

function toGeometry(positions, normals) {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  return geo;
}

/**
 * Les sommets d’un coin dans l’octant `[sx, sy, sz]` : la pointe du cube et
 * les trois milieux d’arêtes de la coupe. `flip` : une réflexion (det < 0),
 * l’ordre des sommets s’inverse pour garder les normales sortantes.
 */
function cornerPoints([sx, sy, sz]) {
  const h = HALF - GAP;
  return {
    h,
    tip: [sx * h, sy * h, sz * h],
    a: [sx * h, sy * h, 0],
    b: [sx * h, 0, sz * h],
    c: [0, sy * h, sz * h],
    flip: sx * sy * sz < 0,
  };
}

/**
 * Coin skewb dans l’octant (sx,sy,sz).
 * Tétraèdre : tip cube + 3 milieux d’arêtes (coupe Skewb).
 */
export function createCornerGeometry(sx, sy, sz) {
  const { tip, a, b, c, flip } = cornerPoints([sx, sy, sz]);
  const mesh = { positions: [], normals: [] };
  const face = (p, q, r) => pushTri(mesh, flip ? [p, r, q] : [p, q, r]);

  face(a, b, c);       // coupe
  face(tip, b, a);     // |X|
  face(tip, a, c);     // |Y|
  face(tip, c, b);     // |Z|

  return toGeometry(mesh.positions, mesh.normals);
}

/**
 * Stickers triangulaires du coin — un par face colorée.
 * @returns {{ color: string, geometry: BufferGeometry }[]}
 */
export function createCornerStickers(octant, faces) {
  const { h, tip, a, b, c, flip } = cornerPoints(octant);

  // face axis → triangle (tip + 2 midpoints)
  const faceTris = {
    0: [tip, b, a], // ±X
    1: [tip, a, c], // ±Y
    2: [tip, c, b], // ±Z
  };

  return faces.map((face) => {
    const [p, q, r] = faceTris[face.axis];
    const lifted = liftTri(shrinkTri(flip ? [p, r, q] : [p, q, r], STICKER_INSET / h), STICKER_LIFT);
    const mesh = { positions: [], normals: [] };
    pushTri(mesh, lifted);
    pushTri(mesh, [lifted[0], lifted[2], lifted[1]]);
    return { color: face.color, geometry: toGeometry(mesh.positions, mesh.normals) };
  });
}

const FACE_DIRS = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};

/**
 * Base orthonormée d’une face : sa normale `n`, et `U`, `V` dans son plan.
 * @param {string} face
 */
function faceBasis(face) {
  const n = FACE_DIRS[face];
  const [nx, ny, nz] = n;
  const u = Math.abs(nx) < 0.5 ? [1, 0, 0] : [0, 1, 0];
  const ux = u[1] * nz - u[2] * ny;
  const uy = u[2] * nx - u[0] * nz;
  const uz = u[0] * ny - u[1] * nx;
  const ulen = Math.hypot(ux, uy, uz) || 1;
  const U = [ux / ulen, uy / ulen, uz / ulen];
  const V = [ny * U[2] - nz * U[1], nz * U[0] - nx * U[2], nx * U[1] - ny * U[0]];
  return { n, U, V };
}

/**
 * Centre skewb sur une face : pyramide à base losange (milieux d’arêtes).
 */
export function createCenterGeometry(face) {
  const h = HALF - GAP;
  const { n: [nx, ny, nz], U, V } = faceBasis(face);

  // Losange = carré tourné 45° : points ±h·U, ±h·V sur le plan de la face
  const onFace = (x, y, z) => [
    x + nx * h,
    y + ny * h,
    z + nz * h,
  ];
  const outer = [
    onFace(U[0] * h, U[1] * h, U[2] * h),
    onFace(V[0] * h, V[1] * h, V[2] * h),
    onFace(-U[0] * h, -U[1] * h, -U[2] * h),
    onFace(-V[0] * h, -V[1] * h, -V[2] * h),
  ];
  // Sommet intérieur (peu profond)
  const depth = h * 0.55;
  const tip = [nx * (h - depth), ny * (h - depth), nz * (h - depth)];

  const mesh = { positions: [], normals: [] };
  // Face externe
  pushTri(mesh, [outer[0], outer[1], outer[2]]);
  pushTri(mesh, [outer[0], outer[2], outer[3]]);
  // Latéraux
  for (let i = 0; i < 4; i++) pushTri(mesh, [outer[i], tip, outer[(i + 1) % 4]]);

  return toGeometry(mesh.positions, mesh.normals);
}

/** Sticker losange du centre. */
export function createCenterStickers(face, color) {
  const h = HALF - GAP;
  const { n: [nx, ny, nz], U, V } = faceBasis(face);

  const s = h * (1 - STICKER_INSET / h);
  const lift = HALF + STICKER_LIFT - GAP;
  const pt = (su, sv) => [
    nx * lift + U[0] * su + V[0] * sv,
    ny * lift + U[1] * su + V[1] * sv,
    nz * lift + U[2] * su + V[2] * sv,
  ];
  const outer = [
    pt(s, 0),
    pt(0, s),
    pt(-s, 0),
    pt(0, -s),
  ];

  const mesh = { positions: [], normals: [] };
  pushTri(mesh, [outer[0], outer[1], outer[2]]);
  pushTri(mesh, [outer[0], outer[2], outer[3]]);
  pushTri(mesh, [outer[0], outer[2], outer[1]]);
  pushTri(mesh, [outer[0], outer[3], outer[2]]);

  return [{ color, geometry: toGeometry(mesh.positions, mesh.normals) }];
}

/** @deprecated — plus de home-quat : géométrie déjà en world. */
export function cornerOrientation() {
  return new Quaternion();
}

/** @deprecated */
export function centerOrientation() {
  return new Quaternion();
}
