// @ts-check
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { commits, logicalTurn, smoothstep, turnDuration, withTurnDefaults } from '../core/turnPlan';
import { cameraView } from './cameraView';
import { gatherOnPivot, meshesOf, zeroPivot } from './pivot';

// Coup guidé : la tranche s’annonce (contour + flèche) avant de tourner
const GUIDE_LEAD = 0.45;
const scratchAxis = new THREE.Vector3();

const sliceMeshes = ({ puzzle, pieces }, turn) => meshesOf(pieces.meshById.current, puzzle.movingIds(pieces.stateRef.current, turn));

// `already` : pièces déjà sous le pivot (glissé en cours, voir pointer.js)
const preparePivot = (ctx, turn, already) => already ?? gatherOnPivot(ctx.rig, sliceMeshes(ctx, turn));

const setPivotAngle = ({ rig }, turn, angle) => {
  const [x, y, z] = turn.axisVec;
  rig.pivotRef.current.quaternion.setFromAxisAngle(scratchAxis.set(x, y, z), angle);
};

/** Lance un tour : la tranche passe sous le pivot ; un coup guidé s’annonce d’abord. */
function startTurn(ctx, input) {
  const { puzzle, marks } = ctx;
  // `cubelets` : pièces déjà sous le pivot ; elles ne font pas partie du tour
  const already = input.cubelets;
  const { speed, ...plan } = withTurnDefaults({ ...input, cubelets: undefined });
  const turn = { ...plan, axisVec: puzzle.turnAxis(plan) };
  marks.clearCheers();
  const lead = turn.guide && !already ? GUIDE_LEAD : 0;
  if (lead) marks.showGuide(turn, sliceMeshes(ctx, turn), { mode: 'lead', lead });
  // Un coup joué à la main efface le guide qui le montrait
  else if (marks.guideRef.current) marks.clearGuide();
  const moving = preparePivot(ctx, turn, already);
  ctx.current.current = { ...turn, cubelets: moving, elapsed: -lead, duration: turnDuration({ ...turn, speed }, puzzle.angle) };
  const { axis, layer, tip, from, to } = turn;
  ctx.highlightRef.current = turn.hints === false ? null : { axis, layer, tip, angle: to - from, intent: to };
  // Le contour remplace le reflet des stickers
  if (!lead) ctx.glow(moving, true);
  if (!already) setPivotAngle(ctx, ctx.current.current, from);
}

/** Un coup joué à la main : son nom, vu de la caméra, part à `onTurn` (historique, À toi). */
function reportTurn({ puzzle, camera, onTurn }, turn) {
  const frame = puzzle.viewFrame(cameraView(camera));
  const token = puzzle.turnToToken(logicalTurn(turn), frame);
  if (token) onTurn?.(token, frame);
}

/** Fin d’un tour : les pièces retournent au groupe, l’état logique avance si le tour compte. */
function endTurn(ctx, turn) {
  const { puzzle, pieces, marks } = ctx;
  turn.cubelets.forEach((mesh) => ctx.rig.groupRef.current.attach(mesh));
  zeroPivot(ctx.rig.pivotRef.current);
  const counted = commits(turn, puzzle.angle);
  if (counted) pieces.stateRef.current = puzzle.apply(pieces.stateRef.current, logicalTurn(turn));
  turn.cubelets.forEach((mesh) => {
    const id = mesh.userData.pieceId;
    if (id) pieces.rebakePiece(id);
  });
  ctx.glow(turn.cubelets, false);
  if (turn.guide) marks.clearGuide();
  ctx.highlightRef.current = null;
  if (turn.source === 'pointer' && counted) reportTurn(ctx, turn);
  const { onStep, onDone } = turn;
  ctx.current.current = null;
  onStep?.();
  if (onDone && !ctx.queue.current.length) onDone();
}

/** Tout s’arrête : les pièces quittent le pivot, guide et contours s’éteignent. */
function releasePivot(ctx) {
  const group = ctx.rig.groupRef.current;
  const pivot = ctx.rig.pivotRef.current;
  if (!group || !pivot) return;
  ctx.glow(null, false);
  ctx.marks.clearGuide();
  ctx.marks.clearCheers();
  pivot.rotation.set(0, 0, 0);
  pivot.quaternion.identity();
  pivot.updateMatrixWorld(true);
  while (pivot.children.length) group.attach(pivot.children[0]);
  ctx.highlightRef.current = null;
  ctx.current.current = null;
  ctx.pieces.rebakeAll();
}

/** Une image : le tour en cours avance, le suivant de la file démarre. */
function stepFrame(ctx, delta) {
  if (ctx.drag.current) return;
  if (!ctx.current.current) {
    if (!ctx.queue.current.length) return;
    startTurn(ctx, ctx.queue.current.shift());
  }
  const turn = ctx.current.current;
  turn.elapsed += delta;
  const t = Math.min(Math.max(0, turn.elapsed) / turn.duration, 1);
  const angle = turn.from + (turn.to - turn.from) * smoothstep(t);
  setPivotAngle(ctx, turn, angle);
  if (turn.hints !== false) {
    ctx.highlightRef.current = { axis: turn.axis, layer: turn.layer, tip: turn.tip, angle, intent: turn.to };
  }
  if (t === 1) endTurn(ctx, turn);
}

/**
 * La file d’animation : un tour à la fois, sous un pivot, puis
 * l’état logique avance et les pièces sont replacées. `drag` : un glissé
 * en cours met la file en attente. `highlightRef` : le tour en cours, pour
 * l’indice au-dessus du cube.
 */
export function useTurnEngine(options) {
  const queue = useRef([]);
  const current = useRef(null);
  const highlightRef = useRef(null);
  const ctx = { ...options, queue, current, highlightRef };
  const { puzzle, pieces } = options;

  // Nouveau puzzle : nouvel état, file vide, pièces replacées
  const reset = useRef(null);
  useEffect(() => {
    reset.current = () => {
      pieces.stateRef.current = puzzle.createState();
      queue.current = [];
      current.current = null;
      requestAnimationFrame(() => pieces.rebakeAll());
    };
  });
  useEffect(() => reset.current(), [puzzle.id]);

  useFrame((_, delta) => stepFrame(ctx, delta));

  return {
    queue,
    current,
    highlightRef,
    startTurn: (input) => startTurn(ctx, input),
    endTurn: (turn) => endTurn(ctx, turn),
    releasePivot: () => releasePivot(ctx),
    preparePivot: (turn, already) => preparePivot(ctx, turn, already),
    setPivotAngle: (turn, angle) => setPivotAngle(ctx, turn, angle),
    sliceMeshes: (turn) => sliceMeshes(ctx, turn),
  };
}
