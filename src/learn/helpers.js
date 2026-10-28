// @ts-check
import { invertAlg } from '../puzzles/cube/notation';
import { cube3 } from '../puzzles/cube/createCube';

/** Pièces du 3×3 affiché — les ids doivent être ceux du puzzle, pas l’ancien repère {-1,0,1}. */
const PIECES = cube3.pieces;

export const YU = 'z2';
export const WHITE = 'top';
export const YELLOW = 'bottom';

const SIDES = ['right', 'left', 'front', 'back'];

const kind = (piece) => piece.kind;

const hasColor = (piece, color) => piece.faces.some((face) => face.color === color);
const ids = (pieces) => pieces.map((piece) => piece.id);

export const keep = (...groups) => groups.flat();

export const edgesWith = (color) =>
  ids(PIECES.filter((piece) => kind(piece) === 'edge' && hasColor(piece, color)));

export const cornersWith = (color) =>
  ids(PIECES.filter((piece) => kind(piece) === 'corner' && hasColor(piece, color)));

export const centers = (...colors) =>
  ids(PIECES.filter((piece) => kind(piece) === 'center' && colors.includes(piece.faces[0].color)));

export const equatorEdges = () =>
  ids(PIECES.filter((piece) => kind(piece) === 'edge' && !hasColor(piece, WHITE) && !hasColor(piece, YELLOW)));

const SIDE_CENTERS = centers(...SIDES);
const WHITE_CENTER = centers(WHITE);
const YELLOW_CENTER = centers(YELLOW);
const WHITE_EDGES = edgesWith(WHITE);
const YELLOW_EDGES = edgesWith(YELLOW);
const WHITE_CORNERS = cornersWith(WHITE);
const YELLOW_CORNERS = cornersWith(YELLOW);
const EQ_EDGES = equatorEdges();

/** Croix blanche : arêtes blanches + centres pour coller les couleurs. */
export const SHOW_WHITE_CROSS = keep(WHITE_EDGES, WHITE_CENTER, SIDE_CENTERS);

/** Première face : croix + coins blancs + centres. */
export const SHOW_WHITE_FACE = keep(WHITE_EDGES, WHITE_CORNERS, WHITE_CENTER, SIDE_CENTERS);

/** 2e étage (cube retourné) : arêtes du milieu + arêtes jaunes (repère « pas de jaune ») + centres. */
export const SHOW_SECOND_LAYER = keep(EQ_EDGES, YELLOW_EDGES, SIDE_CENTERS);

/** Belge : première face encore en haut, belges en bas. */
export const SHOW_BELGE = keep(SHOW_WHITE_FACE, EQ_EDGES, WHITE_CENTER, SIDE_CENTERS);

/** Moyenne : 2e étage keyhole (trou = coin blanc). */
export const SHOW_F2L_EDGES = keep(EQ_EDGES, WHITE_CORNERS, YELLOW_EDGES, WHITE_CENTER, SIDE_CENTERS);

/** Moyenne : finir les deux premiers étages. */
export const SHOW_F2L = keep(WHITE_EDGES, WHITE_CORNERS, EQ_EDGES, WHITE_CENTER, SIDE_CENTERS);

/** Croix jaune : seulement les 4 arêtes jaunes (les coins jaunes brouillent le L / la ligne). */
export const SHOW_YELLOW_CROSS = keep(YELLOW_EDGES, YELLOW_CENTER, SHOW_F2L);

/** Placer les arêtes jaunes : elles + les centres de côté. */
export const SHOW_YELLOW_EDGES = keep(YELLOW_EDGES, YELLOW_CENTER, SHOW_F2L);

/** Placer les coins jaunes : coins + centres (les arêtes bougent et font du bruit). */
export const SHOW_YELLOW_CORNERS = keep(YELLOW_CORNERS, YELLOW_CENTER, SHOW_F2L);

/** Orienter les coins : on ne regarde que le jaune des coins. */
export const SHOW_TWIST = keep(YELLOW_CORNERS, YELLOW_CENTER, SHOW_YELLOW_CROSS, SHOW_F2L);

/** Centres seulement (cubes avec images). */
export const SHOW_CENTERS = keep(WHITE_CENTER, YELLOW_CENTER, SIDE_CENTERS);

/** L’id de la pièce qui porte exactement ces couleurs (`top`, `front`…) */
export const pieceWith = (...colors) => PIECES.find((piece) => (
  piece.faces.length === colors.length && colors.every((color) => hasColor(piece, color))
))?.id;

export const pose = (...algs) => algs.flatMap(invertAlg).join(' ');
export const poseYU = (...algs) => [YU, ...algs.flatMap(invertAlg)].join(' ');
