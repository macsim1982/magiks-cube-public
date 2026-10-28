// @ts-check
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { arcPoints, easeOutCubic, guideProgress, SEGMENTS } from '../core/guidePlan';

/**
 * Guide de la tranche à tourner : les pièces qui vont bouger
 * s’allument de l’intérieur, et une flèche néon courbe autour de la tranche, dans le
 * sens du coup. Pour les enfants : on voit QUOI tourner et DANS QUEL SENS.
 * Le calcul (arc, dessin, balayage) est dans `core/guidePlan.js`.
 */

export const GUIDE_COLOR = '#ffc21a';
// Le néon : un tube surexposé, que le bloom de la scène (PostFX) fait rayonner
const NEON_COLOR = '#ffc21a';
const NEON_POWER = 1.8;
// Un léger scintillement, comme un vrai tube
const FLICKER = 0.12;
const TUBE_RADIUS = 0.045;
const HEAD_RADIUS = 0.15;
const HEAD_LENGTH = 0.36;
const RADIAL = 10;
// Pointillés (variante A/B d’À toi) : deux tiers de tiret, un tiers de trou
const DASH_PERIOD = 0.75;

const scratch = {
  point: new THREE.Vector3(),
  tangent: new THREE.Vector3(),
  camera: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0),
};

/** Texture des pointillés : deux texels pleins, un vide, répétés le long du tube. */
function dashTexture() {
  const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255]), 3, 1);
  texture.wrapS = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

const neon = (extra) => new THREE.MeshBasicMaterial({
  color: new THREE.Color(NEON_COLOR).multiplyScalar(NEON_POWER),
  transparent: true,
  toneMapped: false,
  ...extra,
});

/** Matériaux de la flèche : plein ou en pointillés */
function useGuideMaterials() {
  const materials = useMemo(() => {
    const dashes = dashTexture();
    const dashed = { alphaMap: dashes, alphaTest: 0.5 };
    const head = new THREE.ConeGeometry(HEAD_RADIUS, HEAD_LENGTH, 20);
    head.translate(0, HEAD_LENGTH / 2, 0);
    return {
      fill: neon(),
      dashFill: neon(dashed),
      dashes,
      head,
    };
  }, []);
  useEffect(() => () => Object.values(materials).forEach((item) => item.dispose()), [materials]);
  return materials;
}

/** Nouveau guide : l’arc se construit, tourné vers la caméra (repère des pièces) */
function buildArc({ parts, built, materials }, guide, camera) {
  built.current?.geometry.dispose();
  const cameraLocal = parts.root.parent.worldToLocal(scratch.camera.copy(camera.position)).toArray();
  const points = arcPoints(guide.ring, { sign: guide.sign, half: guide.half, cameraLocal });
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geometry = new THREE.TubeGeometry(curve, SEGMENTS, TUBE_RADIUS, RADIAL, false);
  parts.tube.geometry = geometry;
  parts.tube.material = guide.dashed ? materials.dashFill : materials.fill;
  if (guide.dashed) materials.dashes.repeat.set(curve.getLength() / DASH_PERIOD, 1);
  built.current = { guide, geometry, curve };
}

/** Le scintillement du tube à l’instant `t` (s) : entre 1 - FLICKER et 1 */
const flicker = (t) => 1 - FLICKER * (0.5 + 0.5 * Math.sin(t * 23) * Math.sin(t * 7));

/** Une image de la flèche : la part dessinée, l’opacité, et la pointe au bout */
function drawArc({ parts, built, materials }, { drawn, opacity }) {
  const eased = easeOutCubic(drawn);
  const { geometry, curve } = built.current;
  const ring = RADIAL * 6;
  geometry.setDrawRange(0, Math.max(ring, Math.floor(eased * SEGMENTS) * ring));
  const light = opacity * flicker(performance.now() / 1000);
  for (const material of [materials.fill, materials.dashFill]) material.opacity = light;
  curve.getPointAt(Math.max(0.001, eased), scratch.point);
  curve.getTangentAt(Math.max(0.001, eased), scratch.tangent);
  parts.tip.position.copy(scratch.point);
  parts.tip.quaternion.setFromUnitVectors(scratch.up, scratch.tangent);
  parts.tip.visible = eased > 0.02;
  parts.root.visible = true;
}

/**
 * Dessine la flèche du guide courant (`guideRef`), dans le repère des pièces.
 * `guideRef.current` : `{ ring, sign, half, mode, start, lead?, sweeps?, dashed?, onDone? }`
 * (voir `guideProgress`). Fin des balayages : `onSweepsDone` ; flèche
 * dessinée qui reste : `onDrawn`.
 */
export default function SliceGuide({ guideRef, onSweepsDone, onDrawn }) {
  const group = useRef(null);
  const tube = useRef(null);
  const head = useRef(null);
  const built = useRef(null);
  const materials = useGuideMaterials();
  useEffect(() => () => {
    built.current?.geometry.dispose();
  }, []);

  useFrame(({ camera }) => {
    const guide = guideRef.current;
    const parts = { root: group.current, tube: tube.current, tip: head.current };
    if (Object.values(parts).some((part) => !part)) return;
    parts.root.visible = false;
    if (!guide) return;
    const ctx = { parts, built, materials };
    if (built.current?.guide !== guide) buildArc(ctx, guide, camera);
    const progress = guideProgress(guide, (performance.now() - guide.start) / 1000);
    if (progress.ended) {
      onSweepsDone?.(guide);
      return;
    }
    if (progress.settled && !guide.drawn) {
      guide.drawn = true;
      onDrawn?.(guide);
    }
    drawArc(ctx, progress);
  });

  const none = () => {};
  return (
    <group ref={group} visible={false}>
      <mesh ref={tube} material={materials.fill} raycast={none} />
      <group ref={head}>
        <mesh geometry={materials.head} material={materials.fill} raycast={none} />
      </group>
    </group>
  );
}
