// @ts-check
import { useMemo } from 'react';

/** Ce que porte le groupe d’une pièce : son id (le pointeur la retrouve), sa place d’origine */
export function usePieceData(piece) {
  return useMemo(
    () => ({ pieceId: piece.id, initialSlot: piece.slot.slice(), kind: 'piece' }),
    [piece.id, piece.slot]
  );
}
