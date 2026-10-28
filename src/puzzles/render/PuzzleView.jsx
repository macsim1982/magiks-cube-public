// @ts-check
import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useCubeLook } from '../../look/useCubeLook';
import { DEFAULT_LOOK } from '../../look/look';
import FaceHints from './FaceHints';
import SliceGuide from './SliceGuide';
import { usePuzzlePointer } from './pointer';
import { useFollowMarks } from './useFollowMarks';
import { useGuideMarks } from './useGuideMarks';
import { usePieceMeshes } from './usePieceMeshes';
import { usePuzzleHandle } from './usePuzzleHandle';
import { useTurnEngine } from './useTurnEngine';
import { useTwoFingerTurn } from './useTwoFingerTurn';

/** Le gabarit du corps arrondi des pièces, partagé (cube N×N), libéré au changement */
function useBodyTemplate(puzzle) {
  const template = useMemo(() => (puzzle.createBodyTemplate ? puzzle.createBodyTemplate() : null), [puzzle]);
  useEffect(() => () => template?.dispose(), [template]);
  return template;
}

/**
 * Runtime 3D partagé : il assemble les pièces (`usePieceMeshes`),
 * la file d’animation (`useTurnEngine`), le guide et la réussite
 * (`useGuideMarks`), la pièce à suivre et sa maison (`useFollowMarks`), le
 * glissé et les deux doigts, et l’API de l’app
 * (`usePuzzleHandle`). Le mesh vient de `puzzle.Piece`, le placement de
 * `puzzle.authored`.
 * `canTurn()` : appelé quand un doigt se pose ; `false` = le cube ne se
 * tourne pas à la main (démonstration en cours).
 */
export default function PuzzleView({ ref, puzzle, onTurn, canTurn, look = DEFAULT_LOOK }) {
  const groupRef = useRef(null);
  const pivotRef = useRef(null);
  const drag = useRef(null);
  const rig = useMemo(() => ({ groupRef, pivotRef }), []);
  const camera = useThree((state) => state.camera);
  const { materials, offsetView, setStickerGlow } = useCubeLook(look);
  const bodyTemplate = useBodyTemplate(puzzle);
  const pieces = usePieceMeshes(puzzle, offsetView);
  const marks = useGuideMarks(puzzle);
  const engine = useTurnEngine({ puzzle, rig, pieces, marks, glow: setStickerGlow, onTurn, drag, camera });
  const pointer = usePuzzlePointer({ puzzle, rig, drag, engine, glow: setStickerGlow, pieces });
  useTwoFingerTurn({ ...engine, puzzle, pivotRef, drag, cancelDrag: pointer.cancel, canTurn });
  const follow = useFollowMarks({ puzzle, pieces, groupRef });
  usePuzzleHandle(ref, { puzzle, camera, pieces, marks, engine, follow });

  const Piece = puzzle.Piece;
  // Le miroir épaissit les couches d’un côté : le bloc glisse de `offsetView`.
  // On le recentre pour que Mirror ↔ Classique ne déplace pas le cube.
  const recenter = useMemo(() => /** @type {[number, number, number]} */ (offsetView ? [-offsetView[0], -offsetView[1], -offsetView[2]] : [0, 0, 0]), [offsetView]);

  return (
    <group position={recenter}>
      <group
        ref={groupRef}
        onPointerDown={(event) => {
          if (canTurn && !canTurn()) return;
          pointer.onPointerDown(event);
        }}
        onPointerOver={pointer.onPointerOver}
        onPointerOut={pointer.onPointerOut}
      >
        {puzzle.pieces.map((piece) => (
          <Piece
            key={piece.id}
            puzzle={puzzle}
            piece={piece}
            materials={materials}
            bodyTemplate={bodyTemplate}
            offsetView={offsetView}
            show={look.show}
            meshRef={pieces.pieceRefs.get(piece.id)}
          />
        ))}
      </group>
      <group ref={pivotRef} />
      <SliceGuide
        guideRef={marks.guideRef}
        onSweepsDone={(guide) => {
          if (marks.guideRef.current !== guide) return;
          marks.clearGuide();
          guide.onDone?.();
        }}
        onDrawn={(guide) => {
          if (marks.guideRef.current === guide) guide.onDone?.();
        }}
      />
      <FaceHints highlightRef={engine.highlightRef} puzzle={puzzle} />
    </group>
  );
}
