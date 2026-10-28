// @ts-check
/**
 * Types du contrat puzzle. JSDoc seulement : ce module
 * n’exporte aucun code, `tsc -p tsconfig.check.json` les vérifie.
 */

/** @typedef {import('./core/state.js').PuzzleState} PuzzleState */

/** Un axe du repère de vue : `R`, `U` ou `F` tombe sur un axe monde signé. */
/** @typedef {{ axis: string, sign: number }} FrameAxis */
/** @typedef {{ R: FrameAxis, U: FrameAxis, F: FrameAxis }} Frame */
/** Vue de la caméra en vecteurs du monde : vers la caméra, haut de l’écran. @typedef {{ toCamera: number[], screenUp: number[] }} CameraView */

/**
 * Tour logique. NxN : `axis` + `layer` (null = tout le cube) ;
 * Skewb : `tip`, le coin autour duquel on tourne.
 * @typedef {{
 *   axis?: string,
 *   layer?: number | null,
 *   tip?: number[],
 *   angle: number,
 *   steps?: number,
 *   turns?: number,
 * }} Turn
 */

/** @typedef {{ color: string, axis: number, sign: number }} PieceFace */
/** @typedef {{ id: string, slot: number[], faces: PieceFace[], kind?: string }} Piece */

/**
 * Stratégie de drag lue par `render/pointer.js`.
 * @typedef {{
 *   angle: number,
 *   resolve: (hit: unknown, context: object) => Turn | object | null,
 *   lockDistance?: number,
 *   commitRatio?: number,
 *   radius?: (start: number[], axis: number[]) => number,
 * }} DragStrategy
 */

/**
 * Ce que l’écran propose pour ce puzzle ; `App` lit ces drapeaux, jamais l’`id`.
 * @typedef {{ lessons: boolean, solver: boolean, race: boolean }} Capabilities
 */

/**
 * Définition d’un puzzle. Les champs en plus (géométrie propre à une
 * famille : `cubeletBoxMirror`, `createCornerGeometry`…) sont lus par la
 * pièce de la famille, jamais par le runtime.
 * @typedef {{
 *   id: string,
 *   label: string,
 *   family: string,
 *   angle: number,
 *   pieces: Piece[],
 *   keys: Record<string, string>,
 *   mirror: boolean,
 *   capabilities: Capabilities,
 *   authored: 'slot' | 'world',
 *   Piece: Function,
 *   toTurn: (token: string, frame?: Frame) => Turn | null,
 *   turnToToken: (turn: Turn, frame?: Frame) => string | null,
 *   invert: (token: string) => string,
 *   invertAlg: (tokens: string[] | string) => string[],
 *   parseAlg: (alg: string) => string[],
 *   scramble: (length?: number) => string[],
 *   viewFrame: (view: CameraView) => Frame,
 *   DEFAULT_FRAME: Frame,
 *   movingIds: (state: PuzzleState, turn: Turn) => string[],
 *   apply: (state: PuzzleState, turn: Turn) => PuzzleState,
 *   createState: () => PuzzleState,
 *   isSolved: (state: PuzzleState) => boolean,
 *   turnAxis: (turn: Turn) => number[],
 *   slotWorld: (slot: number[]) => number[],
 *   drag: DragStrategy,
 *   moveLabels: Record<string, string>,
 *   createBodyTemplate?: () => object,
 *   [extra: string]: unknown,
 * }} PuzzleDefinition
 */

export {};
