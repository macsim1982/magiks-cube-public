// @ts-check
import { useImperativeHandle } from 'react';
import { hintMode, keepsHint } from '../core/guidePlan';
import { queuedTurns } from '../core/turnPlan';
import { cameraView } from './cameraView';
import { meshesOf } from './pivot';

/**
 * Montre la tranche que `token` ferait tourner, sans la tourner : contour
 * et flèche dans le sens du coup ; `null` éteint.
 * `sweeps` : la flèche se dessine autant de fois, puis `onDone` et tout
 * s’éteint. `stay` : elle se dessine une fois, `onDone`, puis reste
 *. Sinon elle reste. `dashed` : le tube en pointillés.
 */
function hint({ puzzle, marks, engine }, token, options = {}) {
  const { sweeps = 0, stay = false, dashed = false, onDone } = options;
  if (keepsHint(marks.guideRef.current, token, { sweeps, stay, dashed })) return;
  marks.clearGuide();
  if (!token) return;
  const turn = puzzle.toTurn(token, puzzle.DEFAULT_FRAME);
  if (!turn || engine.current.current) return;
  marks.showGuide(turn, engine.sliceMeshes(turn), { mode: hintMode({ sweeps, stay }), sweeps, onDone, token, dashed });
}

/** Les réglages d’une lecture : vitesse 1, vue de la caméra, avec l’indice, sans guide */
const playOptions = ({ puzzle, camera }, options) => ({
  ...options,
  speed: options.speed ?? 1,
  instant: options.instant ?? false,
  hints: options.hints ?? true,
  guide: options.guide ?? false,
  frame: options.frame ?? puzzle.viewFrame(cameraView(camera)),
});

/** Joue `tokens` : à la file, animés ; `instant`, d’un coup, sans animation. */
function play(ctx, tokens, options = {}) {
  const { engine } = ctx;
  const { frame, instant, speed, hints, onDone, ...rest } = playOptions(ctx, options);
  const turns = tokens.map((token) => ctx.puzzle.toTurn(token, frame)).filter(Boolean);
  if (!instant) {
    engine.queue.current.push(...queuedTurns(turns, { speed, hints, onDone, ...rest }));
    return;
  }
  for (const turn of turns) {
    engine.startTurn({ ...turn, speed, hints, to: turn.angle, from: 0 });
    const current = engine.current.current;
    if (!current) continue;
    engine.setPivotAngle(current, current.to);
    engine.endTurn(current);
  }
  onDone?.();
}

/**
 * L’API du cube pour l’app (`ref`) : jouer, montrer un coup, fêter une
 * réussite, suivre des pièces, revenir au départ, lire l’état et le repère
 * de la vue.
 */
export function usePuzzleHandle(ref, ctx) {
  const { puzzle, camera, pieces, marks, engine, follow } = ctx;
  useImperativeHandle(ref, () => ({
    getFrame: () => puzzle.viewFrame(cameraView(camera)),
    getState: () => pieces.stateRef.current,
    reset() {
      engine.queue.current = [];
      engine.releasePivot();
      pieces.stateRef.current = puzzle.createState();
      pieces.rebakeAll();
      follow.follow([]);
    },
    cancel() {
      engine.queue.current = [];
      engine.releasePivot();
    },
    hint: (token, options) => hint(ctx, token, options),
    /** Réussite : un contour vert autour des pièces `ids`, jusqu’au prochain coup ; `null` l’éteint. */
    celebrate: (ids) => marks.celebrate(meshesOf(pieces.meshById.current, ids ?? [])),
    play: (tokens, options) => play(ctx, tokens, options),
    /** Les pièces à suivre : halo, maison en pointillés, vert une fois arrivées ; `[]` éteint. */
    follow: (ids) => follow.follow(ids ?? []),
  }));
}
