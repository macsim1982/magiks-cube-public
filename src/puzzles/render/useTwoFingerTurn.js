import { useEffect, useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gestureQuarters, lockAxis, readGesture, snapQuarters } from '../core/gesture';
import { cameraView } from './cameraView';
import { setOrbit } from './orbit';

const point = (event) => ({ x: event.clientX, y: event.clientY });

/** Deux doigts posés : le geste commence, le glissé à un doigt en cours est oublié */
function startGesture(env, ctx) {
  const { points, gesture } = env;
  if (points.size !== 2 || gesture.current) return;
  if (ctx.current.current || (ctx.canTurn && !ctx.canTurn())) return;
  if (!ctx.puzzle.toTurn('y', ctx.puzzle.DEFAULT_FRAME)) return;
  if (ctx.drag.current) {
    ctx.cancelDrag();
    ctx.releasePivot();
  }
  // La caméra ne suit pas les doigts pendant le geste
  setOrbit(env.get, false);
  env.orbitHeld = true;
  const ids = [...points.keys()];
  gesture.current = { ids, start: ids.map((id) => points.get(id)), axis: null, quarters: 0 };
  // Le glissé à un doigt et la file d’animation attendent
  ctx.drag.current = { gesture: true };
}

/** Les doigts bougent : l’axe se choisit une fois, puis tout le cube suit */
function followGesture(env, ctx) {
  const g = env.gesture.current;
  const now = g.ids.map((id) => env.points.get(id));
  if (!now[0] || !now[1]) return;
  const read = readGesture(g.start, now);
  if (!g.axis) {
    const axis = lockAxis(read);
    if (!axis) return;
    const turn = ctx.puzzle.toTurn(axis, ctx.puzzle.viewFrame(cameraView(ctx.camera)));
    if (!turn) return;
    Object.assign(g, { axis, turn, cubelets: ctx.preparePivot(turn) });
    g.vector = new THREE.Vector3(...ctx.puzzle.turnAxis(turn));
  }
  const rect = env.el.getBoundingClientRect();
  g.quarters = gestureQuarters(g.axis, read, Math.min(rect.width, rect.height));
  env.pivotRef.current?.quaternion.setFromAxisAngle(env.scratch.copy(g.vector), g.quarters * g.turn.angle);
}

/** Un doigt se lève : le cube se cale au quart de tour et joue le coup */
function endGesture(env, ctx, pointerId) {
  const g = env.gesture.current;
  if (!g || !g.ids.includes(pointerId)) return;
  env.gesture.current = null;
  ctx.drag.current = null;
  if (!g.axis) return;
  const { turn } = g;
  const to = snapQuarters(g.quarters) * turn.angle;
  ctx.startTurn({ ...turn, from: g.quarters * turn.angle, to, angle: to, steps: Math.round(to / ctx.puzzle.angle), source: 'pointer', cubelets: g.cubelets });
}

/** Les écouteurs du geste, sur le canvas et la fenêtre ; `latest` : la dernière version du cube */
function listen(env, latest) {
  const down = (event) => {
    if (event.pointerType !== 'touch') return;
    env.points.set(event.pointerId, point(event));
    startGesture(env, latest.current);
  };
  const move = (event) => {
    if (!env.points.has(event.pointerId)) return;
    env.points.set(event.pointerId, point(event));
    if (env.gesture.current) followGesture(env, latest.current);
  };
  const up = (event) => {
    if (!env.points.delete(event.pointerId)) return;
    // Rendue quand tous les doigts sont levés : le doigt restant ne fait pas tourner la caméra
    if (env.orbitHeld && !env.points.size) {
      env.orbitHeld = false;
      setOrbit(env.get, true);
    }
    endGesture(env, latest.current, event.pointerId);
  };
  env.el.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  return () => {
    env.el.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  };
}

/**
 * Deux doigts sur écran tactile : tout le cube tourne (x, y, z selon le sens
 * du glissé), suit les doigts, puis se cale au quart de tour en jouant un
 * vrai coup.
 * Le coup passe par `startTurn` (source `pointer`) : `onTurn` le reçoit
 * comme un glissé, l’historique et le mode « À toi » le voient.
 */
export function useTwoFingerTurn(options) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const get = useThree((state) => state.get);
  const touches = useRef(new Map());
  const gesture = useRef(null);
  // Les écouteurs DOM vivent tant que le canvas : ils lisent toujours la dernière version
  const latest = useRef({});
  useLayoutEffect(() => {
    latest.current = { ...options, camera };
  });
  const { pivotRef } = options;

  useEffect(() => listen({
    el: gl.domElement,
    points: touches.current,
    gesture,
    get,
    pivotRef,
    scratch: new THREE.Vector3(),
    orbitHeld: false,
  }, latest), [gl, get, pivotRef]);
}
