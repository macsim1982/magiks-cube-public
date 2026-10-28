import { describe, expect, it } from 'vitest';
import { LESSONS } from './index';
import { caseMark, chapterKind } from './marks';

describe('chapterKind', () => {
  it.each([
    ['La notation', 'notation'],
    ['La croix blanche', 'cross'],
    ['Les coins blancs', 'corners'],
    ['Le Belge : la deuxième ligne', 'belge'],
    ['La croix jaune', 'yellow'],
    ['Placer les coins : le petit curieux', 'corners'],
    ['Redresser les coins : la chaise rebondissante', 'twist'],
    ['Bonus : tourner les centres', 'centers'],
    ['Première face, sauf un coin', 'cross'],
    ['Deuxième étage, sauf une arête', 'belge'],
    ['Orienter les coins (jaune en haut)', 'twist'],
    ['Placer les arêtes', 'edges'],
    ['Recherche en cours', 'wait'],
    ['En 20 coups', 'short'],
    ['Un titre sans mot connu', 'step'],
  ])('%s → %s', (title, kind) => {
    expect(chapterKind(title)).toBe(kind);
  });

  // ecrire-une-lecon.md : un mot connu dans chaque titre d’étape
  it('draws every lesson step', () => {
    const titles = LESSONS.flatMap((lesson) => lesson.steps.map((step) => step.title));
    expect(titles.filter((title) => chapterKind(title) === 'step')).toEqual([]);
  });
});

describe('caseMark', () => {
  it.each([
    ['colors', { label: 'Arête blanche et rouge', alg: "R U R'" }, { kind: 'colors', colors: ['blanc', 'rouge'] }],
    ['a known word', { label: 'Chaise rebondissante', alg: "R U2 R'" }, { kind: 'icon', name: 'twist' }],
    ['a cube', { label: 'Le petit curieux', alg: "L' U R" }, { kind: 'cube', picto: 'corners' }],
    ['one move', { label: 'Tourner tout le cube', alg: 'x' }, { kind: 'move', move: 'x' }],
    ['the first move', { label: 'Arête en bas', alg: "D' M D M'" }, { kind: 'glyph', text: "D'" }],
    ['the step kind', { label: 'Bonus : les centres', alg: '' }, { kind: 'chapter', chapter: 'centers' }],
  ])('%s', (_, item, mark) => {
    expect(caseMark(item)).toEqual(mark);
  });
});
