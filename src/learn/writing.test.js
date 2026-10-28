import { describe, expect, it } from 'vitest';
import { cube3 } from '../puzzles/cube/createCube';
import { LESSONS } from './index';
import { EMPTY_GUIDE, guideLesson } from './guide';
import { EMPTY_SEARCH, failedLesson, searchingLesson, searchLesson } from './search';

// Règles d’écriture pour 10–12 ans : docs/workflow/ecrire-une-lecon.md
// mission : la phrase d’un cas, 8 mots au plus ; tip : l’astuce d’une étape, une phrase
const LIMITS = { title: 48, goal: 64, label: 40, words: 16, paragraphs: 5, mission: 8 };

const sentences = (text) => text.split(/(?<=[.!?…])\s+/).filter(Boolean);
const words = (sentence) => sentence.split(/\s+/).filter(Boolean).length;

function check(lesson, { paragraphs = true } = {}) {
  for (const step of lesson.steps) {
    const where = `${lesson.id} › ${step.title}`;
    expect(step.title.length, where).toBeLessThanOrEqual(LIMITS.title);
    expect(step.goal.length, `${where} (objectif)`).toBeLessThanOrEqual(LIMITS.goal);
    if (paragraphs) expect(step.text.length, `${where} (paragraphes)`).toBeLessThanOrEqual(LIMITS.paragraphs);
    if (step.tip) expect(sentences(step.tip), `${where} (astuce)`).toHaveLength(1);
    for (const sentence of [step.goal, step.tip ?? '', ...step.text].flatMap(sentences)) {
      expect(words(sentence), sentence).toBeLessThanOrEqual(LIMITS.words);
    }
    for (const alg of step.algs) {
      expect(alg.label.length, `${where} › ${alg.label}`).toBeLessThanOrEqual(LIMITS.label);
      if (alg.mission) expect(words(alg.mission), `${where} › ${alg.label} (mission)`).toBeLessThanOrEqual(LIMITS.mission);
    }
  }
}

describe('écriture des leçons', () => {
  it.each(LESSONS.map((lesson) => [lesson.id, lesson]))('%s reste court et lisible', (_id, lesson) => {
    check(lesson);
  });

  it('les écrans d’attente et de recherche aussi', () => {
    for (const lesson of [EMPTY_GUIDE, EMPTY_SEARCH, searchingLesson(['R']), failedLesson(['R']), searchLesson(['R'], ["R'"])]) {
      check(lesson);
    }
  });

  // Le guide ajoute une phrase par pièce : on ne limite pas le nombre de paragraphes.
  // Dix résolutions par le solveur débutant (≈ 2,6 s) : le délai des autres tests du solveur
  it('le guide d’un mélange aussi', () => {
    for (let i = 0; i < 10; i += 1) check(guideLesson(cube3.scramble(20)), { paragraphs: false });
  }, 30000);
});
