// @ts-check
import {
  SHOW_BELGE,
  SHOW_CENTERS,
  SHOW_TWIST,
  SHOW_WHITE_CROSS,
  SHOW_WHITE_FACE,
  SHOW_YELLOW_CROSS,
  WHITE,
  pieceWith,
  pose,
  poseYU,
} from './helpers';

// Méthode pour débuter — séquences de la page Francocube / Cyril.
// https://www.francocube.com/cyril/rubiks-cube
export const DEBUTANT = {
  id: 'debutant',
  title: 'Pour débuter',
  fullTitle: 'La méthode pour débuter',
  source: {
    label: 'Francocube — méthode pour débuter',
    href: 'https://www.francocube.com/cyril/rubiks-cube',
  },
  steps: [
    {
      title: 'La notation',
      goal: 'Chaque lettre signifie : Tourner une face.',
      text: [
        'R = la face de droite. L = la gauche. U = le dessus. D = le dessous.',
        'F = la face devant toi. B = celle de derrière.',
        'Une lettre seule : un quart de tour, comme les aiguilles d’une montre.',
        "Avec ' (prime), tu tournes dans l’autre sens. Avec 2, tu fais un demi-tour.",
        'Choisis un cas, puis appuie sur Regarde.',
      ],
      algs: [
        { label: 'Tourner la face de droite', alg: "R R' R2" },
        { label: 'Tourner la face de gauche', alg: "L L' L2" },
        { label: 'Tourner la face de dessus', alg: "U U' U2" },
        { label: 'Tourner la face de dessous', alg: "D D' D2" },
        { label: 'Tourner la face de devant', alg: "F F' F2" },
        { label: 'Tourner la face de derrière', alg: "B B' B2" },
        { label: 'Faire tourner le cube entier', alg: 'x y z x2 y2 z2' },
      ],
    },
    {
      title: 'La croix blanche',
      goal: 'Fais une croix blanche sur le dessus.',
      show: SHOW_WHITE_CROSS,
      text: [
        'Une arête, c’est une pièce à 2 couleurs. Il y en a 4 avec du blanc.',
        'Les centres ne bougent jamais. Le centre blanc reste en haut.',
        'Chaque arête blanche a une autre couleur. Elle doit toucher le centre de cette couleur.',
        'Attention à ne pas casser une arête déjà bien placée.',
      ],
      algs: [
        { label: 'Arête en bas', alg: "D' M D M'", setup: pose("D' M D M'") },
        { label: 'Arête en bas, en face', alg: "M D2 M'", setup: pose("M D2 M'") },
        // Le U' de la fin range toute la croix : on ne suit que l’arête du côté
        { label: 'Arête sur le côté', alg: "U' B' E' B", setup: pose("U' B' E' B"), focus: [pieceWith(WHITE, 'back')] },
      ],
    },
    {
      title: 'Les coins blancs',
      goal: 'Toute la face blanche est finie.',
      show: SHOW_WHITE_FACE,
      pose: pose("F D F'"),
      text: [
        'Un coin, c’est une pièce à 3 couleurs. Il n’a qu’une seule bonne place.',
        'Mets le coin en bas, juste sous sa place.',
        'Les pièces du dessus descendent le chercher. Il se glisse. Tout le monde remonte.',
        'Regarde les côtés : chacun doit montrer un petit T d’une seule couleur.',
        'Un coin coincé au mauvais endroit ? Mets un autre coin à sa place pour le faire sortir.',
      ],
      algs: [
        { label: 'Coin en bas', alg: "F D F'", setup: pose("F D F'") },
        { label: 'Coin, blanc dessous', alg: "F D' F' R' D2 R", setup: pose("F D' F' R' D2 R") },
      ],
    },
    {
      title: 'Le Belge : la deuxième ligne',
      goal: 'Les 4 arêtes du milieu sont à leur place.',
      show: SHOW_BELGE,
      pose: pose("D' R' D R D F D' F'"),
      text: [
        'Le blanc reste en haut. Tu ne retournes pas encore le cube.',
        'Le Belge, c’est une arête du bas, sans blanc ni jaune.',
        'Il doit aller à droite ? Il part d’abord à gauche ! Ses copains de droite descendent le rappeler.',
        'Il revient, et tout le monde rentre à la maison. Vers la gauche, c’est pareil en miroir.',
        'Une arête est coincée à l’envers ? Fais-la sortir avec un Belge, puis recommence.',
      ],
      algs: [
        {
          label: 'Belge à droite',
          alg: "D' R' D R D F D' F'",
          setup: pose("D' R' D R D F D' F'"),
        },
        {
          label: 'Belge à gauche',
          alg: "D L D' L' D' F' D F",
          setup: pose("D L D' L' D' F' D F"),
        },
      ],
    },
    {
      title: 'La croix jaune',
      goal: 'Fais une croix jaune, avec chaque arête à sa place.',
      show: SHOW_YELLOW_CROSS,
      pose: poseYU("F R U R' U' F'"),
      text: [
        'Retourne le cube : le blanc va en bas. Tu n’y touches plus.',
        'D’abord, fais monter le jaune des 4 arêtes. Choisis la formule selon ce que tu vois : une ligne ou un L.',
        'Ensuite, l’histoire de la chaise met les arêtes à leur place.',
        'Garde devant toi une arête déjà juste.',
      ],
      algs: [
        { label: 'Retourne le cube', alg: 'z2', setup: '', show: SHOW_YELLOW_CROSS },
        {
          label: 'Une ligne jaune',
          alg: "F R U R' U' F'",
          show: SHOW_YELLOW_CROSS,
          setup: poseYU("F R U R' U' F'"),
        },
        {
          label: 'Un L jaune',
          alg: "F U R U' R' F'",
          show: SHOW_YELLOW_CROSS,
          setup: poseYU("F U R U' R' F'"),
        },
        {
          label: 'Histoire de la chaise',
          alg: "R U2 R' U' R U' R'",
          show: SHOW_YELLOW_CROSS,
          setup: poseYU("R U2 R' U' R U' R'"),
        },
      ],
    },
    {
      title: 'Placer les coins : le petit curieux',
      goal: 'Chaque coin va à sa place, même s’il est tordu.',
      show: SHOW_TWIST,
      pose: poseYU("L' U R U' L U R' U'"),
      text: [
        'Un coin est à sa place si ses 3 couleurs touchent les 3 bons centres.',
        'Il peut encore être tordu. On le redressera juste après.',
        'Mets un coin bien placé devant, à droite : c’est le petit curieux.',
        'Il va voir ses copains à gauche, puis à droite. Les 3 autres coins tournent.',
        'Aucun coin à sa place ? Fais la formule une fois, puis recommence.',
      ],
      algs: [
        {
          label: 'Le petit curieux',
          alg: "L' U R U' L U R' U'",
          setup: poseYU("L' U R U' L U R' U'"),
        },
      ],
    },
    {
      title: 'Redresser les coins : la chaise rebondissante',
      goal: 'Tout le jaune est en haut. Le cube est fini !',
      show: SHOW_TWIST,
      pose: poseYU("R U2 R' U' R U' R' L' U2 L U L' U L"),
      text: [
        'Il reste des coins tordus. On les redresse sans rien casser.',
        'C’est la chaise, main droite, puis main gauche : la chaise rebondissante.',
        'Elle redresse les deux coins de droite. Ceux de gauche ne bougent pas.',
        'Pas encore fini ? Tourne le cube, puis recommence. Deux fois suffisent.',
      ],
      algs: [
        {
          label: 'Chaise, main droite',
          alg: "R U2 R' U' R U' R'",
          setup: poseYU("R U2 R' U' R U' R'"),
        },
        {
          label: 'Chaise, main gauche',
          alg: "L' U2 L U L' U L",
          setup: poseYU("L' U2 L U L' U L"),
        },
        {
          label: 'Chaise rebondissante',
          alg: "R U2 R' U' R U' R' L' U2 L U L' U L",
          setup: poseYU("R U2 R' U' R U' R' L' U2 L U L' U L"),
        },
      ],
    },
    {
      title: 'Bonus : tourner les centres',
      goal: 'Seulement si ton cube a des images sur les centres.',
      show: SHOW_CENTERS,
      pose: poseYU("U R L U2 R' L' U R L U2 R' L'"),
      text: [
        'Pas d’images sur ton cube ? Bravo, tu as déjà fini !',
        'Sinon, ces formules tournent les centres sans casser le reste.',
        'La première fait faire un demi-tour au centre du dessus.',
        'Les deux autres tournent deux centres d’un quart de tour.',
      ],
      algs: [
        {
          label: 'Centre, demi-tour',
          alg: "U R L U2 R' L' U R L U2 R' L'",
          setup: poseYU("U R L U2 R' L' U R L U2 R' L'"),
        },
        {
          label: 'Deux centres, quart de tour',
          alg: "L' R B F' U' D L U D' F B' R' L U'",
          setup: poseYU("L' R B F' U' D L U D' F B' R' L U'"),
        },
        {
          label: 'Autre quart de tour',
          alg: "M R' M U' M R U M R' M U M R U'",
          setup: poseYU("M R' M U' M R U M R' M U M R U'"),
        },
      ],
    },
  ],
};
