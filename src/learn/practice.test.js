import { describe, expect, it } from 'vitest';
import { cube3 } from '../puzzles/cube/createCube';
import { applyTurns } from '../puzzles/core/state';
import {
  askHint,
  describeMove,
  isRotation,
  judgeMove,
  nextPractice,
  rotationHow,
  showsArrow,
  startPractice,
} from './practice';

const play = (state, tokens) => applyTurns(cube3, state, tokens.map((t) => cube3.toTurn(t)));

describe('judgeMove', () => {
  const before = play(cube3.createState(), ['F', "U'"]);

  it('accepts the expected move', () => {
    expect(judgeMove(cube3, { before, after: play(before, ['R']) }, 'R')).toBe('ok');
    expect(judgeMove(cube3, { before, after: play(before, ["R'"]) }, "R'")).toBe('ok');
  });

  it('refuses another face or the wrong direction', () => {
    expect(judgeMove(cube3, { before, after: play(before, ['L']) }, 'R')).toBe('wrong');
    expect(judgeMove(cube3, { before, after: play(before, ["R'"]) }, 'R')).toBe('wrong');
  });

  it('sees a half turn on its way, in either direction', () => {
    expect(judgeMove(cube3, { before, after: play(before, ['U']) }, 'U2')).toBe('half');
    expect(judgeMove(cube3, { before, after: play(before, ["U'"]) }, 'U2')).toBe('half');
    expect(judgeMove(cube3, { before, after: play(before, ['U', 'U']) }, 'U2')).toBe('ok');
    expect(judgeMove(cube3, { before, after: play(before, ["U'", "U'"]) }, 'U2')).toBe('ok');
  });

  it('judges states, not letters: same layer by another gesture counts', () => {
    // Tourner tout le cube puis une face n’est pas le coup demandé, même si la couche bouge pareil
    expect(judgeMove(cube3, { before, after: play(before, ['x', "R'"]) }, "L'")).toBe('wrong');
    // R2 joué par R' R' : accepté
    expect(judgeMove(cube3, { before, after: play(before, ["R'", "R'"]) }, 'R2')).toBe('ok');
  });
});

describe('nextPractice', () => {
  it('takes the child’s move during the demo too', () => {
    expect(nextPractice(startPractice(2), { type: 'ok' }, 2)).toMatchObject({ at: 1, status: 'demo', last: 'ok' });
    expect(nextPractice(startPractice(2), { type: 'half' }, 2)).toMatchObject({ status: 'half' });
    expect(nextPractice(startPractice(2), { type: 'wrong' }, 2)).toMatchObject({ misses: 1, status: 'demo', last: 'wrong' });
  });

  it('ignores a late "shown" once the child has answered', () => {
    const p = nextPractice(startPractice(2), { type: 'half' }, 2);
    expect(nextPractice(p, { type: 'shown' }, 2)).toBe(p);
  });

  it('walks demo → wait → ok to the next move, then done', () => {
    let p = startPractice(2);
    expect(p).toMatchObject({ at: 0, status: 'demo' });
    p = nextPractice(p, { type: 'shown' }, 2);
    expect(p.status).toBe('wait');
    p = nextPractice(p, { type: 'ok' }, 2);
    expect(p).toMatchObject({ at: 1, status: 'demo', last: 'ok', misses: 0 });
    p = nextPractice(nextPractice(p, { type: 'shown' }, 2), { type: 'ok' }, 2);
    expect(p.status).toBe('done');
  });

  it('counts misses and shows the move again', () => {
    let p = nextPractice(startPractice(3), { type: 'shown' }, 3);
    p = nextPractice(p, { type: 'wrong' }, 3);
    expect(p).toMatchObject({ at: 0, status: 'demo', misses: 1, last: 'wrong' });
    p = nextPractice(nextPractice(p, { type: 'shown' }, 3), { type: 'wrong' }, 3);
    expect(p.misses).toBe(2);
  });

  it('waits for the end of a half turn', () => {
    let p = nextPractice(startPractice(1), { type: 'shown' }, 1);
    p = nextPractice(p, { type: 'half' }, 1);
    expect(p.status).toBe('half');
    expect(nextPractice(p, { type: 'ok' }, 1).status).toBe('done');
  });
});

describe('the challenge: practice without the arrow', () => {
  it('waits without showing the move, after a good move and after a wrong one', () => {
    let p = startPractice(3, { hidden: true });
    expect(p.status).toBe('wait');
    expect(showsArrow(p)).toBe(false);
    p = nextPractice(p, { type: 'ok' }, 3);
    expect(p).toMatchObject({ at: 1, status: 'wait' });
    p = nextPractice(p, { type: 'wrong' }, 3);
    expect(p).toMatchObject({ at: 1, status: 'wait', misses: 1 });
  });

  it('shows the arrow for the one move the child asks a hint for', () => {
    let p = askHint(startPractice(2, { hidden: true }));
    expect(p.status).toBe('demo');
    expect(showsArrow(p)).toBe(true);
    p = nextPractice(nextPractice(p, { type: 'shown' }, 2), { type: 'ok' }, 2);
    expect(showsArrow(p)).toBe(false);
  });

  it('always shows the arrow outside the challenge', () => {
    expect(showsArrow(startPractice(2))).toBe(true);
  });
});

describe('describeMove', () => {
  it('says the face and the direction in plain words', () => {
    expect(describeMove('R')).toEqual({ face: 'la face de droite', turn: 'comme les aiguilles d’une montre', arrow: '↻' });
    expect(describeMove("U'")).toMatchObject({ face: 'le dessus', arrow: '↺' });
    expect(describeMove('F2')).toMatchObject({ turn: 'un demi-tour' });
    expect(describeMove('y').face).toBe('tout le cube');
    expect(isRotation('y')).toBe(true);
    expect(isRotation('R')).toBe(false);
  });
});

describe('rotationHow', () => {
  it('names the key on a keyboard', () => {
    expect(rotationHow('y', { touch: false })).toBe('Appuie sur Y.');
    expect(rotationHow("y'", { touch: false })).toBe('Appuie sur Espace + Y.');
    expect(rotationHow('z2', { touch: false })).toBe('Appuie 2 fois sur Z.');
  });

  it('describes the two-finger slide on a touch screen', () => {
    // y : la face avant part à gauche
    expect(rotationHow('y', { touch: true })).toBe('Glisse 2 doigts vers la gauche.');
    expect(rotationHow("y'", { touch: true })).toBe('Glisse 2 doigts vers la droite.');
    expect(rotationHow('y2', { touch: true })).toBe('Glisse 2 doigts vers la gauche, 2 fois.');
    // x et z : en diagonale, ↗ ↙ et ↘ ↖
    expect(rotationHow('x', { touch: true })).toBe('Glisse 2 doigts en diagonale ↗.');
    expect(rotationHow("x'", { touch: true })).toBe('Glisse 2 doigts en diagonale ↙.');
    expect(rotationHow('z', { touch: true })).toBe('Glisse 2 doigts en diagonale ↘.');
    expect(rotationHow('z2', { touch: true })).toBe('Glisse 2 doigts en diagonale ↘, 2 fois.');
  });
});
