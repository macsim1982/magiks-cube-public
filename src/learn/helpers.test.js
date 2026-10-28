import { describe, expect, it } from 'vitest';
import { cube3 } from '../puzzles/cube/createCube';
import { pieceWith, SHOW_WHITE_CROSS, SHOW_WHITE_FACE } from './helpers';

const byId = new Map(cube3.pieces.map((piece) => [piece.id, piece]));

function colors(id) {
  return byId.get(id).faces.map((face) => face.color);
}

describe('lesson show lists', () => {
  it('names pieces that exist on the 3×3', () => {
    for (const id of [...SHOW_WHITE_CROSS, ...SHOW_WHITE_FACE]) {
      expect(byId.has(id)).toBe(true);
    }
  });

  it('shows the white cross: center and four white edges', () => {
    const shown = SHOW_WHITE_CROSS.map((id) => byId.get(id));
    const whiteEdges = shown.filter((piece) => piece.kind === 'edge' && colors(piece.id).includes('top'));
    const whiteCenter = shown.filter((piece) => piece.kind === 'center' && colors(piece.id).includes('top'));
    expect(whiteEdges).toHaveLength(4);
    expect(whiteCenter).toHaveLength(1);
  });

  it('finds a piece by its exact colours', () => {
    expect(colors(pieceWith('top', 'back')).sort()).toEqual(['back', 'top']);
    expect(byId.get(pieceWith('top', 'front', 'right')).kind).toBe('corner');
    expect(pieceWith('top', 'bottom')).toBeUndefined();
  });
});
