// @ts-check
import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { dragSteps, snapDrag } from '../core/dragSnap';
import { setOrbit } from './orbit';
import { gatherOnPivot, meshesOf } from './pivot';

const AXIS_NAMES = ['x', 'y', 'z'];

/**
 * Maj + glissé : tout le cube tourne autour de l’axe de la couche choisie
 * (x, y ou z). Seulement pour un puzzle à couches qui connaît ces coups ;
 * sinon la couche reste.
 * @param {object} puzzle
 * @param {{ axis?: string, layer?: number | null }} turn
 */
export function wholeTurn(puzzle, turn) {
  if (!('layer' in turn) || !puzzle.toTurn('x', puzzle.DEFAULT_FRAME)) return turn;
  return { ...turn, layer: null };
}

/** Le point du plan de glissé sous le pointeur, ou null */
function hitDragPlane({ gl, camera, scratch }, state, e) {
  const rect = gl.domElement.getBoundingClientRect();
  scratch.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  scratch.raycaster.setFromCamera(scratch.ndc, camera);
  return scratch.raycaster.ray.intersectPlane(state.plane, scratch.hit);
}

/**
 * Le glissé a assez bougé : le puzzle choisit la couche (`drag.resolve`),
 * ses pièces passent sous le pivot. Angle = déplacement le long de la
 * tangente, divisé par le rayon autour de l’axe.
 */
function lockDrag(ctx, state, delta) {
  const { puzzle, pieces } = ctx;
  const piece = puzzle.pieces.find((p) => p.id === state.pieceId);
  const piecePose = pieces.stateRef.current.byId[state.pieceId];
  const resolved = puzzle.drag.resolve(null, { normal: state.normal, normalAxis: state.normalAxis, delta, piece, piecePose });
  if (!resolved) return;
  state.turn = state.whole ? wholeTurn(puzzle, resolved) : resolved;
  state.locked = true;
  const axis = puzzle.turnAxis(resolved);
  state.axis = new THREE.Vector3(axis[0], axis[1], axis[2]);
  state.tangent.crossVectors(state.axis, state.normal).normalize();
  const p = state.start;
  const along = p.dot(state.axis);
  const radius = puzzle.drag.radius
    ? puzzle.drag.radius([p.x, p.y, p.z], axis)
    : Math.hypot(p.x - axis[0] * along, p.y - axis[1] * along, p.z - axis[2] * along);
  state.radius = Math.max(radius, 0.85);
  const ids = puzzle.movingIds(pieces.stateRef.current, { ...state.turn, angle: puzzle.angle, steps: 1 });
  state.cubelets = gatherOnPivot(ctx.rig, meshesOf(pieces.meshById.current, ids));
  ctx.engine.highlightRef.current = { ...state.turn, angle: 0, intent: 0 };
  ctx.glow(state.cubelets, true);
}

function moveDrag(ctx, e) {
  const state = ctx.drag.current;
  if (!state || e.pointerId !== state.pointerId) return;
  const hit = hitDragPlane(ctx, state, e);
  if (!hit) return;
  ctx.rig.groupRef.current.worldToLocal(hit);
  const delta = hit.clone().sub(state.start);
  if (!state.locked) {
    if (delta.length() < (ctx.puzzle.drag.lockDistance ?? 0.12)) return;
    lockDrag(ctx, state, delta);
    if (!state.locked) return;
  }
  // Jusqu’au demi-tour (R2) quand le puzzle le permet
  const max = ctx.puzzle.angle * dragSteps(ctx.puzzle.angle);
  const angle = THREE.MathUtils.clamp(delta.dot(state.tangent) / state.radius, -max, max);
  state.angle = angle;
  ctx.rig.pivotRef.current?.quaternion.setFromAxisAngle(state.axis, angle);
  ctx.engine.highlightRef.current = { ...state.turn, angle, intent: angle };
}

/** Les écouteurs du glissé quittent la fenêtre */
function removeListeners(listeners) {
  const { move, up } = listeners.current;
  if (move) window.removeEventListener('pointermove', move);
  if (up) {
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  }
  listeners.current = {};
}

/** Le glissé s’arrête : écouteurs, capture et curseur rendus, orbite rendue */
function detach(ctx, state) {
  removeListeners(ctx.listeners);
  const canvas = ctx.gl.domElement;
  if (canvas.hasPointerCapture?.(state.pointerId)) canvas.releasePointerCapture(state.pointerId);
  canvas.style.cursor = '';
  ctx.drag.current = null;
  setOrbit(ctx.get, true);
}

/** Le doigt se lève : la couche se cale au quart de tour le plus proche, et joue le coup */
function endDrag(ctx, e) {
  const state = ctx.drag.current;
  if (!state || e.pointerId !== state.pointerId) return;
  detach(ctx, state);
  if (!state.locked) return;
  const { puzzle } = ctx;
  const from = state.angle;
  const to = snapDrag(from, { unit: puzzle.angle, commit: puzzle.angle * (puzzle.drag.commitRatio ?? 0.28), steps: dragSteps(puzzle.angle) });
  ctx.engine.startTurn({ ...state.turn, from, to, angle: to, steps: Math.round(to / puzzle.angle), source: 'pointer', cubelets: state.cubelets });
}

/** La pièce touchée et la normale de sa face, dans le repère du groupe ; null hors d’une pièce */
function touchedFace({ rig, scratch }, e) {
  const group = rig.groupRef.current;
  let root = e.object;
  while (root && root.parent !== group) root = root.parent;
  const pieceId = root?.parent === group ? root.userData.pieceId : null;
  if (!pieceId || !e.face) return null;
  scratch.inv.copy(group.matrixWorld).invert();
  const normal = scratch.normal.copy(e.face.normal).transformDirection(e.object.matrixWorld).transformDirection(scratch.inv).normalize();
  const normalAxis = AXIS_NAMES.reduce((best, axis) => (Math.abs(normal[axis]) > Math.abs(normal[best]) ? axis : best));
  return { pieceId, normal: normal.clone(), normalAxis };
}

function beginDrag(ctx, e) {
  if (e.button !== 0 || ctx.drag.current || ctx.engine.current.current) return;
  e.stopPropagation();
  const face = touchedFace(ctx, e);
  if (!face) return;
  const group = ctx.rig.groupRef.current;
  const worldNormal = face.normal.clone().transformDirection(group.matrixWorld);
  // Maj tenue au départ : tout le cube (x, y, z)
  ctx.drag.current = {
    ...face,
    pointerId: e.pointerId,
    start: group.worldToLocal(e.point.clone()),
    plane: new THREE.Plane().setFromNormalAndCoplanarPoint(worldNormal, e.point),
    tangent: new THREE.Vector3(),
    locked: false,
    whole: e.shiftKey === true,
    angle: 0,
  };
  setOrbit(ctx.get, false);
  e.nativeEvent?.stopImmediatePropagation?.();
  ctx.gl.domElement.style.cursor = 'grabbing';
  ctx.gl.domElement.setPointerCapture?.(e.pointerId);
  const move = (event) => moveDrag(ctx, event);
  const up = (event) => endDrag(ctx, event);
  ctx.listeners.current = { move, up };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

/**
 * Glisser une couche (un doigt ou la souris) : le puzzle verrouille la
 * couche (`drag.resolve`), elle suit le pointeur, puis se cale et joue le
 * coup par `engine.startTurn` (source `pointer`). `drag` : le glissé en
 * cours, que la file d’animation et les deux doigts respectent.
 */
export function usePuzzlePointer({ puzzle, rig, drag, engine, glow, pieces }) {
  const listeners = useRef(/** @type {{ move?: (e: PointerEvent) => void, up?: (e: PointerEvent) => void }} */ ({}));
  const scratch = useMemo(() => ({
    raycaster: new THREE.Raycaster(),
    hit: new THREE.Vector3(),
    inv: new THREE.Matrix4(),
    normal: new THREE.Vector3(),
    ndc: new THREE.Vector2(),
  }), []);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const get = useThree((state) => state.get);
  const ctx = { puzzle, rig, drag, engine, glow, pieces, listeners, scratch, camera, gl, get };

  useEffect(() => () => {
    removeListeners(listeners);
    setOrbit(get, true);
  }, [get]);

  return {
    onPointerDown: (e) => beginDrag(ctx, e),
    /** Abandonne le glissé en cours sans jouer de coup (un 2e doigt arrive). Les pièces restent sous le pivot. */
    cancel: () => {
      const state = drag.current;
      if (!state?.pointerId) return;
      detach(ctx, state);
      if (state.cubelets) glow(state.cubelets, false);
      engine.highlightRef.current = null;
    },
    onPointerOver: () => {
      if (!drag.current) gl.domElement.style.cursor = 'grab';
    },
    onPointerOut: () => {
      if (!drag.current) gl.domElement.style.cursor = '';
    },
  };
}
