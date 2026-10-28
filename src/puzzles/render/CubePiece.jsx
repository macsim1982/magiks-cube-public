// @ts-check
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { usePieceData } from './piece';

const NO_OFFSET = [0, 0, 0];

// Géométries de sticker partagées par taille, libérées avec leur dernier
// sticker. Une extrusion coûte : au repos, les 54 stickers d’un 3×3 n’ont
// qu’une taille (au plus 27 en Mirror).
const stickerGeometries = new Map();

function useStickerGeometry(puzzle, width, height) {
  const key = `${width}x${height}`;
  const entry = useMemo(() => {
    let shared = stickerGeometries.get(key);
    if (!shared) {
      shared = { geometry: puzzle.createStickerGeometry(width, height), users: 0 };
      stickerGeometries.set(key, shared);
    }
    return shared;
  }, [puzzle, key, width, height]);

  useEffect(() => {
    entry.users += 1;
    return () => {
      entry.users -= 1;
      if (entry.users > 0) return;
      entry.geometry.dispose();
      if (stickerGeometries.get(key) === entry) stickerGeometries.delete(key);
    };
  }, [entry, key]);

  return entry.geometry;
}

/**
 * Le corps arrondi d’une pièce : sa taille et son centre (en Mirror, chaque
 * pièce a les siennes), une copie du gabarit remise à cette taille.
 */
function useCubeBody({ puzzle, world, offsetView, bodyTemplate }) {
  const lookOffset = offsetView ?? NO_OFFSET;
  const isMirror3 = puzzle.n === 3;

  const { size, center } = useMemo(() => {
    if (isMirror3) return puzzle.cubeletBoxMirror(world, lookOffset);
    const s = puzzle.cubieSize();
    return { size: s, center: [0, 0, 0] };
  }, [puzzle, isMirror3, world, lookOffset]);

  const template = bodyTemplate;
  const bodyGeometry = useMemo(
    () => (template ? template.clone() : puzzle.createSimpleBodyGeometry()),
    [template, puzzle]
  );

  useEffect(() => () => bodyGeometry.dispose(), [bodyGeometry]);

  useLayoutEffect(() => {
    if (!template) return;
    puzzle.reshapeRoundedBox(template, bodyGeometry, { size, radius: puzzle.bodyRadius });
  }, [template, bodyGeometry, size, puzzle]);

  return { size, center, bodyGeometry };
}

/**
 * Pièce NxN : body rounded + stickers. n=3 garde le mode miroir.
 */
export default function CubePiece({
  puzzle,
  piece,
  materials,
  bodyTemplate,
  offsetView,
  show,
  meshRef,
}) {
  // Tableaux stables : un nouveau tableau à chaque rendu relancerait
  // `reshapeRoundedBox` sur les 26 corps à chaque rendu de l’App
  const world = useMemo(() => puzzle.slotWorld(piece.slot), [puzzle, piece.slot]);
  const { size, center, bodyGeometry } = useCubeBody({ puzzle, world, offsetView, bodyTemplate });
  const stickers = !show?.length || show.includes(piece.id) ? piece.faces : [];
  const userData = usePieceData(piece);

  return (
    <group ref={meshRef} position={world} userData={userData}>
      <mesh
        position={center}
        geometry={bodyGeometry}
        material={materials.body}
        userData={{ kind: 'body' }}
        castShadow
        receiveShadow
      />
      {stickers.map((face) => (
        <CubeSticker
          key={face.color}
          puzzle={puzzle}
          face={face}
          size={size}
          center={center}
          material={materials.stickers[face.color]}
        />
      ))}
    </group>
  );
}

function CubeSticker({ puzzle, face, size, center, material }) {
  const [width, height] = puzzle.stickerSize(face, size);
  const { position } = puzzle.stickerLayout(face, size, center);
  const geometry = useStickerGeometry(puzzle, width, height);
  const userData = useMemo(() => ({ kind: 'sticker', face: face.color }), [face.color]);

  return (
    <mesh
      position={position}
      rotation={face.rotation}
      geometry={geometry}
      material={material}
      userData={userData}
      receiveShadow
    />
  );
}
