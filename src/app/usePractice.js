import { useMemo, useRef } from 'react';
import { judgeMove } from '../learn/practice';
import { movedIds } from '../puzzles';

/**
 * Mode « À toi » côté cube : montrer un coup, attendre celui de l’enfant,
 * le juger sur l’état du cube, annuler s’il est faux.
 * La flèche reste jusqu’au coup de l’enfant, continue ou en pointillés
 * (`arrow`, test A/B) ; la réussite se voit sur le cube.
 * Les fonctions retournées sont stables pour un puzzle.
 */
/**
 * Montre `token` sans le jouer : contour de la tranche (ou de tout le
 * cube) et flèche dans le sens du coup, le cube ne bouge pas
 *. La flèche se dessine, `onDone`, puis reste.
 * `key` évite de rejouer la même démo deux fois (effets doublés en StrictMode).
 */
function show(ctx, { token, key, onDone }) {
  const cube = ctx.cubeRef.current;
  if (!cube || ctx.showing.current === key) return;
  ctx.showing.current = key;
  cube.hint(token, {
    stay: true,
    dashed: ctx.dashed,
    onDone: () => {
      ctx.showing.current = null;
      onDone();
    },
  });
}

/**
 * À partir de maintenant, le prochain coup de l’enfant est jugé contre
 * `token`. La flèche du coup reste affichée jusqu’à ce qu’il joue ; au
 * défi sans indice (`quiet`), il n’y en a pas.
 */
function expect(ctx, { token, quiet }, onResult) {
  const cube = ctx.cubeRef.current;
  if (!cube) return;
  if (!ctx.start.current) ctx.start.current = cube.getState();
  if (ctx.pending.current?.token !== token) {
    ctx.pending.current = { token, before: cube.getState(), played: 0, moving: false, onResult };
  }
  cube.hint(quiet ? null : token, { dashed: ctx.dashed });
}

/** Appelé quand un coup de l’enfant est fini (état déjà appliqué). */
function check(ctx) {
  const cube = ctx.cubeRef.current;
  const wait = ctx.pending.current;
  if (!cube || !wait) return;
  wait.moving = false;
  wait.played += 1;
  const verdict = judgeMove(ctx.puzzle, { before: wait.before, after: cube.getState() }, wait.token);
  if (verdict === 'half') {
    wait.onResult('half');
    return;
  }
  ctx.pending.current = null;
  cube.hint(null);
  if (verdict === 'ok') {
    wait.onResult('ok');
    return;
  }
  // Faux : le cube défait tout ce que l’enfant a joué depuis la démo
  for (let i = 0; i < wait.played; i += 1) {
    ctx.moves.undo(i === wait.played - 1 ? { onDone: () => wait.onResult('wrong') } : {});
  }
}

/**
 * Cas réussi : les pièces qui ont bougé depuis le début du cas
 * s’entourent de vert, seulement celles de `only` s’il y en a.
 */
function celebrate(ctx, only) {
  const cube = ctx.cubeRef.current;
  if (!cube || !ctx.start.current) return;
  const moved = movedIds(ctx.puzzle.pieces, ctx.start.current, cube.getState());
  cube.celebrate(only?.length ? moved.filter((id) => only.includes(id)) : moved);
}

function stop(ctx) {
  ctx.pending.current = null;
  ctx.showing.current = null;
  ctx.start.current = null;
  ctx.cubeRef.current?.hint(null);
  ctx.cubeRef.current?.celebrate(null);
}

/**
 * Mode « À toi » côté cube : montrer un coup, attendre celui de l’enfant,
 * le juger sur l’état du cube, annuler s’il est faux.
 * La flèche reste jusqu’au coup de l’enfant, continue ou en pointillés
 * (`arrow`, test A/B) ; la réussite se voit sur le cube.
 * Les fonctions retournées sont stables pour un puzzle.
 */
export function usePractice(cubeRef, { puzzle, moves, arrow = 'continue' }) {
  // Attente en cours : coup attendu, état de départ, coups de l’enfant depuis
  const pending = useRef(null);
  const showing = useRef(null);
  // État du cube au début du cas : la réussite entoure les pièces arrivées
  const start = useRef(null);
  const dashed = arrow === 'pointilles';

  return useMemo(() => {
    const ctx = { cubeRef, puzzle, moves, dashed, pending, showing, start };
    return {
      show: (token, key, onDone) => show(ctx, { token, key, onDone }),
      expect: (token, onResult, { quiet = false } = {}) => expect(ctx, { token, quiet }, onResult),
      /**
       * Un coup de l’enfant est-il accepté maintenant ? Non pendant la démo, ni
       * tant que le coup précédent n’est pas jugé (touches tapées trop vite).
       */
      accepts: () => Boolean(pending.current) && !pending.current.moving,
      /** Un coup de l’enfant part : les suivants attendent son verdict. */
      begin() {
        if (pending.current) pending.current.moving = true;
      },
      check: () => check(ctx),
      celebrate: (only) => celebrate(ctx, only),
      stop: () => stop(ctx),
    };
  }, [cubeRef, puzzle, moves, dashed]);
}
