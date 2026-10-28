// @ts-check
import { faceletsOf } from '../puzzles/cube/facelets';
import { applyTurns, cloneState } from '../puzzles/core/state';
import { cube3 } from '../puzzles/cube/createCube';

const SOURCE = {
  label: 'Herbert Kociemba — deux phases',
  href: 'http://kociemba.org/cube.htm',
};

function shell(steps) {
  return {
    id: 'search',
    title: 'Moins de coups',
    fullTitle: 'Moins de coups',
    source: SOURCE,
    steps,
  };
}

export const EMPTY_SEARCH = shell([
  {
    title: 'En attente du mélange',
    goal: 'La solution la plus courte, trouvée par l’ordinateur.',
    text: [
      'Ferme la leçon avec la croix, puis appuie sur Mélanger.',
      'L’ordinateur cherche alors une solution très courte : 22 coups au maximum.',
    ],
    algs: [],
    pose: '',
  },
]);

export function searchingLesson(tokens) {
  return shell([
    {
      title: 'La recherche',
      goal: 'L’ordinateur cherche une solution courte…',
      text: [
        'La première fois, il prépare ses tables. Ensuite, c’est très rapide.',
        'Pendant ce temps, tu peux suivre le guide « Sur ce mélange ».',
      ],
      algs: [],
      pose: tokens.join(' '),
    },
  ]);
}

export function failedLesson(tokens) {
  return shell([
    {
      title: 'Recherche interrompue',
      goal: 'L’ordinateur n’a pas trouvé, cette fois.',
      text: [
        'Ton mélange est toujours là, et le guide aussi.',
        'Tu peux mélanger de nouveau.',
      ],
      algs: [],
      pose: tokens.join(' '),
    },
  ]);
}

/** @param {string[]} tokens @param {string[]} solution */
export function searchLesson(tokens, solution) {
  const count = solution.length;
  const pose = tokens.join(' ');
  return shell([
    {
      title: count ? `${count} coups` : 'Déjà résolu',
      goal: 'Une solution très courte, trouvée par l’ordinateur.',
      text: [
        'Ce n’est pas la méthode pour débuter : l’ordinateur l’a trouvée tout seul.',
        'Il cherche en deux temps. Le savais-tu ? Vingt coups suffisent toujours pour finir un cube.',
        count
          ? `Ici, ${count} coups pour ton mélange.`
          : 'Le cube est déjà résolu.',
      ],
      algs: count ? [{
        label: `${count} coups`,
        alg: solution.join(' '),
        setup: pose,
      }] : [],
      pose,
    },
  ]);
}

export function faceletsFromTokens(tokens) {
  const state = applyTurns(
    cube3,
    cloneState(cube3.createState()),
    tokens.map((token) => cube3.toTurn(token)),
  );
  return faceletsOf(state);
}
