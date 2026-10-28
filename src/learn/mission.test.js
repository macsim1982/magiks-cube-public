import { describe, expect, it } from 'vitest';
import { caseMission, firstSentence, stepTip } from './mission';

const step = {
  goal: 'Fais une croix blanche sur le dessus.',
  text: ['Une arête, c’est une pièce à 2 couleurs. Il y en a 4 avec du blanc.', 'Les centres ne bougent jamais.'],
};

describe('firstSentence', () => {
  it('keeps the first sentence only', () => {
    expect(firstSentence('Une arête, c’est une pièce à 2 couleurs. Il y en a 4.')).toBe('Une arête, c’est une pièce à 2 couleurs.');
    expect(firstSentence('Il doit aller à droite ? Il part à gauche !')).toBe('Il doit aller à droite ?');
  });

  it('is empty without text', () => {
    expect(firstSentence(undefined)).toBe('');
  });
});

describe('caseMission', () => {
  it('prefers the case mission, else the step goal', () => {
    expect(caseMission(step, { mission: 'Monte l’arête blanche.' })).toBe('Monte l’arête blanche.');
    expect(caseMission(step, { label: 'Arête en bas' })).toBe(step.goal);
    expect(caseMission(step, undefined)).toBe(step.goal);
  });
});

describe('stepTip', () => {
  it('prefers the written tip, else the first sentence of the explanation', () => {
    expect(stepTip({ ...step, tip: 'Les centres ne bougent jamais.' })).toBe('Les centres ne bougent jamais.');
    expect(stepTip(step)).toBe('Une arête, c’est une pièce à 2 couleurs.');
    expect(stepTip({ goal: 'x' })).toBe('');
  });
});
