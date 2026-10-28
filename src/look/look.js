export const MIRROR_OFFSET = [0.4, -0.60, 0.15];
export const CLASSIC_OFFSET = [0, 0, 0];

export const FACE_COLORS = {
  right:  '#b71204',
  left:   '#ff5800',
  top:    '#f5f5f5',
  bottom: '#ffd500',
  front:  '#009b48',
  back:   '#0046ad',
};

export const FACE_KEYS = ['right', 'left', 'top', 'bottom', 'front', 'back'];

/** Fond de la scène : un ton sous `--bg` pour que le cube ressorte. */
export const BACKDROP = '#ebe1cf';

export const FACE_LABELS = {
  right: 'Droite',
  left: 'Gauche',
  top: 'Haut',
  bottom: 'Bas',
  front: 'Avant',
  back: 'Arrière',
  body: 'Plastique',
};

export const SURFACE_PARAMS = [
  { key: 'metalness', label: 'Metalness' },
  { key: 'roughness', label: 'Roughness' },
  { key: 'reflectivity', label: 'Reflectivity' },
  { key: 'clearcoat', label: 'Clearcoat' },
  { key: 'clearcoatRoughness', label: 'Clearcoat roughness' },
];

export const DEFAULT_BODY = {
  metalness: 0.1,
  roughness: 0.4,
  reflectivity: 0.1,
  clearcoat: 0.1,
  clearcoatRoughness: 0.4,
};

export const DEFAULT_STICKER = {
  metalness: 0.1,
  roughness: 0.4,
  reflectivity: 0.1,
  clearcoat: 0.1,
  clearcoatRoughness: 0.1,
};

export const DEFAULT_MIRROR_STICKER = {
  metalness: 0.9,
  roughness: 0.1,
  reflectivity: 0.1,
  clearcoat: 0.1,
  clearcoatRoughness: 0.004,
};

export const MIRROR_STICKER_COLOR = '#c8ccd4';

export const stickerHex = (look, key) =>
  look.mirror ? MIRROR_STICKER_COLOR : look.colors[key];

export const OFFSET_AXES = [
  { index: 0, label: 'X' },
  { index: 1, label: 'Y' },
  { index: 2, label: 'Z' },
];

export const DEFAULT_LOOK = {
  mirror: false,
  offset: [...MIRROR_OFFSET],
  colors: {
    ...FACE_COLORS,
    body: '#030303',
  },
  body: { ...DEFAULT_BODY },
  sticker: { ...DEFAULT_STICKER },
  // Chrome optionnel : false = monté, pas affiché.
  ui: {
    panel: false,
    puzzles: false,
    lessons: false,
  },
};

export const offsetFromLook = (look) => (look.mirror ? [...(look.offset ?? MIRROR_OFFSET)] : [...CLASSIC_OFFSET]);

export const createLook = () => ({
  mirror: DEFAULT_LOOK.mirror,
  offset: [...DEFAULT_LOOK.offset],
  colors: { ...DEFAULT_LOOK.colors },
  body: { ...DEFAULT_LOOK.body },
  sticker: { ...DEFAULT_LOOK.sticker },
  ui: { ...DEFAULT_LOOK.ui },
});
