// @ts-check
import { useState } from 'react';
import { Dialog, IconButton } from '../../components';
import ScanAim from './ScanAim';
import ScanReview from './ScanReview';
import { STEPS } from './steps';
import './Scan.scss';

/**
 * Scanner son vrai cube : deux photos en coin, avec la caméra
 * ou deux photos importées (`ScanAim`), puis l’enfant vérifie les couleurs
 * lues (`ScanReview`). `onScanned(tokens)` : un mélange qui mène du cube
 * résolu au sien (l’inverse d’une solution de Kociemba), comme celui de
 * « Mélanger ». Un clic à côté ne ferme pas : les photos seraient perdues.
 */
export default function Scan({ onClose, onScanned }) {
  const [open, setOpen] = useState(true);
  // 0, 1 : les photos ; 2 : vérifier
  const [photo, setPhoto] = useState(0);
  const [source, setSource] = useState('camera');
  const [shots, setShots] = useState([null, null]);
  const [mirror, setMirror] = useState(false);
  const aiming = photo < 2;

  // Une photo gardée : la suivante, ou vérifier
  const keep = (colors, mirrored) => {
    if (photo === 0) setMirror(mirrored);
    setShots((list) => list.map((shot, i) => (i === photo ? colors : shot)));
    setPhoto(photo + 1);
  };

  const restart = () => {
    setPhoto(0);
    setShots([null, null]);
  };

  return (
    <Dialog open={open} onClose={onClose} title="scan-title" className="scan" closedBy="closerequest">
      <header className="scan__head">
        <div>
          <p className="scan__kicker">Scanner mon cube</p>
          <h2 id="scan-title">{aiming ? STEPS[photo].title : 'Vérifie les couleurs'}</h2>
        </div>
        <IconButton icon="close" label="Fermer" onClick={() => setOpen(false)} />
      </header>
      {aiming ? (
        <ScanAim photo={photo} source={source} onSource={setSource} onKeep={keep} />
      ) : (
        <ScanReview shots={shots} mirror={mirror} onRestart={restart} onClose={() => setOpen(false)} onScanned={onScanned} />
      )}
    </Dialog>
  );
}
