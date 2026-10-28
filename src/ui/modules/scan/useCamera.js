import { useEffect, useRef, useState } from 'react';

// Sans HTTPS (hors localhost), le navigateur ne donne pas la caméra
const SUPPORTED = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

/**
 * Caméra du scan : celle de derrière sur téléphone, la webcam
 * sinon. Elle ne tourne que pendant `active`, sur la `<video>` de `video`.
 * - `status` : 'starting' | 'live' | 'denied' (refusée) | 'none' (pas de
 *   caméra, ou page sans HTTPS) ;
 * - `mirror` : caméra tournée vers soi, l’image s’affiche comme un miroir.
 */
export function useCamera(active) {
  const video = useRef(null);
  const [state, setState] = useState({ status: SUPPORTED ? 'starting' : 'none', mirror: false });

  useEffect(() => {
    const el = video.current;
    if (!active || !SUPPORTED || !el) return undefined;
    let stream = null;
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
    }).then((media) => {
      if (cancelled) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = media;
      el.srcObject = media;
      el.play().catch(() => {});
      const facing = media.getVideoTracks()[0]?.getSettings().facingMode;
      setState({ status: 'live', mirror: facing !== 'environment' });
    }).catch((error) => {
      if (!cancelled) setState({ status: error?.name === 'NotAllowedError' ? 'denied' : 'none', mirror: false });
    });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      el.srcObject = null;
    };
  }, [active]);

  return { video, ...state };
}
