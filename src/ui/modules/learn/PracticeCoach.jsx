// @ts-check
import { describeMove, isRotation, rotationHow, showsArrow } from '../../../learn/practice';
import { Button } from '../../components';

function message(practice) {
  if (practice.status === 'done') return 'Tu l’as fait !';
  // Le défi : pas de flèche tant que l’enfant ne demande pas d’indice
  if (!showsArrow(practice)) return practice.last === 'wrong' ? 'Presque ! Essaie encore.' : 'Sans flèche, à toi !';
  if (practice.status === 'half') return 'Encore un quart de tour !';
  if (practice.status === 'wait') {
    return practice.misses >= 2 ? 'À toi ! Suis la flèche.' : 'À toi !';
  }
  if (practice.last === 'wrong') return 'Presque ! Regarde encore.';
  return practice.last === 'ok' ? 'Bien joué ! Regarde la flèche…' : 'Regarde la flèche…';
}

/** Le coup en grand et en mots ; une fois la formule finie, « tout seul ! » */
function CoachMove({ done, token, tokens, touch }) {
  if (done) {
    return <p className="coach__move">{tokens.length} {tokens.length > 1 ? 'coups' : 'coup'}, tout seul !</p>;
  }
  const move = token ? describeMove(token) : null;
  if (!move) return null;
  return (
    <p className="coach__move">
      <span className="coach__arrow" aria-hidden="true">{move.arrow}</span>
      {/* Tout le cube : comment le tourner soi-même */}
      {isRotation(token) ? rotationHow(token, { touch }) : `Tourne ${move.face}, ${move.turn}.`}
    </p>
  );
}

/** « Revoir » ce coup et « Démo » de toute la formule ; au défi, « Un indice » ; une fois réussi, « Suivant › » */
function CoachActions({ done, practice, nextLabel, onReplay, onRead, onNext }) {
  if (done) {
    return onNext ? (
      <Button variant="filled" iconAfter="chevronRight" className="coach__next" onClick={onNext}>
        {nextLabel}
      </Button>
    ) : null;
  }
  if (practice.hidden) {
    return (
      <div className="coach__actions">
        <Button variant="tonal" icon="bulb" caption aria-label="Un indice : la flèche de ce coup" disabled={practice.status === 'demo'} onClick={onReplay}>
          Indice
        </Button>
      </div>
    );
  }
  return (
    <div className="coach__actions">
      <Button variant="tonal" icon="replay" caption aria-label="Revoir ce coup" disabled={practice.status === 'demo'} onClick={onReplay}>
        Revoir
      </Button>
      <Button icon="play" caption aria-label="Revoir toute la démo" onClick={onRead}>
        Démo
      </Button>
    </div>
  );
}

/**
 * Bulle du mode « À toi » : le coup à refaire en grand
 * et en mots. À côté : « Revoir » (ce coup) et « Démo » (toute la formule,
 *) ; une fois réussi, « Suivant › ». Les lettres de la formule
 * (✓ au fil des coups) sont sur leur ligne, au-dessus.
 * `touch` : écran tactile sans clavier, tout le cube tourne à deux doigts.
 */
export default function PracticeCoach({ practice, token, tokens, touch = false, nextLabel, onReplay, onRead, onNext }) {
  const done = practice.status === 'done';
  const oops = practice.last === 'wrong' && practice.status === 'demo';
  const tone = done ? 'is-done' : oops ? 'is-oops' : '';

  return (
    <section
      className={`coach ${tone}`}
      data-flip="coach"
      data-flip-from="mode-practice"
      aria-live="polite"
      aria-label="Coup à refaire"
    >
      <span className="coach__tile" aria-hidden="true">{done ? '✓' : showsArrow(practice) ? token : '?'}</span>
      <div className="coach__body">
        <p className="coach__status">{message(practice)}</p>
        {/* Au défi, le coup en mots attend l’indice : il dirait la réponse */}
        {showsArrow(practice) && <CoachMove done={done} token={token} tokens={tokens} touch={touch} />}
      </div>
      <CoachActions done={done} practice={practice} nextLabel={nextLabel} onReplay={onReplay} onRead={onRead} onNext={onNext} />
    </section>
  );
}
