// @ts-check
import { FACE_COLORS } from '../../../look';
import { OUTLINE, VIEWS } from '../../../scan';
import { DOUBTFUL } from './review';

/** Couleur du cube de l’app pour chaque lettre de facette */
export const LETTER_COLORS = {
  U: FACE_COLORS.top,
  R: FACE_COLORS.right,
  F: FACE_COLORS.front,
  D: FACE_COLORS.bottom,
  L: FACE_COLORS.left,
  B: FACE_COLORS.back,
};

export const LETTER_NAMES = {
  U: 'blanc',
  R: 'rouge',
  F: 'vert',
  D: 'jaune',
  L: 'orange',
  B: 'bleu',
};

const SIDE_NAMES = { top: 'du dessus', left: 'de gauche', right: 'de droite' };
const FACE_OF_CENTRE = ['U', 'R', 'F', 'D', 'L', 'B'];

const points = (list) => list.map(([x, y]) => `${x},${y}`).join(' ');
const rgb = (color) => `rgb(${color.map(Math.round).join(',')})`;

/** Viser : la case, en couleur si c’est un centre attendu, et le point de la couleur lue */
function LiveCell({ sticker, seen }) {
  const { facelet, at, corners, centre, patch } = sticker;
  const expected = centre ? LETTER_COLORS[FACE_OF_CENTRE[Math.floor(facelet / 9)]] : null;
  return (
    <g>
      <polygon
        className={`scan-frame__cell${centre ? ' is-centre' : ''}`}
        points={points(corners)}
        style={expected ? { fill: expected } : undefined}
      />
      {seen && <circle className="scan-frame__dot" cx={at[0]} cy={at[1]} r={patch * 1.6} style={{ fill: rgb(seen) }} />}
    </g>
  );
}

/** Vérifier : la case peinte de la couleur lue ; on la touche pour la corriger (pas un centre) */
function ReviewCell({ sticker, index, letters, doubt, faulty, selected, onPick }) {
  const { facelet, corners, centre, side } = sticker;
  const letter = letters[facelet];
  const state = [
    facelet === selected && 'is-selected',
    faulty?.has(facelet) && 'is-faulty',
    !centre && doubt?.[facelet] > DOUBTFUL && 'is-doubtful',
  ].filter(Boolean).join(' ');
  const pick = () => onPick?.(facelet);
  const touch = centre ? { role: 'img' } : {
    role: 'button',
    tabIndex: 0,
    'aria-pressed': facelet === selected,
    onClick: pick,
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      pick();
    },
  };
  return (
    <polygon
      className={`scan-frame__cell ${state}`}
      points={points(corners)}
      style={{ fill: LETTER_COLORS[letter] }}
      data-facelet={facelet}
      data-letter={letter}
      aria-label={`Case ${(index % 9) + 1} ${SIDE_NAMES[side]} : ${LETTER_NAMES[letter]}${centre ? ', centre' : ''}`}
      {...touch}
    />
  );
}

/**
 * Cadre du scan : la silhouette du cube vu par un coin, dans un
 * carré (coordonnées 0..1).
 * - viser (`live`) : les 27 cases, un point de la couleur lue au milieu de
 *   chacune, les centres attendus en couleur ; le contour dit si le cube
 *   est en place (`aim`) et se remplit avant la photo (`progress`) ;
 * - vérifier (`letters`) : les cases peintes, à toucher pour corriger.
 *
 * @param {{ photo: number, live?: object, aim?: string, progress?: number, letters?: string, doubt?: number[], faulty?: Set<number> | null, selected?: number, onPick?: (facelet: number) => void }} props
 */
export default function ScanFrame({ photo, live, aim, progress, letters, doubt, faulty, selected = -1, onPick }) {
  const review = letters != null;
  return (
    <svg className={`scan-frame${review ? ' scan-frame--review' : ''}`} viewBox="0 0 1 1" aria-hidden={review ? undefined : true}>
      <polygon className={`scan-frame__outline${aim ? ` is-${aim}` : ''}`} points={points(OUTLINE)} />
      {/* Ne plus bouger : le contour se remplit, puis la photo se prend */}
      {aim === 'hold' && (
        <polygon
          className="scan-frame__progress"
          points={points(OUTLINE)}
          pathLength="1"
          style={{ strokeDasharray: `${progress} 1` }}
        />
      )}
      {VIEWS[photo].map((sticker, k) => (review ? (
        <ReviewCell
          key={sticker.facelet}
          sticker={sticker}
          index={k}
          letters={letters}
          doubt={doubt}
          faulty={faulty}
          selected={selected}
          onPick={onPick}
        />
      ) : (
        <LiveCell key={sticker.facelet} sticker={sticker} seen={live?.[k]} />
      )))}
    </svg>
  );
}
