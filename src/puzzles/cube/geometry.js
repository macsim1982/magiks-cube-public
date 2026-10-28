// @ts-check
import { BoxGeometry, ExtrudeGeometry, Shape, Vector3 } from 'three';
import { QUARTER } from './notation';

export const GAP = 0.005;
export const UNIT = 1 - GAP;
export const BODY_RADIUS = 0.08;
export const BODY_SEGMENTS = 4;
export const STICKER_RADIUS = 0.05;
const STICKER_MARGIN = 0.2;
const STICKER_DEPTH = 0.001;
const STICKER_BEVEL = 0.001;
const STICKER_LIFT = STICKER_BEVEL + 0.001;

export const FACES = [
  { axis: 0, sign: 1,  color: 'right',  rotation: [0, QUARTER, 0],  dims: [2, 1] },
  { axis: 0, sign: -1, color: 'left',   rotation: [0, -QUARTER, 0], dims: [2, 1] },
  { axis: 1, sign: 1,  color: 'top',    rotation: [-QUARTER, 0, 0], dims: [0, 2] },
  { axis: 1, sign: -1, color: 'bottom', rotation: [QUARTER, 0, 0],  dims: [0, 2] },
  { axis: 2, sign: 1,  color: 'front',  rotation: [0, 0, 0],        dims: [0, 1] },
  { axis: 2, sign: -1, color: 'back',   rotation: [0, Math.PI, 0],  dims: [0, 1] },
];

export const stickerLayout = (face, size, center) => {
  const position = [...center];
  position[face.axis] += face.sign * (size[face.axis] / 2 + STICKER_LIFT);
  return { position };
};

export function stickerSize(face, size) {
  return [
    Math.max(size[face.dims[0]] - STICKER_MARGIN, 0.04),
    Math.max(size[face.dims[1]] - STICKER_MARGIN, 0.04),
  ];
}

const _position = new Vector3();
const _normal = new Vector3();
const _uvNormal = new Vector3();
const _box = new Vector3();
const _faceDir = new Vector3();

// Part de l’arrondi qu’a parcourue la normale, de la face vers l’arête, et
// le côté de l’arête où elle penche (`uvAxis`)
function arcAngle(faceDirVector, normal, { uvAxis, projectionAxis }) {
  const halfArc = Math.PI / 4;
  _uvNormal.copy(normal);
  _uvNormal[projectionAxis] = 0;
  _uvNormal.normalize();
  return {
    ratio: 1 - _uvNormal.angleTo(faceDirVector) / halfArc,
    positive: Math.sign(_uvNormal[uvAxis]) === 1,
  };
}

// UV de chaque face : [direction, puis pour u et v : axe UV, axe projeté,
// côté (0 largeur, 1 hauteur, 2 profondeur), inversé (1 - uv)]
/** @typedef {[('x' | 'y' | 'z'), ('x' | 'y' | 'z'), number, boolean]} UvRule */
/** @type {[[number, number, number], UvRule, UvRule][]} */
const FACE_UVS = [
  [[1, 0, 0], ['z', 'y', 2, false], ['y', 'z', 1, true]],
  [[-1, 0, 0], ['z', 'y', 2, true], ['y', 'z', 1, true]],
  [[0, 1, 0], ['x', 'z', 0, true], ['z', 'x', 2, false]],
  [[0, -1, 0], ['x', 'z', 0, true], ['z', 'x', 2, false]],
  [[0, 0, 1], ['x', 'y', 0, true], ['y', 'x', 1, true]],
  [[0, 0, -1], ['x', 'y', 0, false], ['y', 'x', 1, true]],
];

/**
 * Ce qui, pour chaque sommet du gabarit, ne dépend pas des dimensions :
 * signe de la position, normale, et pour chaque coordonnée UV sa part
 * d’arrondi. Calculé une fois par gabarit : le passage Mirror ↔ couleurs
 * remodèle les 26 corps à chaque image.
 *
 * @param {import('three').BufferGeometry} template
 */
function roundedBoxBasis(template) {
  const segments = template.userData.segments;
  const halfSegmentSize = 0.5 / segments;
  const src = template.attributes.position.array;
  const faceTris = src.length / 6;
  const signs = new Int8Array(src.length);
  const normals = new Float64Array(src.length);
  const uvRatio = new Float64Array((src.length / 3) * 2);
  const uvPositive = new Uint8Array(uvRatio.length);
  const uvSide = new Uint8Array(uvRatio.length);
  const uvFlip = new Uint8Array(uvRatio.length);

  for (let i = 0, j = 0; i < src.length; i += 3, j += 2) {
    _position.fromArray(src, i);
    _normal.copy(_position);
    _normal.x -= Math.sign(_normal.x) * halfSegmentSize;
    _normal.y -= Math.sign(_normal.y) * halfSegmentSize;
    _normal.z -= Math.sign(_normal.z) * halfSegmentSize;
    _normal.normalize();

    signs[i] = Math.sign(_position.x);
    signs[i + 1] = Math.sign(_position.y);
    signs[i + 2] = Math.sign(_position.z);
    normals[i] = _normal.x;
    normals[i + 1] = _normal.y;
    normals[i + 2] = _normal.z;

    const [dir, ...coords] = FACE_UVS[Math.min(Math.floor(i / faceTris), 5)];
    _faceDir.fromArray(dir);
    coords.forEach(([uvAxis, projectionAxis, side, flip], k) => {
      const { ratio, positive } = arcAngle(_faceDir, _normal, { uvAxis, projectionAxis });
      uvRatio[j + k] = ratio;
      uvPositive[j + k] = positive ? 1 : 0;
      uvSide[j + k] = side;
      uvFlip[j + k] = flip ? 1 : 0;
    });
  }

  return { signs, normals, uvRatio, uvPositive, uvSide, uvFlip };
}

/**
 * Gabarit des corps arrondis : un cube unité subdivisé, non indexé, que
 * `reshapeRoundedBox` déforme. Un gabarit par vue, partagé par les pièces.
 *
 * @param {number} [segments]
 * @returns {import('three').BufferGeometry}
 */
export function createBodyTemplate(segments = BODY_SEGMENTS) {
  const segs = segments * 2 + 1;
  const geometry = new BoxGeometry(1, 1, 1, segs, segs, segs).toNonIndexed();
  geometry.userData.segments = segs;
  return geometry;
}

/**
 * Écrit dans `target` (un clone du gabarit) le corps arrondi aux dimensions
 * données : positions, normales, UV. La base du gabarit est calculée au
 * premier appel et gardée dans `template.userData.basis`.
 *
 * @param {import('three').BufferGeometry} template
 * @param {import('three').BufferGeometry} target
 * @param {{ size: number[], radius?: number }} box  largeur, hauteur, profondeur
 */
export function reshapeRoundedBox(template, target, { size, radius: wanted = BODY_RADIUS }) {
  const [width, height, depth] = size;
  const radius = Math.min(width / 2, height / 2, depth / 2, wanted);
  template.userData.basis ??= roundedBoxBasis(template);
  const { signs, normals: basisNormals, uvRatio, uvPositive, uvSide, uvFlip } = template.userData.basis;
  _box.set(width, height, depth).multiplyScalar(0.5).subScalar(radius);

  // Par côté : part de l’UV prise par un arrondi, et par la partie droite
  const totArcLength = (2 * Math.PI * radius) / 4;
  const arcUv = [];
  const lenUv = [];
  for (const sideLength of [width, height, depth]) {
    const centerLength = Math.max(sideLength - 2 * radius, 0);
    arcUv.push(0.5 * totArcLength / (totArcLength + centerLength));
    lenUv.push(centerLength / (totArcLength + centerLength));
  }

  const positions = target.attributes.position.array;
  const normals = target.attributes.normal.array;
  const uvs = target.attributes.uv.array;

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = _box.x * signs[i] + basisNormals[i] * radius;
    positions[i + 1] = _box.y * signs[i + 1] + basisNormals[i + 1] * radius;
    positions[i + 2] = _box.z * signs[i + 2] + basisNormals[i + 2] * radius;
    normals[i] = basisNormals[i];
    normals[i + 1] = basisNormals[i + 1];
    normals[i + 2] = basisNormals[i + 2];
  }
  for (let j = 0; j < uvs.length; j++) {
    const side = uvSide[j];
    const arc = arcUv[side];
    const uv = uvPositive[j]
      ? uvRatio[j] * arc
      : lenUv[side] + arc + arc * (1 - uvRatio[j]);
    uvs[j] = uvFlip[j] ? 1 - uv : uv;
  }

  target.attributes.position.needsUpdate = true;
  target.attributes.normal.needsUpdate = true;
  target.attributes.uv.needsUpdate = true;
  target.computeBoundingBox();
  target.computeBoundingSphere();
}

export function createStickerGeometry(width, height, radius = STICKER_RADIUS) {
  const r = Math.min(radius, width / 2 - 1e-4, height / 2 - 1e-4);
  const w = width / 2;
  const h = height / 2;
  const shape = new Shape()
    .moveTo(-w + r, -h)
    .lineTo(w - r, -h)
    .quadraticCurveTo(w, -h, w, -h + r)
    .lineTo(w, h - r)
    .quadraticCurveTo(w, h, w - r, h)
    .lineTo(-w + r, h)
    .quadraticCurveTo(-w, h, -w, h - r)
    .lineTo(-w, -h + r)
    .quadraticCurveTo(-w, -h, -w + r, -h);
  return new ExtrudeGeometry(shape, {
    depth: STICKER_DEPTH,
    bevelEnabled: true,
    bevelThickness: STICKER_BEVEL,
    bevelSize: STICKER_BEVEL,
    bevelSegments: 2,
    curveSegments: 12,
  });
}
