// @ts-check
import { useEffect, useMemo, useRef } from 'react';

/**
 * Les pièces à l’écran et l’état logique (`stateRef`) qu’elles suivent.
 * `rebakePiece` replace une pièce d’après l’état ; tout est replacé quand
 * le puzzle ou le décalage du look (`offsetView`) change.
 */
export function usePieceMeshes(puzzle, offsetView) {
  const meshById = useRef(new Map());
  const stateRef = useRef(puzzle.createState());

  const pieceRefs = useMemo(() => {
    const map = new Map();
    for (const piece of puzzle.pieces) {
      map.set(piece.id, (node) => {
        if (node) meshById.current.set(piece.id, node);
        else meshById.current.delete(piece.id);
      });
    }
    return map;
  }, [puzzle]);

  const rebakePiece = (id) => {
    const mesh = meshById.current.get(id);
    const pose = stateRef.current.byId[id];
    if (!mesh || !pose) return;
    if (puzzle.authored === 'slot') {
      const world = puzzle.slotWorld(pose.slot);
      mesh.position.set(world[0], world[1], world[2]);
    }
    mesh.quaternion.set(pose.quat[0], pose.quat[1], pose.quat[2], pose.quat[3]);
  };
  const rebakeAll = () => {
    for (const id of Object.keys(stateRef.current.byId)) rebakePiece(id);
  };

  const latest = useRef(rebakeAll);
  useEffect(() => {
    latest.current = rebakeAll;
  });
  useEffect(() => {
    const id = requestAnimationFrame(() => latest.current());
    return () => cancelAnimationFrame(id);
  }, [puzzle.id, offsetView]);

  return { meshById, stateRef, pieceRefs, rebakePiece, rebakeAll };
}
