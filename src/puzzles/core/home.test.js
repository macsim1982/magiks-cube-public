import { describe, expect, it } from 'vitest';
import { getPuzzle } from '../index';
import { quatFromAxisAngle } from '../../lib/math/quat';
import { applyTurns, cloneState } from './state';
import { homeOf, isHome } from './home';

const cube = getPuzzle('cube3');
const play = (state, alg) => applyTurns(cube, state, cube.parseAlg(alg).map((t) => cube.toTurn(t, cube.DEFAULT_FRAME)));
const away = (state) => cube.pieces.filter(({ id }) => !isHome(cube.pieces, state, id)).map(({ id }) => id);
const piece = (...colors) => cube.pieces.find((p) => p.faces.length === colors.length && colors.every((c) => p.faces.some((f) => f.color === c))).id;

describe('homeOf and isHome', () => {
  it('finds every piece at home on a solved cube', () => {
    expect(away(cube.createState())).toEqual([]);
  });

  it('places an edge between the centres of its two colours', () => {
    const id = piece('top', 'front');
    const solved = cube.createState();
    expect(homeOf(cube.pieces, solved, id).slot).toEqual(solved.byId[id].slot);
  });

  it('sees the pieces a turn moved, and not after the turn is undone', () => {
    const solved = cube.createState();
    expect(away(play(solved, 'R'))).toHaveLength(8);
    expect(away(play(solved, "R R'"))).toEqual([]);
  });

  it('follows the cube turned whole: nothing is away after x, y or z2', () => {
    const solved = cube.createState();
    expect(away(play(solved, 'x y z2'))).toEqual([]);
  });

  it('follows the centres a middle slice took along', () => {
    // Après M, les arêtes de la tranche sont parties avec leurs centres : chez elles. Le reste, non.
    const state = play(cube.createState(), 'M');
    expect(isHome(cube.pieces, state, piece('top', 'front'))).toBe(true);
    expect(isHome(cube.pieces, state, piece('top', 'right'))).toBe(false);
    expect(away(state)).toHaveLength(16);
  });

  it('tells an edge flipped in its own slot from one at home', () => {
    const id = piece('top', 'front');
    const state = cloneState(cube.createState());
    // Un demi-tour autour de la diagonale de l’arête : même place, couleurs échangées
    state.byId[id].quat = quatFromAxisAngle([0, Math.SQRT1_2, Math.SQRT1_2], Math.PI);
    expect(homeOf(cube.pieces, state, id).slot).toEqual(state.byId[id].slot);
    expect(isHome(cube.pieces, state, id)).toBe(false);
  });

  it('has no home for a centre', () => {
    const center = cube.pieces.find((p) => p.kind === 'center').id;
    expect(homeOf(cube.pieces, cube.createState(), center)).toBeNull();
  });
});
