import { describe, expect, it } from 'vitest';
import { getPuzzle } from '../index';
import { applyTurns, movedIds } from './state';

const cube = getPuzzle('cube3');
const play = (state, alg) => applyTurns(cube, state, cube.parseAlg(alg).map((t) => cube.toTurn(t, cube.DEFAULT_FRAME)));
const kind = (id) => cube.pieces.find((piece) => piece.id === id).kind;

describe('movedIds', () => {
  it('lists the pieces of a turned layer, not its centre spinning in place', () => {
    const solved = cube.createState();
    const moved = movedIds(cube.pieces, solved, play(solved, 'R'));
    expect(moved).toHaveLength(8);
    expect(moved.map(kind)).not.toContain('center');
  });

  it('is empty when the pieces are back home', () => {
    const solved = cube.createState();
    expect(movedIds(cube.pieces, solved, play(solved, "R R'"))).toEqual([]);
  });

  it('keeps only what changed to the eye over a whole case', () => {
    // « Arête en bas » : M et D font tourner des centres sur eux-mêmes, ils ne comptent pas
    const start = play(cube.createState(), "M D' M' D");
    const moved = movedIds(cube.pieces, start, play(start, "D' M D M'"));
    expect(moved.length).toBeGreaterThan(0);
    expect(moved.map(kind)).not.toContain('center');
  });
});
