import { describe, expect, it } from 'vitest';
import Cube from '../../vendor/cubejs/index.js';
import { verifyFacelets } from './verifyFacelets';

const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
const scrambled = (alg) => new Cube().move(alg).asString();
/** Remplace des facettes : `{ index: lettre }` */
const edit = (facelets, changes) => [...facelets].map((f, i) => changes[i] ?? f).join('');

describe('verifyFacelets', () => {
  it('accepts a solved cube and real scrambles', () => {
    expect(verifyFacelets(SOLVED)).toEqual({ ok: true });
    expect(verifyFacelets(scrambled("R U R' U' F2 D L' B2"))).toEqual({ ok: true });
    expect(verifyFacelets(scrambled("D2 B' L U2 R F' D' B L2 U F R2"))).toEqual({ ok: true });
  });

  it('needs nine stickers of each colour', () => {
    expect(verifyFacelets(edit(SOLVED, { 0: 'R' }))).toMatchObject({ ok: false, fault: 'count' });
  });

  it('finds a corner whose colours do not exist, and shows it', () => {
    // R1 (coin URF) et D3 (coin DFR) échangés : URF se lit U, D, F, un coin qui n’existe pas
    const bad = edit(SOLVED, { 9: 'D', 29: 'R' });
    expect(verifyFacelets(bad)).toEqual({ ok: false, fault: 'corner', at: [8, 9, 20] });
  });

  it('finds an edge whose colours do not exist', () => {
    // R2 (arête UR) et D6 (arête DR) échangés : UR se lit U, D
    const bad = edit(SOLVED, { 10: 'D', 32: 'R' });
    expect(verifyFacelets(bad)).toEqual({ ok: false, fault: 'edge', at: [5, 10] });
  });

  it('sees a corner twisted in place', () => {
    // URF : U R F → F U R
    expect(verifyFacelets(edit(SOLVED, { 8: 'F', 9: 'U', 20: 'R' }))).toEqual({ ok: false, fault: 'twist', at: [] });
  });

  it('sees an edge flipped in place', () => {
    // UF : U F → F U
    expect(verifyFacelets(edit(SOLVED, { 7: 'F', 19: 'U' }))).toEqual({ ok: false, fault: 'flip', at: [] });
  });

  it('sees two edges swapped by hand', () => {
    // UR et UL échangées : un seul échange d’arêtes, impossible en tournant
    expect(verifyFacelets(edit(SOLVED, { 10: 'L', 37: 'R' }))).toEqual({ ok: false, fault: 'parity', at: [] });
  });
});
