// @ts-check

/**
 * Registre des icônes : un dessin, un nom, une seule fois.
 * Grille 24 × 24. Un morceau est rempli, ou au trait s’il a une épaisseur
 * (`stroke`). Sans `color`, il prend la couleur du texte, ou `--icon-fill` /
 * `--icon-stroke` pour une icône à deux tons (l’étoile).
 *
 * @typedef {{ d: string, stroke?: number, color?: string, opacity?: number }} IconPart
 */

// Carré arrondi (rayon 1,5) de 8 × 8 coins (x, y) : les cases de « classique »
const square = (x, y) => `M${x + 1.5} ${y}h5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5v-5a1.5 1.5 0 0 1 1.5-1.5z`;
// Disque de rayon r centré (x, y)
const dot = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const STAR = 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z';

/** @type {Record<string, IconPart[]>} */
export const ICONS = {
  // Navigation
  house: [{ d: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5', stroke: 2.2 }],
  map: [{ d: 'M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20', stroke: 2.2 }],
  menu: [{ d: 'M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z' }],
  close: [{ d: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z' }],
  chevronLeft: [{ d: 'm15.2 5.2-6.8 6.8 6.8 6.8-1.6 1.6L5.2 12l8.4-8.4z' }],
  chevronRight: [{ d: 'm8.8 5.2 6.8 6.8-6.8 6.8 1.6 1.6 8.4-8.4-8.4-8.4z' }],

  // Lecture d’une démo
  play: [{ d: 'M8 4.8v14.4L20 12z' }],
  replay: [{ d: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5', stroke: 2.2 }],
  toStart: [{ d: 'M19 5.6v12.8L9.4 12zM6 5h2.4v14H6z' }],
  stepForward: [{ d: 'M5 5.6v12.8L14.6 12zM16 5h2.4v14H16z' }],
  fastForward: [{ d: 'M5 6.5v11l8-5.5-8-5.5zm8.5 0v11l8-5.5-8-5.5z' }],
  hand: [{ d: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V10a1.5 1.5 0 0 1 3 0v2M14 11.5a1.5 1.5 0 0 1 3 0v2.5M8 13l-1.6-1.6a1.5 1.5 0 0 0-2.2 2l3.3 4.3A6 6 0 0 0 12.3 20H13a4 4 0 0 0 4-4v-2', stroke: 2 }],
  bulb: [{ d: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z', stroke: 2.2 }],
  star: [{ d: STAR }, { d: STAR, stroke: 1.4 }],

  // Jouer
  dice: [{ d: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2.5 2.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm9 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zM12 10.7a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm-4.5 4.5a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6zm9 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z' }],
  shuffle: [{ d: 'M10.6 9.2 5.4 4 4 5.4l5.2 5.2 1.4-1.4zM14.5 4l2 2L4 18.6 5.4 20 17.9 7.5 20 9.5V4h-5.5zm.3 9.4-1.4 1.4 3.1 3.1L14.5 20H20v-5.5l-2 2-3.2-3.1z' }],
  restart: [{ d: 'M12 6V2.8L7.8 7 12 11.2V8a4 4 0 1 1-4 4H5.8A6.2 6.2 0 1 0 12 6z' }],
  undo: [{ d: 'M8 7V4.4L3.2 8.5 8 12.6V10h6.2a4 4 0 1 1 0 8H13v2h1.2a6 6 0 1 0 0-12H8z' }],
  timer: [{ d: 'M9 2h6v2H9zm3 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm-1 2v4.4l3.4 2 1-1.7-2.4-1.4V9z' }],
  keyboard: [{ d: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm2 3v2h2V9H6zm3.5 0v2h2V9h-2zM13 9v2h2V9h-2zm3.5 0v2h2V9h-2zM6 13v2h2v-2H6zm3.5 0v2h5v-2h-5zM16.5 13v2h2v-2h-2z' }],

  // Apprendre, scanner
  learn: [{ d: 'M12 4 3 8.5 12 13l9-4.5L12 4zm-7.2 8.1L12 16.2l7.2-4.1V16L12 20.5 4.8 16v-3.9z' }],
  camera: [{ d: 'M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z' }],
  image: [{ d: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v9.6l3.6-3.6 3 3 4.4-4.4 3 3V6H5zm3.5 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z' }],

  // Étapes d’une leçon (les étapes du cube sont dessinées par RubikIcon)
  notation: [{ d: 'M4 7h4v4H4V7zm6 0h4v4h-4V7zm6 0h4v4h-4V7zM4 13h16v3H4v-3z' }],
  edges: [{ d: 'M16 6h5v5h-2V8h-3V6zM8 18H3v-5h2v3h3v2zM19.2 7.4 14 12.6l-1.4-1.4 5.2-5.2 1.4 1.4zM4.8 16.6 10 11.4l1.4 1.4-5.2 5.2-1.4-1.4z' }],
  twist: [{ d: 'M12 5a7 7 0 0 1 6.3 4H16v2h6V5h-2v2.2A9 9 0 0 0 3.6 12h2.1A7 7 0 0 1 12 5zM12 19a7 7 0 0 1-6.3-4H8v-2H2v6h2v-2.2A9 9 0 0 0 20.4 12h-2.1A7 7 0 0 1 12 19z' }],
  centers: [
    { d: 'M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z', opacity: 0.35 },
    { d: [dot(7.5, 7.5, 1.4), dot(16.5, 7.5, 1.4), dot(7.5, 16.5, 1.4), dot(16.5, 16.5, 1.4)].join('') },
  ],
  bolt: [{ d: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z' }],
  dots: [{ d: [dot(6, 12, 1.7), dot(12, 12, 1.7), dot(18, 12, 1.7)].join('') }],
  bookmark: [{ d: 'M7 3h10a2 2 0 0 1 2 2v16l-7-3.2L5 21V5a2 2 0 0 1 2-2z' }],

  // Apparence du cube
  mirror: [{ d: 'M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3zm0 2.3 5.2 2.9-5.2 2.9-5.2-2.9L12 5.3zM6.2 9.4 11 12.1v6.2l-4.8-2.7V9.4zm6.8 8.9v-6.2l4.8-2.7v6.2L13 18.3z' }],
  classic: [
    { d: square(3, 3), color: '#f4f4f4' },
    { d: square(13, 3), color: '#ff3b30' },
    { d: square(3, 13), color: '#34c759' },
    { d: square(13, 13), color: '#ffe14a' },
    { d: [square(3, 3), square(13, 3), square(3, 13), square(13, 13)].join(''), stroke: 1.2, color: '#3a2a00' },
  ],
};
