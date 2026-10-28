import { describe, expect, it } from 'vitest';
import { createCube } from './createCube';
import { applyTurns, statesEqual } from '../core/state';
import { isColorSolved } from './inspect';

describe('createCube', () => {
  it('builds the right number of surface pieces', () => {
    expect(createCube(3).pieces).toHaveLength(26);
    expect(createCube(4).pieces).toHaveLength(56);
    expect(createCube(8).pieces).toHaveLength(296);
  });

  it('places n=3 slots on {-1,0,1}', () => {
    const cube = createCube(3);
    const worlds = cube.pieces.map((p) => cube.slotWorld(p.slot));
    for (const w of worlds) {
      for (const c of w) expect([-1, 0, 1]).toContain(c);
    }
  });

  it('R only moves the outer +X layer', () => {
    const cube = createCube(4);
    const state = cube.createState();
    const turn = cube.toTurn('R');
    const moved = new Set(cube.movingIds(state, turn));
    expect(moved.size).toBe(16); // 4×4 face
    for (const id of moved) {
      expect(state.byId[id].slot[0]).toBe(3);
    }
  });

  it('rejects M E S on even cubes', () => {
    expect(createCube(4).toTurn('M')).toBeNull();
    expect(createCube(3).toTurn('M')).not.toBeNull();
  });
});

describe('cube notation', () => {
  const cube = createCube(3);

  it('round-trips face tokens', () => {
    for (const token of ['R', "R'", 'U2', 'F', "L'"]) {
      const turn = cube.toTurn(token);
      expect(turn).not.toBeNull();
      if (token.endsWith('2')) continue;
      const back = cube.turnToToken(turn);
      expect(back === token || back === token.replace("'", '') || `${back}'` === token || back === `${token}'`).toBeTruthy();
    }
  });

  it('round-trips whole-cube rotations', () => {
    for (const token of ['x', "y'", 'z', 'y2']) {
      expect(cube.turnToToken(cube.toTurn(token))).toBe(token);
    }
  });

  it('invert is involutive on face moves', () => {
    expect(cube.invert(cube.invert('R'))).toBe('R');
    expect(cube.invert("R'")).toBe('R');
    expect(cube.invert('R2')).toBe('R2');
  });

  it('R R R R is identity', () => {
    const solved = cube.createState();
    const turns = ['R', 'R', 'R', 'R'].map((t) => cube.toTurn(t));
    const next = applyTurns(cube, solved, turns);
    expect(statesEqual(solved, next)).toBe(true);
  });

  it('scramble avoids consecutive same face', () => {
    const moves = cube.scramble(30);
    expect(moves).toHaveLength(30);
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i][0]).not.toBe(moves[i - 1][0]);
    }
    for (const m of moves) {
      expect(cube.toTurn(m)).not.toBeNull();
    }
  });
});

describe('cube isSolved', () => {
  const cube = createCube(3);
  const play = (tokens) => applyTurns(cube, cube.createState(), tokens.map((t) => cube.toTurn(t)));

  it('ignores whole-cube rotations', () => {
    expect(cube.isSolved(play(['x', 'y', "z'"]))).toBe(true);
  });

  it('agrees with isColorSolved on every scramble prefix', () => {
    for (let i = 0; i < 20; i += 1) {
      const scramble = cube.scramble(20);
      for (let at = 0; at <= scramble.length; at += 1) {
        const state = play(scramble.slice(0, at));
        expect(cube.isSolved(state), scramble.slice(0, at).join(' ')).toBe(isColorSolved(state));
      }
    }
  });

  it('sees a solved 4×4 whatever its center permutation', () => {
    const cube4 = createCube(4);
    const state = applyTurns(cube4, cube4.createState(), ['x', 'y2'].map((t) => cube4.toTurn(t)));
    expect(cube4.isSolved(state)).toBe(true);
  });
});

describe('mirror cube geometry', () => {
  // Les couches n’ont pas la même épaisseur : le bloc entier se décale de `offset`.
  // PuzzleView compense ce décalage pour que le cube reste centré (Mirror ↔ Classique).
  it('shifts the whole block by exactly the offset on each axis', () => {
    const cube = createCube(3);
    const offset = [0.6, 0.4, 0.15];
    for (let axis = 0; axis < 3; axis += 1) {
      let min = Infinity;
      let max = -Infinity;
      for (const piece of cube.pieces) {
        const { size, center } = cube.cubeletBoxMirror(piece.world, offset);
        const middle = piece.world[axis] + center[axis];
        min = Math.min(min, middle - size[axis] / 2);
        max = Math.max(max, middle + size[axis] / 2);
      }
      expect((min + max) / 2).toBeCloseTo(offset[axis], 2);
    }
  });
});

describe('rounded cubie body', () => {
  const cube = createCube(3);
  const shaped = (template, size) => {
    const body = template.clone();
    cube.reshapeRoundedBox(template, body, { size, radius: cube.BODY_RADIUS });
    return body;
  };

  it('fills exactly the requested box, with unit normals and UVs in [0, 1]', () => {
    const size = [1.395, 0.795, 1.095];
    const body = shaped(cube.createBodyTemplate(), size);
    body.computeBoundingBox();
    const { min, max } = body.boundingBox;
    size.forEach((length, axis) => {
      expect(max.getComponent(axis) - min.getComponent(axis)).toBeCloseTo(length, 5);
    });
    const normals = body.attributes.normal.array;
    for (let i = 0; i < normals.length; i += 3) {
      expect(Math.hypot(normals[i], normals[i + 1], normals[i + 2])).toBeCloseTo(1, 5);
    }
    for (const uv of body.attributes.uv.array) {
      expect(uv).toBeGreaterThanOrEqual(-1e-6);
      expect(uv).toBeLessThanOrEqual(1 + 1e-6);
    }
  });

  // Valeurs relevées avec l’implémentation d’avant la base pré-calculée :
  // trois sommets par face, pour les six faces
  it('keeps the UV mapping of every face', () => {
    const body = shaped(cube.createBodyTemplate(), [1.395, 0.795, 1.095]);
    const uv = body.attributes.uv.array;
    const golden = [
      [0, 0, 1], [7, 0.010703, 0.985076], [246, 0.940762, 0.917399],
      [486, 0, 1], [493, 0.010703, 0.985076], [732, 0.940762, 0.917399],
      [972, 0, 1], [979, 0.008343, 0.989298], [1218, 0.953823, 0.940762],
      [1458, 0, 0], [1465, 0.008343, 0.010703], [1704, 0.953823, 0.059238],
      [1944, 0, 1], [1951, 0.008343, 0.985076], [2190, 0.953823, 0.917399],
      [2430, 0, 1], [2437, 0.008343, 0.985076], [2676, 0.953823, 0.917399],
    ];
    for (const [vertex, u, v] of golden) {
      expect(uv[vertex * 2], `u of vertex ${vertex}`).toBeCloseTo(u, 5);
      expect(uv[vertex * 2 + 1], `v of vertex ${vertex}`).toBeCloseTo(v, 5);
    }
  });

  // Le gabarit garde ce qui ne dépend pas des dimensions : le morph Mirror ↔
  // couleurs le remodèle à chaque image sans rien en abîmer
  it('reshapes the same body many times without drift', () => {
    const template = cube.createBodyTemplate();
    const direct = shaped(template, [0.995, 0.995, 0.995]);
    const morphed = template.clone();
    for (const size of [[1.395, 0.795, 1.095], [0.6, 1.4, 0.95], [0.995, 0.995, 0.995]]) {
      cube.reshapeRoundedBox(template, morphed, { size, radius: cube.BODY_RADIUS });
    }
    for (const name of ['position', 'normal', 'uv']) {
      expect(Array.from(morphed.attributes[name].array)).toEqual(Array.from(direct.attributes[name].array));
    }
  });
});
