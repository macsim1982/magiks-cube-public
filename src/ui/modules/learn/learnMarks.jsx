// @ts-check
import MoveIcon from './MoveIcon';
import { RubikIcon } from '../../components';
import { caseMark, chapterKind } from '../../../learn/marks';
import { Icon } from '../../icons';

// Ce que montrent les marques : le choix est fait par learn/marks.js
const SWATCHES = {
  blanc: '#f4f4f4',
  jaune: '#ffe14a',
  rouge: '#e10600',
  orange: '#ff8a00',
  vert: '#18a34a',
  bleu: '#1f6feb',
};

const cross = (color, center = color) => [
  'hidden', color,   'hidden',
  color,   center,   color,
  'hidden', color,   'hidden',
]
const full = color => Array(9).fill(color)

// Les étapes du cube se dessinent en cube (RubikIcon) : leurs faces, en données ;
// les autres étapes viennent du registre d’icônes
const CUBE_PICTOS = {
  cross: {
    U: cross('white'),
    F: ['hidden', 'green', 'hidden', 'hidden', 'green', 'hidden', 'hidden', 'hidden', 'hidden'],
    R: ['hidden', 'red', 'hidden', 'hidden', 'red', 'hidden', 'hidden', 'hidden', 'hidden'],
  },
  corners: {
    U: full('white'),
    F: ['green', 'green', 'green', 'hidden', 'green', 'hidden', 'hidden', 'hidden', 'hidden'],
    R: ['red', 'red', 'red', 'hidden', 'red', 'hidden', 'hidden', 'hidden', 'hidden'],
  },
  belge: {
    U: full('white'),
    F: ['green', 'green', 'green', 'green', 'green', 'hidden', 'hidden', 'green', 'hidden'],
    R: ['red', 'red', 'red', 'hidden', 'red', 'red', 'hidden', 'hidden', 'hidden'],
  },
  yellow: {
    U: cross('yellow'),
    F: ['hidden', 'blue', 'hidden', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue'],
    R: ['hidden', 'red', 'hidden', 'red', 'red', 'red', 'red', 'red', 'red'],
  },
};
const KIND_ICONS = {
  notation: 'notation',
  edges: 'edges',
  twist: 'twist',
  centers: 'centers',
  short: 'bolt',
  wait: 'dots',
  step: 'bookmark',
};

/** @param {{ kind: string, size?: number }} props */
function KindIcon({ kind, size }) {
  const faces = CUBE_PICTOS[kind];
  return faces ? <RubikIcon faces={faces} size={size} /> : <Icon name={KIND_ICONS[kind] ?? 'bookmark'} size={size} />;
}

/** @param {{ title: string, size?: number }} props */
export function ChapterIcon({ title, size }) {
  return <KindIcon kind={chapterKind(title)} size={size} />;
}

// Une part égale de la pastille pour chaque couleur citée
const swatch = (colors) => colors
  .map((color, index) => `${SWATCHES[color]} ${(index / colors.length) * 100}% ${((index + 1) / colors.length) * 100}%`)
  .join(', ');

export function StepMark({ alg }) {
  const mark = caseMark(alg);
  switch (mark.kind) {
    case 'colors':
      return <span className="learn__swatch" style={{ background: `conic-gradient(${swatch(mark.colors)})` }} />;
    case 'icon':
      return <Icon name={mark.name} />;
    case 'cube':
      return <RubikIcon faces={CUBE_PICTOS[mark.picto]} />;
    case 'move':
      return <MoveIcon move={mark.move} />;
    case 'glyph':
      return <span className="learn__glyph">{mark.text}</span>;
    default:
      return <KindIcon kind={mark.chapter} />;
  }
}
