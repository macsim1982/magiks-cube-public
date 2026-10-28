import { describe, expect, it } from 'vitest';
import { PUZZLE_LIST } from './index';
import { applyTurns, statesEqual } from './core/state';
import { quatFromAxisAngle, quatMultiply, quatRotateVec } from '../lib/math/quat';

// Contrat PuzzleDefinition vérifié sur chaque puzzle du registre :
// un nouveau puzzle est couvert dès qu'il est ajouté à PUZZLE_LIST.

const FUNCTIONS = [
  'toTurn', 'turnToToken', 'invert', 'invertAlg', 'parseAlg', 'scramble',
  'viewFrame', 'movingIds', 'apply', 'createState', 'isSolved', 'turnAxis',
];

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
// q et -q : même orientation
const sameQuat = (a, b) => close(a, b) || close(a, b.map((v) => -v));

function play(puzzle, tokens, state = puzzle.createState()) {
  return applyTurns(puzzle, state, tokens.map((token) => {
    const turn = puzzle.toTurn(token, puzzle.DEFAULT_FRAME);
    if (!turn) throw new Error(`${puzzle.id} : token inconnu ${token}`);
    return turn;
  }));
}

function keyTokens(puzzle) {
  return [...new Set(Object.values(puzzle.keys))]
    .filter((token) => puzzle.toTurn(token, puzzle.DEFAULT_FRAME));
}

describe.each(PUZZLE_LIST.map((puzzle) => [puzzle.id, puzzle]))('%s contract', (_id, puzzle) => {
  const solved = puzzle.createState();

  it('exposes the documented shape', () => {
    expect(puzzle.id).toBeTypeOf('string');
    expect(puzzle.label).toBeTypeOf('string');
    expect(puzzle.angle).toBeGreaterThan(0);
    expect(['slot', 'world']).toContain(puzzle.authored);
    expect(puzzle.Piece).toBeTypeOf('function');
    expect(puzzle.mirror).toBeTypeOf('boolean');
    expect(puzzle.DEFAULT_FRAME).toBeTypeOf('object');
    for (const name of FUNCTIONS) expect(puzzle[name], name).toBeTypeOf('function');
    if (puzzle.authored === 'slot') expect(puzzle.slotWorld).toBeTypeOf('function');
    for (const flag of ['lessons', 'solver', 'race']) {
      expect(puzzle.capabilities[flag], flag).toBeTypeOf('boolean');
    }
  });

  it('knows when it is solved', () => {
    expect(puzzle.isSolved(solved)).toBe(true);
    expect(puzzle.isSolved(play(puzzle, puzzle.scramble(20)))).toBe(false);
  });

  // Le runtime tourne le pivot de `angle` autour de `turnAxis` : il doit
  // arriver exactement où `apply` place les pièces.
  it.each(keyTokens(puzzle))('%s : pivot on turnAxis lands where apply does', (token) => {
    const turn = puzzle.toTurn(token, puzzle.DEFAULT_FRAME);
    const axis = puzzle.turnAxis(turn);
    expect(Math.hypot(...axis)).toBeCloseTo(1, 9);
    const spin = quatFromAxisAngle(axis, turn.angle);
    const next = puzzle.apply(solved, turn);
    const moving = new Set(puzzle.movingIds(solved, turn));
    for (const id of Object.keys(solved.byId)) {
      const before = solved.byId[id];
      const after = next.byId[id];
      if (!moving.has(id)) {
        expect(after.slot, id).toEqual(before.slot);
        continue;
      }
      expect(sameQuat(after.quat, quatMultiply(spin, before.quat)), id).toBe(true);
      if (puzzle.authored === 'slot') {
        const expected = quatRotateVec(spin, puzzle.slotWorld(before.slot));
        expect(close(puzzle.slotWorld(after.slot), expected), id).toBe(true);
      }
    }
  });

  it('gives every piece a unique id and a pose', () => {
    const ids = puzzle.pieces.map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(solved.byId).sort()).toEqual([...ids].sort());
  });

  it('maps at least one key to a playable token', () => {
    expect(keyTokens(puzzle).length).toBeGreaterThan(0);
  });

  it.each(keyTokens(puzzle))('%s moves pieces and is undone by its inverse', (token) => {
    const turn = puzzle.toTurn(token, puzzle.DEFAULT_FRAME);
    const moving = puzzle.movingIds(solved, turn);
    expect(moving.length).toBeGreaterThan(0);
    for (const id of moving) expect(solved.byId).toHaveProperty(id);
    expect(statesEqual(play(puzzle, [token, puzzle.invert(token)]), solved)).toBe(true);
  });

  it.each(keyTokens(puzzle))('%s repeated a full turn is identity', (token) => {
    const repeats = Math.round((2 * Math.PI) / puzzle.angle);
    expect(statesEqual(play(puzzle, Array(repeats).fill(token)), solved)).toBe(true);
  });

  it('does not mutate the state it is given', () => {
    const before = puzzle.createState();
    play(puzzle, puzzle.scramble(5), before);
    expect(statesEqual(before, solved)).toBe(true);
  });

  it('undoes a scramble with invertAlg', () => {
    const scramble = puzzle.scramble(20);
    expect(scramble.length).toBeGreaterThan(0);
    expect(puzzle.parseAlg(scramble.join(' '))).toEqual(scramble);
    expect(statesEqual(play(puzzle, scramble), solved)).toBe(false);
    expect(statesEqual(play(puzzle, [...scramble, ...puzzle.invertAlg(scramble)]), solved)).toBe(true);
  });

  it('round-trips scramble tokens through turnToToken', () => {
    for (const token of puzzle.scramble(20)) {
      const turn = puzzle.toTurn(token, puzzle.DEFAULT_FRAME);
      const back = puzzle.turnToToken(turn, puzzle.DEFAULT_FRAME);
      expect(back, token).not.toBeNull();
      expect(statesEqual(play(puzzle, [back]), play(puzzle, [token])), `${token} → ${back}`).toBe(true);
    }
  });
});
