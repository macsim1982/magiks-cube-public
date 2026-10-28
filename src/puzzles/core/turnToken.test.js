import { describe, expect, it } from 'vitest';
import { cube3 } from '../cube/createCube';
import { skewb } from '../skewb/definition';
import { turnToken } from './turnToken';

const HOME = cube3.DEFAULT_FRAME;
// Caméra d’un quart de tour autour de Y (frame.test.js)
const QUARTER = { R: { axis: 'z', sign: -1 }, U: { axis: 'y', sign: 1 }, F: { axis: 'x', sign: 1 } };

describe('turnToken', () => {
  it.each(['R', "R'", 'L', 'M', "E'", 'S', 'x', "y'"])('names %s while it turns', (token) => {
    const turn = cube3.toTurn(token, HOME);
    expect(turnToken({ ...turn, intent: turn.angle * 0.4 }, cube3, HOME)).toBe(token);
  });

  it('reads the drag intent: the other way, or a half turn', () => {
    const turn = cube3.toTurn('R', HOME);
    expect(turnToken({ ...turn, intent: -turn.angle }, cube3, HOME)).toBe("R'");
    expect(turnToken({ ...turn, intent: turn.angle * 2 }, cube3, HOME)).toBe('R2');
  });

  it('names nothing before the turn starts', () => {
    expect(turnToken({ ...cube3.toTurn('U', HOME), intent: 0 }, cube3, HOME)).toBeNull();
  });

  it.each(['R', 'U', "F'", 'M'])('follows the camera like turnToToken (%s)', (token) => {
    const turn = cube3.toTurn(token, HOME);
    expect(turnToken(turn, cube3, QUARTER)).toBe(cube3.turnToToken(turn, QUARTER));
  });

  it.each(['R', "L'", 'U', "B'"])('names a skewb turn that turns the same corner the same way (%s)', (token) => {
    const turn = skewb.toTurn(token, skewb.DEFAULT_FRAME);
    const named = turnToken({ ...turn, intent: turn.angle * 0.4 }, skewb, skewb.DEFAULT_FRAME);
    expect(skewb.toTurn(named, skewb.DEFAULT_FRAME)).toEqual(turn);
  });
});
