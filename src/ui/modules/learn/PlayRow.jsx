// @ts-check
import { Button } from '../../components';

/**
 * Regarder : ⏮ Début (ou Revoir), ▶ Montre-moi puis ✋ À toi !,
 * ⏭ Un coup. Un cas sans coup n’a qu’un bouton : la suite.
 */
export default function PlayRow({ tokens, playback, nav, onReload, onPractice }) {
  const { frame, playing, done } = playback;
  if (!tokens.length) {
    return (
      <div className="learn__play-row">
        <Button variant="filled" iconAfter="chevronRight" className="learn__play" onClick={nav.onNext} disabled={!nav.canNext}>
          {nav.nextLabel}
        </Button>
      </div>
    );
  }
  return (
    <div className="learn__play-row">
      <Button
        icon={done ? 'replay' : 'toStart'}
        caption
        onClick={done ? playback.play : onReload}
        disabled={playing || (!done && frame === 0)}
      >
        {done ? 'Revoir' : 'Début'}
      </Button>
      {done ? (
        <Button variant="filled" icon="hand" className="learn__play" data-flip="mode-practice" onClick={onPractice}>
          À toi !
        </Button>
      ) : (
        <Button variant="filled" icon="play" className="learn__play" data-flip="primary" onClick={playback.play} disabled={playing}>
          {playing ? 'Regarde…' : 'Montre-moi'}
        </Button>
      )}
      <Button icon="stepForward" caption onClick={() => playback.seek(frame + 1)} disabled={playing || frame >= tokens.length}>
        Un coup
      </Button>
    </div>
  );
}
