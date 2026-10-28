// @ts-check
import { useEffect, useMemo } from 'react';
import { usePieceData } from './piece';

/**
 * Pièce Skewb : géométrie déjà placée en world (home).
 * PuzzleView n’applique que `state.quat` autour de l’origine.
 */
export default function SkewbPiece({ puzzle, piece, materials, show, meshRef }) {
  const visible = !show?.length || show.includes(piece.id);

  const userData = usePieceData(piece);

  const bodyGeometry = useMemo(() => {
    if (piece.kind === 'corner') {
      return puzzle.createCornerGeometry(piece.slot[0], piece.slot[1], piece.slot[2]);
    }
    return puzzle.createCenterGeometry(piece.face);
  }, [puzzle, piece]);

  const stickers = useMemo(() => {
    if (!visible) return [];
    if (piece.kind === 'corner') {
      return puzzle.createCornerStickers(piece.slot, piece.faces);
    }
    return puzzle.createCenterStickers(piece.face, piece.faces[0].color);
  }, [puzzle, piece, visible]);

  useEffect(() => () => {
    bodyGeometry.dispose();
    stickers.forEach((s) => s.geometry.dispose());
  }, [bodyGeometry, stickers]);

  return (
    <group ref={meshRef} userData={userData}>
      <mesh
        geometry={bodyGeometry}
        material={materials.body}
        userData={{ kind: 'body' }}
        castShadow
        receiveShadow
      />
      {stickers.map((sticker) => (
        <mesh
          key={sticker.color}
          geometry={sticker.geometry}
          material={materials.stickers[sticker.color]}
          userData={{ kind: 'sticker', face: sticker.color }}
          receiveShadow
        />
      ))}
    </group>
  );
}
