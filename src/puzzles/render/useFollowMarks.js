// @ts-check
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ghostFade } from '../core/announce';
import { homeOf, isHome } from '../core/home';
import { lightDown, lightUp, useGlow } from './glow';
import { meshesOf } from './pivot';

// La pièce à suivre et sa maison en turquoise ; arrivée, elle passe au vert
export const FOLLOW_COLOR = '#14c8d6';
const HOME_COLOR = '#1f9d55';
// Le fond du fantôme : il cache le sticker dessous, les couleurs ne se mélangent pas
const GHOST_GROUND = '#1d2430';
// Le fantôme pulse : sa luminosité va de GHOST_DIM à 1 en GHOST_PULSE secondes
const GHOST_PULSE = 1.2;
const GHOST_DIM = 0.55;
// Le fantôme flotte un peu au-dessus du sticker de la pièce qui occupe la place
const GHOST_LIFT = 0.012;
const GHOST_GROW = 1.12;
const TEXTURE_SIZE = 128;

/** Un sticker fantôme, opaque : fond sombre, sa couleur au centre, un bord turquoise en pointillés */
function ghostTexture(color) {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const g = canvas.getContext('2d');
  const inset = 10;
  const side = TEXTURE_SIZE - 2 * inset;
  g.fillStyle = GHOST_GROUND;
  g.beginPath();
  g.roundRect(inset, inset, side, side, 16);
  g.fill();
  g.fillStyle = `#${color.getHexString()}`;
  g.fillRect(TEXTURE_SIZE * 0.3, TEXTURE_SIZE * 0.3, TEXTURE_SIZE * 0.4, TEXTURE_SIZE * 0.4);
  g.setLineDash([16, 11]);
  g.lineWidth = 9;
  g.strokeStyle = FOLLOW_COLOR;
  g.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Le quaternion qui pose la pièce chez elle : chaque couleur vers le côté de son centre */
function homeQuaternion(piece, home) {
  const [a, b] = piece.faces.map((face, at) => {
    const local = new THREE.Vector3();
    local.setComponent(face.axis, face.sign);
    return { local, side: new THREE.Vector3(...home.faces[at].side) };
  });
  const basis = (u, v) => new THREE.Matrix4().makeBasis(u, v, new THREE.Vector3().crossVectors(u, v));
  const turn = basis(a.side, b.side).multiply(basis(a.local, b.local).transpose());
  return new THREE.Quaternion().setFromRotationMatrix(turn);
}

/** Les stickers de la pièce, recopiés en fantômes à sa place, dans le repère du groupe des pièces */
function buildGhost({ puzzle, mesh, piece, home, material }) {
  const ghost = new THREE.Group();
  ghost.userData.kind = 'home';
  const [x, y, z] = puzzle.slotWorld(home.slot);
  ghost.position.set(x, y, z);
  ghost.quaternion.copy(homeQuaternion(piece, home));
  for (const sticker of mesh.children) {
    if (sticker.userData?.kind !== 'sticker' || !(sticker instanceof THREE.Mesh)) continue;
    sticker.geometry.computeBoundingBox();
    const size = sticker.geometry.boundingBox.getSize(new THREE.Vector3());
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size.x * GHOST_GROW, size.y * GHOST_GROW), material(sticker.userData.face, sticker.material));
    plane.raycast = () => {};
    // Dessiné par-dessus tout : visible même sur une face cachée (derrière, gauche, dessous)
    plane.renderOrder = 10;
    plane.quaternion.copy(sticker.quaternion);
    plane.position.copy(sticker.position).add(new THREE.Vector3(0, 0, 1).applyQuaternion(sticker.quaternion).multiplyScalar(GHOST_LIFT));
    ghost.add(plane);
  }
  return ghost;
}

/** Une matière par couleur de sticker, gardée tant que la vue vit ; toutes pulsent et s’effacent ensemble */
function useGhostMaterials() {
  const cache = useMemo(() => new Map(), []);
  useEffect(() => () => cache.forEach((material) => {
    material.map?.dispose();
    material.dispose();
  }), [cache]);
  useFrame(({ clock }) => {
    const wave = (1 + Math.sin((clock.elapsedTime / GHOST_PULSE) * 2 * Math.PI)) / 2;
    cache.forEach((material) => material.color.setScalar(GHOST_DIM + (1 - GHOST_DIM) * wave));
  });
  const of = (face, stickerMaterial) => {
    if (!cache.has(face)) {
      cache.set(face, new THREE.MeshBasicMaterial({
        map: ghostTexture(stickerMaterial.color ?? new THREE.Color('#888888')),
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }));
    }
    return cache.get(face);
  };
  const fade = (opacity) => cache.forEach((material) => {
    material.opacity = opacity;
  });
  return { of, fade };
}

/** Les fantômes s’effacent */
function clearGhosts(drawn) {
  drawn.current.ghosts.forEach((ghost) => {
    ghost.removeFromParent();
    ghost.children.forEach((plane) => plane instanceof THREE.Mesh && plane.geometry.dispose());
  });
  drawn.current.ghosts = [];
}

/** La lumière de chaque pièce suivie dans l’état `state` : verte chez elle, sinon turquoise */
function lightPieces({ puzzle, pieces, drawn, glows }, state, ids) {
  lightDown(drawn.current.lit);
  drawn.current = { ...drawn.current, state, ids, lit: [] };
  for (const id of ids) {
    const [mesh] = meshesOf(pieces.meshById.current, [id]);
    if (mesh) drawn.current.lit.push(...lightUp([mesh], isHome(puzzle.pieces, state, id) ? glows.home : glows.away));
  }
}

/** L’annonce : le fantôme de la place d’arrivée de chaque pièce qui n’y est pas */
function showGhosts({ puzzle, pieces, groupRef, drawn, ghosts }, state, ids) {
  clearGhosts(drawn);
  for (const id of ids) {
    const [mesh] = meshesOf(pieces.meshById.current, [id]);
    const home = homeOf(puzzle.pieces, state, id);
    if (!mesh || !home || isHome(puzzle.pieces, state, id)) continue;
    const piece = puzzle.pieces.find((p) => p.id === id);
    const ghost = buildGhost({ puzzle, mesh, piece, home, material: ghosts.of });
    groupRef.current?.add(ghost);
    drawn.current.ghosts.push(ghost);
  }
}

/** Le fantôme suit l’annonce : fondu, tenue, fondu, puis il disparaît */
function fadeGhosts({ drawn, ghosts }, now) {
  if (!drawn.current.ghosts.length) return;
  const opacity = ghostFade(now - drawn.current.start);
  if (opacity === null) clearGhosts(drawn);
  else ghosts.fade(opacity);
}

/**
 * Les pièces à suivre d’un cas : chacune s’allume
 * de l’intérieur en turquoise, verte une fois chez elle, à chaque nouvel état
 * du cube. À chaque pose, une annonce de quelques secondes montre sa place
 * d’arrivée : ses stickers en fantômes opaques qui pulsent, en fondu (`ghostFade`).
 * `follow(ids)` : les pièces à suivre, et l’annonce ; `[]` éteint tout.
 */
export function useFollowMarks({ puzzle, pieces, groupRef }) {
  const followed = useRef(/** @type {string[]} */ ([]));
  const announce = useRef(false);
  const drawn = useRef({ state: null, ids: followed.current, lit: [], ghosts: [], start: 0 });
  const glows = {
    away: useGlow(FOLLOW_COLOR),
    home: useGlow(HOME_COLOR),
  };
  const ghosts = useGhostMaterials();

  useFrame(({ clock }) => {
    const ctx = { puzzle, pieces, groupRef, drawn, glows, ghosts };
    const state = pieces.stateRef.current;
    // Un nouvel état (coup fini, pose) ou d’autres pièces : la lumière suit
    if (state !== drawn.current.state || drawn.current.ids !== followed.current) lightPieces(ctx, state, followed.current);
    // Une pose : l’annonce repart
    if (announce.current) {
      announce.current = false;
      showGhosts(ctx, state, followed.current);
      drawn.current.start = clock.elapsedTime;
    }
    fadeGhosts(ctx, clock.elapsedTime);
  });

  useEffect(() => () => {
    lightDown(drawn.current.lit);
    clearGhosts(drawn);
  }, []);

  return {
    follow: (ids) => {
      followed.current = ids;
      announce.current = true;
    },
  };
}
