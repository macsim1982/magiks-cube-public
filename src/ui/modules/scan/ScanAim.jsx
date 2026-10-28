// @ts-check
import { useRef } from 'react';
import { Button, Field } from '../../components';
import ScanFrame from './ScanFrame';
import { photoCover, photoSquare, readFrame, videoSquare } from './scanCapture';
import { useAutoShoot } from './useAutoShoot';
import { useCamera } from './useCamera';
import { usePhotoPlacement } from './usePhotoPlacement';
import { STEPS } from './steps';

// Ce qu’il manque pour la prise automatique
const AIM_HINTS = {
  start: 'La caméra démarre…',
  fill: 'Approche ton cube : il doit remplir le dessin.',
  centres: [
    'Le blanc en haut, les centres comme sur le dessin.',
    'Le jaune en haut, les centres comme sur le dessin.',
  ],
  still: 'C’est bon ! Ne bouge plus…',
};

const CAMERA_TROUBLE = {
  denied: 'La caméra est refusée. Tu peux importer deux photos de ton cube.',
  none: 'Pas de caméra ici. Tu peux importer deux photos de ton cube.',
};

/** La phrase sous le cadre pendant qu’on vise */
function aimHint(shooter, photo, status) {
  if (shooter.taken) return 'Photo prise !';
  if (status !== 'live') return AIM_HINTS.start;
  const { hint } = shooter.aim;
  return hint === 'centres' ? AIM_HINTS.centres[photo] : AIM_HINTS[hint];
}

/** La photo importée, posée sous le cadre à sa place et à son zoom */
function PlacedPhoto({ placement, picture }) {
  const { file, natural, frame, place } = placement;
  const cover = natural && frame ? photoCover(natural, frame) : null;
  return (
    <img
      ref={picture}
      className="scan__photo"
      src={file.url}
      alt=""
      draggable={false}
      onLoad={placement.onLoad}
      style={cover ? {
        width: cover.width,
        height: cover.height,
        transform: `translate(-50%, -50%) translate(${place.x}px, ${place.y}px) scale(${place.zoom})`,
      } : undefined}
    />
  );
}

/** Le viseur : la vidéo, ou la photo importée, sous la silhouette du cube */
function Viewfinder({ photo, camera, usingCamera, placement, picture, shooter }) {
  return (
    <div className={`scan__view${usingCamera && camera.mirror ? ' is-mirror' : ''}`}>
      {usingCamera && <video ref={camera.video} className="scan__video" playsInline muted autoPlay />}
      {!usingCamera && placement.file && <PlacedPhoto placement={placement} picture={picture} />}
      <ScanFrame
        photo={photo}
        live={usingCamera ? shooter.live : null}
        aim={usingCamera ? shooter.aim.state : null}
        progress={shooter.aim.progress}
      />
    </div>
  );
}

/** Le cadre où l’on vise, son flash quand la photo se prend, ou ce qui manque */
function Stage(props) {
  const { photo, camera, usingCamera, placement, shooter } = props;
  const { file } = placement;
  return (
    <div className={`scan__stage${file ? ' is-movable' : ''}`} ref={placement.stage} {...placement.pointer}>
      <Viewfinder {...props} />
      {shooter.taken && (
        <>
          <div className="scan__flash" aria-hidden="true" />
          <p className="scan__taken">Photo {photo + 1} prise !</p>
        </>
      )}
      {!usingCamera && !file && (
        <p className="scan__empty">
          {CAMERA_TROUBLE[camera.status] ?? 'Importe une photo de ton cube, un coin vers toi.'}
        </p>
      )}
    </div>
  );
}

/** Prendre ou utiliser la photo, en importer une, revenir à la caméra */
function Actions({ usingCamera, ready, onCapture, onImport, onCamera }) {
  const fileInput = useRef(null);
  return (
    <div className="scan__actions">
      <Button variant="filled" icon="camera" className="scan__shoot" onClick={onCapture} disabled={!ready}>
        {usingCamera ? 'Prendre la photo' : 'Utiliser cette photo'}
      </Button>
      <Button icon="image" onClick={() => fileInput.current?.click()}>
        Importer
      </Button>
      {onCamera && <Button onClick={onCamera}>Caméra</Button>}
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onImport} />
    </div>
  );
}

/**
 * Une photo du scan : à la caméra, qui se prend seule
 * quand le cube est en place, ou importée et calée à la main (`source` :
 * 'camera' ou 'file', gardée d’une photo à l’autre). `onKeep` reçoit ses
 * 27 couleurs et dit si l’image était en miroir.
 */
export default function ScanAim({ photo, source, onSource, onKeep }) {
  const picture = useRef(null);
  const camera = useCamera(source === 'camera');
  const cameraWorks = camera.status === 'starting' || camera.status === 'live';
  const usingCamera = source === 'camera' && cameraWorks;
  const placement = usePhotoPlacement();
  const shooter = useAutoShoot({ camera, photo, active: usingCamera, onShot: (colors) => keep(colors, camera.mirror) });

  function keep(colors, mirrored) {
    shooter.clearLive();
    placement.reset();
    onKeep(colors, mirrored);
  }

  // Bouton « Prendre la photo » ou « Utiliser cette photo »
  const capture = () => {
    if (usingCamera) {
      const el = camera.video.current;
      if (el?.videoWidth) keep(readFrame(el, videoSquare(el), photo), camera.mirror);
      return;
    }
    const el = picture.current;
    const { natural, frame, place } = placement;
    if (el && natural && frame) keep(readFrame(el, photoSquare(natural, frame, place), photo), false);
  };

  const importPhoto = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    onSource('file');
    placement.open(chosen);
  };

  return (
    <>
      <p className="scan__text">{STEPS[photo].text}</p>
      <Stage photo={photo} camera={camera} usingCamera={usingCamera} placement={placement} picture={picture} shooter={shooter} />
      {usingCamera && (
        <p className={`scan__hint is-${shooter.taken ? 'taken' : shooter.aim.state}`} aria-live="polite">
          {aimHint(shooter, photo, camera.status)}
        </p>
      )}
      {!usingCamera && placement.file && (
        <div className="scan__zoom">
          <Field type="range" id="scan-zoom" label="Zoom" format={null} min="1" max="4" step="0.01" value={placement.place.zoom} onChange={placement.zoomTo} />
        </div>
      )}
      <Actions
        usingCamera={usingCamera}
        ready={usingCamera ? camera.status === 'live' && !shooter.taken : Boolean(placement.file)}
        onCapture={capture}
        onImport={importPhoto}
        onCamera={source === 'file' && cameraWorks ? () => {
          placement.reset();
          onSource('camera');
        } : null}
      />
    </>
  );
}
