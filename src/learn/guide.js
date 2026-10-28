// @ts-check
import { DEBUTANT } from './debutant';
import {
  SHOW_BELGE,
  SHOW_WHITE_CROSS,
  SHOW_WHITE_FACE,
  SHOW_TWIST,
  SHOW_YELLOW_CORNERS,
  SHOW_YELLOW_CROSS,
  SHOW_YELLOW_EDGES,
} from './helpers';
import { pieceName, solveBeginner } from '../puzzles/cube/beginnerSolver';
import { compactAlg } from '../puzzles/cube/notation';

const FR = {
  top: 'blanc',
  bottom: 'jaune',
  front: 'vert',
  right: 'rouge',
  back: 'bleu',
  left: 'orange',
};

const WHERE = {
  U: 'en haut',
  D: 'en bas',
  F: 'devant',
  B: 'derrière',
  R: 'à droite',
  L: 'à gauche',
};

function called(piece) {
  return pieceName(piece).map((color) => FR[color]).join('-');
}

const CONTINUE = 'On continue.';
const SENSE = ' Ici, à l’envers.';

/**
 * La phrase d’une formule répétée : deux fois, aucune pièce encore juste
 * (`none`, avec le sens), à l’envers (`back`), sinon la phrase simple.
 * @param {{ times?: number, before?: number, back?: boolean }} decision
 * @param {{ twice: string, none?: string, back: string, plain: string }} texts
 */
function formulaSentence(decision, { twice, none, back, plain }) {
  if (decision.times === 2) return twice;
  if (none && decision.before === 0) return none + (decision.back ? SENSE : '');
  return decision.back ? back : plain;
}

const YELLOW_SENTENCES = {
  point: 'Seul le centre est jaune. Cette formule fait monter du jaune.',
  L: 'Deux arêtes jaunes forment un L. Place-le, puis fais la formule.',
  line: 'Deux arêtes jaunes forment une ligne. Mets-la devant-derrière, puis fais la formule.',
};

/** Une phrase par genre de décision du solveur, pour un enfant (docs/workflow/ecrire-une-lecon.md) */
const SENTENCES = {
  'cross-down': ({ piece, shot }) => `L’arête ${called(piece)} est en bas, blanc dessous, le ${FR[shot.side]} ${WHERE[shot.sideDir]}. Glisse-la sous sa place, puis un demi-tour la remonte.`,
  'cross-flip': ({ piece }) => `L’arête ${called(piece)} est en bas, blanc sur le côté. On la retourne, puis on la remonte.`,
  'cross-move': ({ piece, shot }) => `L’arête ${called(piece)} est ${shot.layer === 'U' ? 'en haut, mais au mauvais endroit' : 'sur le côté'}. On la descend, puis on la remonte à la bonne place.`,
  'corner-twist': ({ piece }) => `Le coin ${called(piece)} est à sa place, mais tordu. La formule le redresse.`,
  'corner-drop': ({ piece }) => `Le coin ${called(piece)} est en haut, au mauvais endroit. On le descend, puis on le remonte à sa place.`,
  'corner-down': ({ piece }) => `Le coin ${called(piece)} est en bas, blanc dessous. On le met sous sa place, puis la formule le remonte.`,
  'corner-insert': ({ piece }) => `Le coin ${called(piece)} est en bas. On le met sous sa place. Les pièces du dessus descendent le chercher.`,
  belge: ({ piece, side, onBottom }) => (onBottom === false
    ? `L’arête ${called(piece)} est déjà au milieu. Un seul Belge la remet bien. ${side === 'right' ? 'Elle part d’abord à gauche.' : 'C’est le miroir.'}`
    : `L’arête ${called(piece)} est en bas, sans blanc ni jaune. ${side === 'right' ? 'Elle doit aller à droite : elle part d’abord à gauche.' : 'Elle doit aller à gauche : c’est le miroir.'}`),
  'belge-out': ({ piece }) => `L’arête ${called(piece)} est coincée au milieu. Un Belge la fait sortir, un autre la remet.`,
  flip: () => 'Retourne le cube : le blanc va en bas. Tu n’y touches plus.',
  'yellow-orient': ({ pattern }) => YELLOW_SENTENCES[pattern] ?? CONTINUE,
  'yellow-edges': (decision) => formulaSentence(decision, {
    twice: 'Deux paires d’arêtes sont à échanger. Une chaise, on tourne le cube, une autre chaise.',
    none: 'Aucune arête jaune ne touche son centre. Tourne le dessus, puis fais la chaise.',
    back: 'Une arête jaune est déjà juste : garde-la devant. Les autres tournent dans l’autre sens : la chaise à l’envers.',
    plain: 'Une arête jaune est déjà juste : garde-la devant. La chaise place les trois autres.',
  }),
  'corners-perm': (decision) => formulaSentence(decision, {
    twice: 'Une fois ne suffit pas. Tourne le cube, et le petit curieux recommence.',
    none: 'Aucun coin n’est à sa place. Un petit curieux en place un. Mets-le devant à droite, puis recommence.',
    back: 'Un coin est déjà à sa place : mets-le devant à droite. Les autres tournent dans l’autre sens : le petit curieux à l’envers.',
    plain: 'Un coin est déjà à sa place : mets-le devant à droite. Le petit curieux place les trois autres.',
  }),
  'corners-orient': (decision) => formulaSentence(decision, {
    twice: 'Les coins tordus ne sont pas côte à côte. Redresse une paire, tourne le cube, puis l’autre.',
    back: 'On redresse les coins. Ici, ils tournent dans l’autre sens : la chaise rebondissante à l’envers.',
    plain: 'On redresse les coins avec la chaise rebondissante.',
  }),
};
SENTENCES['corner-drop-down'] = SENTENCES['corner-drop'];

function sentence(decision) {
  const { kind, piece } = decision;
  if (piece && kind === 'done') {
    const word = piece.kind === 'corner' ? 'Le coin' : 'L’arête';
    return `${word} ${called(piece)} est déjà à sa place. Rien à faire !`;
  }
  return SENTENCES[kind]?.(decision) ?? CONTINUE;
}

const YELLOW_LABELS = { point: 'Point jaune', L: 'Un L jaune', line: 'Une ligne jaune' };
const FORMULA_NAMES = {
  'yellow-edges': 'La chaise',
  'corners-perm': 'Le petit curieux',
  'corners-orient': 'La chaise rebondissante',
};

function labelOf(decision, index) {
  const { kind } = decision;
  if (kind === 'flip') return 'Retourne le cube';
  if (kind === 'yellow-orient' && YELLOW_LABELS[decision.pattern]) return YELLOW_LABELS[decision.pattern];
  if (FORMULA_NAMES[kind]) {
    return FORMULA_NAMES[kind] + (decision.back ? ', à l’envers' : '') + (decision.times === 2 ? ', deux fois' : '');
  }
  if (!decision.piece) return `Formule ${index + 1}`;
  const word = decision.piece.kind === 'corner' ? 'Coin' : 'Arête';
  return `${word} ${called(decision.piece)}`;
}

// Les pièces à suivre de certaines formules, plutôt que celles de l’étape
const SHOWS = {
  'yellow-orient': SHOW_YELLOW_CROSS,
  'yellow-edges': SHOW_YELLOW_EDGES,
  'corners-orient': SHOW_TWIST,
};

const CHAPTERS = {
  cross: {
    title: 'La croix blanche',
    goal: 'Fais une croix blanche sur le dessus.',
    show: SHOW_WHITE_CROSS,
    intro: [
      'Une arête, c’est une pièce à 2 couleurs. Les centres ne bougent jamais.',
      'Chaque arête blanche doit toucher le centre de son autre couleur.',
    ],
  },
  corners: {
    title: 'Les coins blancs',
    goal: 'Toute la face blanche est finie.',
    show: SHOW_WHITE_FACE,
    intro: [
      'Un coin, c’est une pièce à 3 couleurs. Il n’a qu’une seule bonne place.',
      'Mets-le en bas, sous sa place. Les pièces du dessus descendent le chercher.',
    ],
  },
  belge: {
    title: 'Le Belge',
    goal: 'Les 4 arêtes du milieu sont à leur place.',
    show: SHOW_BELGE,
    intro: [
      'Le blanc reste en haut. Le Belge, c’est une arête du bas sans blanc ni jaune.',
      'Elle doit aller à droite ? Elle part d’abord à gauche. Vers la gauche, c’est le miroir.',
    ],
  },
  yellow: {
    title: 'La croix jaune',
    goal: 'Fais une croix jaune, avec chaque arête à sa place.',
    show: SHOW_YELLOW_CROSS,
    intro: [
      'Le blanc est en bas. Tu n’y touches plus.',
      'D’abord, fais monter le jaune des arêtes. Ensuite, la chaise les met à leur place.',
    ],
  },
  finish: {
    title: 'Les coins, jusqu’au bout',
    goal: 'Chaque coin à sa place, puis le jaune en haut. Fini !',
    show: SHOW_YELLOW_CORNERS,
    intro: [
      'Un coin est à sa place si ses 3 couleurs touchent les 3 bons centres. Il peut être tordu.',
      'Le petit curieux place les coins. La chaise rebondissante les redresse.',
    ],
  },
};

function stepOf(phase, prefix) {
  const chapter = CHAPTERS[phase.id];
  const show = chapter.show;
  let cursor = prefix;
  const algs = [];
  const labels = new Set();
  for (const decision of phase.decisions) {
    const tokens = compactAlg(decision.tokens);
    if (!tokens.length) continue;
    const setup = cursor.join(' ');
    let label = labelOf(decision, algs.length);
    if (labels.has(label)) label = `${label} (${algs.length + 1})`;
    labels.add(label);
    algs.push({
      label,
      alg: tokens.join(' '),
      setup,
      show: SHOWS[decision.kind] ?? show,
    });
    cursor = [...cursor, ...tokens];
  }
  const pose = prefix.join(' ');
  return {
    step: {
      title: chapter.title,
      goal: chapter.goal,
      show,
      pose,
      text: [...chapter.intro, ...phase.decisions.map(sentence)],
      algs,
    },
    prefix: cursor,
  };
}

export function guideLesson(tokens) {
  const { phases } = solveBeginner(tokens);
  let prefix = [...tokens];
  const steps = [];
  for (const phase of phases) {
    const built = stepOf(phase, prefix);
    steps.push(built.step);
    prefix = built.prefix;
  }
  return {
    id: 'guide',
    title: 'Sur ce mélange',
    fullTitle: 'Sur ce mélange',
    source: DEBUTANT.source,
    steps,
  };
}

export const EMPTY_GUIDE = {
  id: 'guide',
  title: 'Sur ce mélange',
  fullTitle: 'Sur ce mélange',
  source: DEBUTANT.source,
  steps: [
    {
      title: 'En attente du mélange',
      goal: 'Mélange le cube : ce guide te montrera comment le résoudre.',
      text: [
        'Ferme la leçon avec la croix, puis appuie sur Mélanger.',
        'Reviens dans Apprendre : le guide explique ton mélange, étape par étape.',
      ],
      algs: [],
      pose: '',
    },
  ],
};
