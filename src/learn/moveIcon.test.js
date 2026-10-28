import { describe, expect, it } from 'vitest';
import { MOVE_ICON_TOKENS, moveIcon } from './moveIcon';

const lit = (stickers) => stickers.map((color) => (color === 'hidden' ? '.' : '#')).join('');

describe('moveIcon', () => {
  it('refuse un coup inconnu', () => {
    expect(moveIcon('Q')).toBeNull();
    expect(moveIcon('R3')).toBeNull();
  });

  it('dessine tous les coups du set, simples et prime', () => {
    for (const name of MOVE_ICON_TOKENS) {
      expect(moveIcon(name), name).not.toBeNull();
      expect(moveIcon(`${name}'`), `${name}'`).not.toBeNull();
    }
  });

  it('R allume la colonne de droite et la monte sur F', () => {
    const { faces, arrows } = moveIcon('R');
    expect(lit(faces.F)).toBe('..#..#..#');
    expect(lit(faces.U)).toBe('..#..#..#');
    expect(lit(faces.R)).toBe('#########');
    expect(arrows.F).toEqual([
      { kind: 'line', from: [2.5, 2.7], to: [2.5, 0.3], double: false },
    ]);
    expect(arrows.R).toEqual([{ kind: 'turn', clockwise: true, double: false }]);
  });

  it("R' inverse les flèches", () => {
    const { arrows } = moveIcon("R'");
    expect(arrows.F[0].to).toEqual([2.5, 2.7]);
    expect(arrows.R[0].clockwise).toBe(false);
  });

  it('U pousse la ligne du haut de F vers la gauche', () => {
    const { arrows } = moveIcon('U');
    expect(arrows.F[0].to[0]).toBeLessThan(arrows.F[0].from[0]);
    expect(arrows.U[0]).toMatchObject({ kind: 'turn', clockwise: true });
  });

  it('D, caché, se lit sur la ligne du bas de F et de R', () => {
    const { faces, arrows } = moveIcon('D');
    expect(lit(faces.U)).toBe('.........');
    expect(lit(faces.F)).toBe('......###');
    expect(arrows.U).toEqual([]);
    expect(arrows.F[0].to[0]).toBeGreaterThan(arrows.F[0].from[0]);
  });

  it('M suit L : la colonne du milieu descend sur F', () => {
    const l = moveIcon('L').arrows.F[0];
    const m = moveIcon('M').arrows.F[0];
    expect(Math.sign(m.to[1] - m.from[1])).toBe(Math.sign(l.to[1] - l.from[1]));
    expect(lit(moveIcon('M').faces.F)).toBe('.#..#..#.');
  });

  it('r bouge deux tranches, m les deux du bord', () => {
    expect(lit(moveIcon('r').faces.F)).toBe('.##.##.##');
    expect(lit(moveIcon('m').faces.F)).toBe('#.##.##.#');
    expect(moveIcon('m').arrows.F).toHaveLength(2);
  });

  it('x tourne tout le cube avec une seule flèche par face', () => {
    const { faces, arrows } = moveIcon('x');
    expect(lit(faces.F)).toBe('#########');
    expect(arrows.F).toHaveLength(1);
    expect(arrows.R[0].kind).toBe('turn');
  });

  it('U2 marque le demi-tour', () => {
    expect(moveIcon('U2').arrows.U[0].double).toBe(true);
  });
});
