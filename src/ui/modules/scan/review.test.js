import { describe, expect, it } from 'vitest';
import { repaint, SOLVED, verdictText } from './review';

describe('verdictText', () => {
  const calm = { failed: false, solved: false, doubtful: false };

  it.each([
    [{ ok: true }, calm, 'Tout est bon !'],
    [{ ok: true }, { ...calm, doubtful: true }, 'Ça a l’air bon ! Vérifie les cases en pointillés.'],
    [{ ok: true }, { ...calm, solved: true }, 'Ton cube est déjà résolu. Bravo !'],
    [{ ok: false, fault: 'twist' }, calm, 'Un coin est tourné sur lui-même. Vérifie les coins… ou remets-le droit à la main.'],
    [{ ok: true }, { ...calm, failed: true }, 'Le calcul n’a pas marché. Réessaie.'],
  ])('%o, %o', (verdict, state, text) => {
    expect(verdictText(verdict, state)).toBe(text);
  });
});

describe('repaint', () => {
  it('changes one letter and trusts it', () => {
    const read = { facelets: SOLVED, doubt: Array(54).fill(0.6) };
    const next = repaint(read, 4, 'R');
    expect(next.facelets).toBe(`UUUURUUUU${SOLVED.slice(9)}`);
    expect(next.doubt[4]).toBe(0);
    expect(next.doubt[5]).toBe(0.6);
    expect(read.facelets).toBe(SOLVED);
  });
});
