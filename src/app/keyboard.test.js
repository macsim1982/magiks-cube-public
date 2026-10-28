import { describe, expect, it } from 'vitest';
import { getPuzzle } from '../puzzles';
import { keyDown, keyMove, pressesButton, SPACE_UP, spaceAlone } from './keyboard';

const cube = getPuzzle('cube3');

/** Joue des touches enfoncées à la suite ; rend les actions et Espace à la fin. */
function press(keys, space = SPACE_UP) {
  const actions = [];
  for (const key of keys) {
    const result = keyDown(cube, space, key);
    space = result.space;
    if (result.action) actions.push(result.action);
  }
  return { actions, space };
}

describe('keyMove', () => {
  it('plays the letter, whatever its case', () => {
    expect(keyMove(cube, 'r', false)).toBe('R');
    expect(keyMove(cube, 'R', false)).toBe('R');
    expect(keyMove(cube, 'X', false)).toBe('x');
  });

  it('plays the other way while Space is held', () => {
    expect(keyMove(cube, 'r', true)).toBe("R'");
    expect(keyMove(cube, 'y', true)).toBe("y'");
  });

  it('ignores keys the puzzle does not know', () => {
    expect(keyMove(cube, 'q', false)).toBeNull();
  });
});

describe('keyDown and spaceAlone', () => {
  it('moves the race on when Space is released alone', () => {
    const { actions, space } = press([' ']);
    expect(actions).toEqual([]);
    expect(spaceAlone(space)).toBe(true);
  });

  it('plays the inverse with Space held, and the race waits', () => {
    const { actions, space } = press([' ', 'r', 'u']);
    expect(actions).toEqual([{ type: 'move', token: "R'" }, { type: 'move', token: "U'" }]);
    expect(spaceAlone(space)).toBe(false);
  });

  it('undoes with Space held, and the race waits', () => {
    const { actions, space } = press([' ', 'Backspace']);
    expect(actions).toEqual([{ type: 'undo' }]);
    expect(spaceAlone(space)).toBe(false);
  });

  it('keeps Space alone when nothing else was pressed during the hold', () => {
    expect(spaceAlone(press(['r', ' ']).space)).toBe(true);
    expect(spaceAlone(SPACE_UP)).toBe(false);
  });

  it('plays plain moves without Space', () => {
    expect(press(['r', 'Backspace']).actions).toEqual([{ type: 'move', token: 'R' }, { type: 'undo' }]);
  });
});

describe('pressesButton', () => {
  it('leaves Space and Enter to a focused button, not the letters', () => {
    expect(pressesButton(' ')).toBe(true);
    expect(pressesButton('Enter')).toBe(true);
    expect(pressesButton('r')).toBe(false);
    expect(pressesButton('Backspace')).toBe(false);
  });
});
