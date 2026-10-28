// @ts-check
import { useState } from 'react';
import { invertAlg } from '../../../puzzles/cube/notation';
import { requestSolution } from '../../../puzzles/cube/solverClient';
import { verifyFacelets } from '../../../puzzles/cube/verifyFacelets';
import { byFacelet, classify } from '../../../scan';
import { Button } from '../../components';
import { DOUBTFUL, repaint, SOLVED, verdictText } from './review';
import ScanFrame, { LETTER_COLORS, LETTER_NAMES } from './ScanFrame';

/** Les six couleurs, pour repeindre la case choisie */
function Palette({ current, onPaint }) {
  return (
    <div className="scan__palette" role="group" aria-label="Choisis sa couleur">
      {Object.entries(LETTER_COLORS).map(([letter, color]) => (
        <button
          key={letter}
          type="button"
          className={`scan__swatch${current === letter ? ' is-current' : ''}`}
          style={{ background: color }}
          aria-label={LETTER_NAMES[letter]}
          title={LETTER_NAMES[letter]}
          onClick={() => onPaint(letter)}
        />
      ))}
    </div>
  );
}

/**
 * Vérifier les couleurs lues sur les deux photos : l’enfant
 * touche une case pour la corriger. Un cube possible part au solveur ;
 * `onScanned(tokens)` reçoit le mélange qui mène du cube résolu au sien.
 */
export default function ScanReview({ shots, mirror, onRestart, onClose, onScanned }) {
  const [read, setRead] = useState(() => classify(byFacelet(shots)));
  const [selected, setSelected] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const letters = read.facelets;
  const verdict = verifyFacelets(letters);
  const solved = letters === SOLVED;

  const paint = (letter) => {
    setRead((r) => repaint(r, selected, letter));
    setSelected(-1);
  };

  const confirm = async () => {
    if (!verdict.ok) return;
    if (solved) {
      onClose();
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      const solution = await requestSolution(letters);
      onScanned(invertAlg(solution));
    } catch (error) {
      console.error(error);
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <>
      <p className="scan__text">Touche une case pour changer sa couleur.</p>
      <div className={`scan__review${mirror ? ' is-mirror' : ''}`}>
        {[0, 1].map((p) => (
          <ScanFrame
            key={p}
            photo={p}
            letters={letters}
            doubt={read.doubt}
            faulty={'at' in verdict ? new Set(verdict.at) : null}
            selected={selected}
            onPick={(facelet) => setSelected((s) => (s === facelet ? -1 : facelet))}
          />
        ))}
      </div>
      {selected >= 0 && <Palette current={letters[selected]} onPaint={paint} />}
      <p className={`scan__verdict ${verdict.ok && !failed ? 'is-ok' : 'is-fault'}`} role="status">
        {verdictText(verdict, { failed, solved, doubtful: read.doubt.some((d) => d > DOUBTFUL) })}
      </p>
      <div className="scan__actions">
        <Button onClick={onRestart} disabled={busy}>
          Reprendre les photos
        </Button>
        <Button variant="filled" onClick={confirm} disabled={!verdict.ok || busy}>
          {busy ? 'Je prépare ton cube…' : solved ? 'Fermer' : 'C’est mon cube !'}
        </Button>
      </div>
    </>
  );
}
