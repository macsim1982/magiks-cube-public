import { describe, expect, it } from 'vitest';
import { caseKey, mark, stepKey } from './progress';
import { readResume, resumeDoor, writeResume } from './resume';

const lessons = [
  {
    id: 'debutant',
    title: 'Pour débuter',
    steps: [
      { title: 'La notation', algs: [{ label: 'Droite', alg: 'R' }, { label: 'Dessus', alg: 'U' }] },
      { title: 'La croix blanche', algs: [] },
      { title: 'Les coins blancs', algs: [{ label: 'Un coin', alg: "R U R'" }] },
    ],
  },
];

describe('readResume', () => {
  it('knows when Apprendre was never opened', () => {
    expect(readResume(null, lessons)).toBeNull();
    expect(readResume('pas du json', lessons)).toBeNull();
  });

  it('reads back the place, kept inside today’s lessons', () => {
    expect(readResume(writeResume({ lesson: 0, step: 2, alg: 0 }), lessons)).toEqual({ lesson: 0, step: 2, alg: 0 });
    // Une leçon raccourcie depuis : on reprend à la dernière étape qui existe
    expect(readResume('{"lesson":3,"step":9,"alg":5}', lessons)).toEqual({ lesson: 0, step: 2, alg: 0 });
  });
});

describe('resumeDoor', () => {
  it('starts at the first step before any visit', () => {
    expect(resumeDoor(null, lessons, new Set())).toEqual({
      started: false,
      label: 'Étape 1 sur 3',
      title: 'La notation',
      progress: 0,
    });
  });

  it('says where to go on and how much of the lesson is done', () => {
    const [notation, cross] = lessons[0].steps;
    let done = mark(new Set(), caseKey(lessons[0], notation, notation.algs[0]));
    done = mark(done, caseKey(lessons[0], notation, notation.algs[1]));
    done = mark(done, stepKey(lessons[0], cross));
    expect(resumeDoor({ lesson: 0, step: 2, alg: 0 }, lessons, done)).toEqual({
      started: true,
      label: 'Étape 3 sur 3',
      title: 'Les coins blancs',
      progress: 2 / 3,
    });
  });
});
