import { describe, expect, it } from 'vitest';
import { randomMoves } from './scramble';

describe('randomMoves', () => {
  it('draws the length asked, from the faces and modifiers, never the same face twice in a row', () => {
    const moves = randomMoves(['R', 'U', 'F'], ['', "'", '2'], 200);
    expect(moves).toHaveLength(200);
    for (const move of moves) expect(move).toMatch(/^[RUF]['2]?$/);
    moves.slice(1).forEach((move, i) => expect(move[0]).not.toBe(moves[i][0]));
  });
});
