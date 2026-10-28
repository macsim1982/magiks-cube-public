// @ts-check
import {
  SHOW_F2L,
  SHOW_F2L_EDGES,
  SHOW_TWIST,
  SHOW_WHITE_FACE,
  SHOW_YELLOW_CORNERS,
  SHOW_YELLOW_CROSS,
  SHOW_YELLOW_EDGES,
  YU,
  poseYU as pose,
} from './helpers';

// Méthode moyenne Deadalnix : blanc en bas, jaune en haut (z2 depuis la pose résolue).
// https://www.francocube.com/deadalnix/moyen
export const MOYEN = {
  id: 'moyen',
  title: 'Pour aller plus vite',
  fullTitle: 'La méthode moyenne, pour aller plus vite',
  source: {
    label: 'Deadalnix — Francocube',
    href: 'https://www.francocube.com/deadalnix/moyen',
  },
  steps: [
    {
      title: 'La notation, en plus',
      pose: YU,
      goal: 'Les lettres, et aussi x, y, z, M, E et S.',
      text: [
        'Les lettres suivent ce que tu vois. F, c’est toujours la face devant toi.',
        "Une lettre : un quart de tour, comme une montre. Avec ' : l’autre sens. Avec 2 : un demi-tour.",
        'x, y et z tournent tout le cube. M, E et S tournent une tranche du milieu.',
        'Au clavier : une lettre joue le coup. Espace + lettre : l’autre sens. Retour arrière : annuler.',
      ],
      algs: [
        { label: 'Droite', alg: 'R' },
        { label: 'Droite, à l’envers', alg: "R'" },
        { label: 'Dessus, demi-tour', alg: 'U2' },
        { label: 'Tout le cube', alg: 'y' },
      ],
    },
    {
      title: 'Première face, sauf un coin',
      goal: 'Croix blanche en bas, puis 3 coins. On garde un trou.',
      pose: pose("R U' R'"),
      show: SHOW_WHITE_FACE,
      text: [
        'Cette fois, le blanc est en bas et le jaune en haut. Tu ne retourneras plus le cube.',
        'Fais la croix directement en bas. C’est bizarre au début, mais pas plus dur.',
        'Place ensuite 3 coins blancs. Laisse exprès le 4ᵉ vide : ce trou va servir.',
        'Le coin va à gauche ? Fais le miroir de la formule de droite.',
      ],
      algs: [
        { label: 'Coin à droite', alg: "R U' R'", setup: pose("R U' R'") },
        { label: 'Coin à gauche', alg: "F' U F", setup: pose("F' U F") },
        { label: 'Le petit aller-retour', alg: "R U R' U'", setup: pose("R U R' U'") },
      ],
    },
    {
      title: 'Deuxième étage, sauf une arête',
      goal: 'Place 3 arêtes du milieu en passant par le trou.',
      pose: pose("R U' R'"),
      show: SHOW_F2L_EDGES,
      text: [
        'Le coin qui manque est un tunnel. Une arête passe par là sans rien casser.',
        'Mets le trou devant, à droite. Amène l’arête en haut.',
        'Elle va à droite ? Première formule. Elle va devant ? La deuxième.',
        'Pas besoin de l’apprendre par cœur : regarde où l’arête doit aller.',
        'Une arête coincée au milieu ? Mets-en une autre à sa place pour la faire sortir.',
      ],
      algs: [
        { label: 'Par le trou, à droite', alg: "R U' R'", setup: pose("R U' R'") },
        { label: 'Par le trou, devant', alg: "F' U F", setup: pose("F' U F") },
        { label: 'Face suivante', alg: 'y' },
      ],
    },
    {
      title: 'Finir les deux premiers étages',
      goal: 'Le dernier coin, puis la dernière arête.',
      pose: pose("R U R' U'"),
      show: SHOW_F2L,
      text: [
        'Il reste le coin du trou, et l’arête qui va avec.',
        'Le coin est en haut, au-dessus de sa place ? Répète le petit aller-retour jusqu’à ce qu’il soit bien.',
        'Ensuite, l’arête. Fais un T avec le centre de devant, puis glisse-la à droite ou à gauche.',
        'Elle est à sa place, mais retournée ? Une formule la sort et la remet.',
      ],
      algs: [
        { label: 'Dernier coin', alg: "R U R' U'", setup: pose("R U R' U'") },
        { label: 'Dernière arête, à droite', alg: "U R U' R' U' F' U F", setup: pose("U R U' R' U' F' U F") },
        { label: 'Dernière arête, à gauche', alg: "U' L' U L U F U' F'", setup: pose("U' L' U L U F U' F'") },
        { label: 'Retourner une arête', alg: "R U R' U' F' U' F", setup: pose("R U R' U' F' U' F") },
      ],
    },
    {
      title: 'Croix jaune',
      goal: 'Le jaune des 4 arêtes monte sur le dessus.',
      pose: pose("F R U R' U' F'"),
      show: SHOW_YELLOW_CROSS,
      text: [
        'Regarde le dessus. Tourne-le pour te placer, sans tourner tout le cube.',
        'Seul le centre est jaune ? Fais la formule du point.',
        'Tu vois un L jaune ? Mets-le en haut à gauche, puis fais sa formule.',
        'Tu vois une ligne ? Mets-la à l’horizontale. La croix apparaît !',
      ],
      algs: [
        { label: 'Un point', alg: "F R U R' U' F' F U R U' R' F'", setup: pose("F U R U' R' F'", "F R U R' U' F'") },
        { label: 'Un L', alg: "F U R U' R' F'", setup: pose("F U R U' R' F'") },
        { label: 'Une ligne', alg: "F R U R' U' F'", setup: pose("F R U R' U' F'") },
      ],
    },
    {
      title: 'Orienter les coins (jaune en haut)',
      goal: 'Le jaune des 4 coins monte. Ils peuvent être mal placés.',
      pose: pose("R U R' U R U2 R'"),
      show: SHOW_TWIST,
      text: [
        'On ne s’occupe que du jaune vers le haut. Les arêtes peuvent bouger : pas grave.',
        'Le Sune suffit pour tout finir : répète-le. C’est comme la chaise, en plus court.',
        'Les autres formules vont plus vite. Apprends-les plus tard, une à la fois.',
      ],
      algs: [
        { label: 'Sune (1 coin jaune)', alg: "R U R' U R U2 R'", setup: pose("R U R' U R U2 R'") },
        { label: 'Anti-Sune', alg: "R U2 R' U' R U' R'", setup: pose("R U2 R' U' R U' R'") },
        { label: 'Cas T', alg: "R U R' U' R' F R F'", setup: pose("R U R' U' R' F R F'") },
        { label: 'Cas U', alg: "R2 D R' U2 R D' R' U2 R'", setup: pose("R2 D R' U2 R D' R' U2 R'") },
        { label: 'Cas L', alg: "F R' F' R U R U' R'", setup: pose("F R' F' R U R U' R'") },
        { label: 'Cas Pi', alg: "R U2 R2 U' R2 U' R2 U2 R", setup: pose("R U2 R2 U' R2 U' R2 U2 R") },
        { label: 'Cas H', alg: "R U R' U R U' R' U R U2 R'", setup: pose("R U R' U R U' R' U R U2 R'") },
      ],
    },
    {
      title: 'Placer les coins',
      goal: 'Chaque coin jaune va à sa place.',
      pose: pose("R U' L' U R' U' L"),
      show: SHOW_YELLOW_CORNERS,
      text: [
        'Souvent, deux coins sont déjà bien placés. Les deux autres s’échangent avec une formule.',
        'Le dessus peut tourner pendant la formule. Remets-le en place à la fin.',
        'Place-toi en tournant le dessus, sans tourner tout le cube.',
      ],
      algs: [
        { label: 'Trois coins tournent', alg: "R U' L' U R' U' L", setup: pose("R U' L' U R' U' L") },
        { label: 'Deux coins voisins', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", setup: pose("R U R' U' R' F R2 U' R' U' R U R' F'") },
        { label: 'Deux coins en diagonale', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", setup: pose("F R U' R' U' R U R' F' R U R' U' R' F R F'") },
      ],
    },
    {
      title: 'Placer les arêtes',
      goal: 'Les arêtes jaunes vont à leur place. Le cube est fini !',
      pose: pose("R U' R U R U R U' R' U' R2"),
      show: SHOW_YELLOW_EDGES,
      text: [
        'Reconnais le cas, puis fais sa formule.',
        'Ua suffit pour tout finir : répète-la, en tournant le dessus si besoin.',
        'Apprends-la en premier. Ub, Z et H viendront après.',
      ],
      algs: [
        { label: 'Ua (à apprendre d’abord)', alg: "R U' R U R U R U' R' U' R2", setup: pose("R U' R U R U R U' R' U' R2") },
        { label: 'Ub', alg: "R2 U R U R' U' R' U' R' U R'", setup: pose("R2 U R U R' U' R' U' R' U R'") },
        { label: 'Z (2 paires voisines)', alg: "M2 U M2 U M' U2 M2 U2 M'", setup: pose("M2 U M2 U M' U2 M2 U2 M'") },
        { label: 'H (2 paires en face)', alg: "M2 U M2 U2 M2 U M2", setup: pose("M2 U M2 U2 M2 U M2") },
      ],
    },
  ],
};
