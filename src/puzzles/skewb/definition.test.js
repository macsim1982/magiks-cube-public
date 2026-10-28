import { describe, expect, it } from 'vitest';
import { applyTipTurn, axisFromCorner, CORNERS, snapSlot, skewb, THIRD } from './definition';
import { applyTurns, statesEqual } from '../core/state';
import { quatFromAxisAngle, quatRotateVec } from '../../lib/math/quat';

const slotKey = (s) => s.join(',');

function occupied(state) {
  return Object.values(state.byId).map((p) => slotKey(p.slot)).sort();
}

describe('skewb', () => {
  it('has 8 corners and 6 centers', () => {
    const corners = skewb.pieces.filter((p) => p.kind === 'corner');
    const centers = skewb.pieces.filter((p) => p.kind === 'center');
    expect(corners).toHaveLength(8);
    expect(centers).toHaveLength(6);
  });

  it('parses Cyril tokens and aliases', () => {
    expect(skewb.toTurn('1')).not.toBeNull();
    expect(skewb.toTurn("2'")).not.toBeNull();
    expect(skewb.toTurn('R')).not.toBeNull();
    expect(skewb.parseAlg("1 2 1' 2'")).toEqual(['1', '2', "1'", "2'"]);
  });

  it('invert is involutive', () => {
    expect(skewb.invert(skewb.invert('1'))).toBe('1');
    expect(skewb.invert("1'")).toBe('1');
  });

  it.each(['1', '2', '3', '4'])('%s %s %s is identity', (token) => {
    const solved = skewb.createState();
    const turns = [token, token, token].map((t) => skewb.toTurn(t));
    const next = applyTurns(skewb, solved, turns);
    expect(statesEqual(solved, next)).toBe(true);
  });

  it.each(['1', '2', '3', '4'])("%s then %s' is identity", (token) => {
    const solved = skewb.createState();
    const next = applyTurns(skewb, solved, [
      skewb.toTurn(token),
      skewb.toTurn(`${token}'`),
    ]);
    expect(statesEqual(solved, next)).toBe(true);
  });

  it('1 moves three adjacent centers, not the opposite center', () => {
    const solved = skewb.createState();
    const turn = skewb.toTurn('1');
    const tip = turn.tip;
    const moved = new Set(skewb.movingIds(solved, turn));

    const oppositeId = `corner-${-tip[0]},${-tip[1]},${-tip[2]}`;
    expect(moved.has(oppositeId)).toBe(false);

    const next = skewb.apply(solved, turn);
    expect(slotKey(next.byId[oppositeId].slot)).toBe(slotKey(solved.byId[oppositeId].slot));
    expect(next.byId[oppositeId].quat).toEqual(solved.byId[oppositeId].quat);

    const adjacentFaces = [];
    if (tip[0] === 1) adjacentFaces.push('center-right');
    if (tip[0] === -1) adjacentFaces.push('center-left');
    if (tip[1] === 1) adjacentFaces.push('center-top');
    if (tip[1] === -1) adjacentFaces.push('center-bottom');
    if (tip[2] === 1) adjacentFaces.push('center-front');
    if (tip[2] === -1) adjacentFaces.push('center-back');
    expect(adjacentFaces).toHaveLength(3);
    for (const id of adjacentFaces) {
      expect(slotKey(solved.byId[id].slot)).not.toBe(slotKey(next.byId[id].slot));
    }
  });

  it('keeps one piece per slot after every token', () => {
    for (const token of ['1', '2', '3', '4', "1'", "2'", "3'", "4'"]) {
      const next = skewb.apply(skewb.createState(), skewb.toTurn(token));
      const keys = occupied(next);
      expect(new Set(keys).size).toBe(14);
    }
  });

  it('slots follow the same quaternion as the animation', () => {
    for (const tip of CORNERS) {
      const solved = skewb.createState();
      const next = applyTipTurn(solved, tip, THIRD);
      const q = quatFromAxisAngle(axisFromCorner(tip), THIRD);
      for (const id of Object.keys(solved.byId)) {
        const before = solved.byId[id];
        const after = next.byId[id];
        if (before.slot[0] * tip[0] + before.slot[1] * tip[1] + before.slot[2] * tip[2] <= 0) {
          expect(slotKey(after.slot)).toBe(slotKey(before.slot));
          continue;
        }
        expect(slotKey(after.slot)).toBe(slotKey(snapSlot(quatRotateVec(q, before.slot))));
      }
    }
  });

  it('three turns around every corner is identity', () => {
    const solved = skewb.createState();
    for (const tip of CORNERS) {
      let state = solved;
      for (let i = 0; i < 3; i++) state = applyTipTurn(state, tip, THIRD);
      expect(statesEqual(solved, state)).toBe(true);
    }
  });

  it('+++ cycles +X → +Y → +Z', () => {
    const solved = skewb.createState();
    const next = applyTipTurn(solved, [1, 1, 1], THIRD);
    expect(slotKey(next.byId['center-right'].slot)).toEqual('0,1,0');
    expect(slotKey(next.byId['center-top'].slot)).toEqual('0,0,1');
    expect(slotKey(next.byId['center-front'].slot)).toEqual('1,0,0');
  });

  it('scramble avoids consecutive same corner', () => {
    const moves = skewb.scramble(25);
    expect(moves).toHaveLength(25);
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i][0]).not.toBe(moves[i - 1][0]);
    }
    for (const m of moves) {
      expect(skewb.toTurn(m)).not.toBeNull();
    }
  });
});
