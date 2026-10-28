// @ts-check
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { turnToken } from '../core/turnToken';
import './FaceHints.scss';
import { cameraView } from './cameraView';

const CUBE_TOP = new Vector3(0, 1.55, 0);
const _proj = new Vector3();

/** Pose l’élément au point `[x, y]` (px) du canvas, décalé de `[dx, dy]` */
function place(el, [x, y], [dx, dy]) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.transform = `translate(${dx}, ${dy})`;
}

export default function FaceHints({ highlightRef, puzzle }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const host = useThree((state) => state.gl.domElement.parentElement);
  const root = useRef(null);
  const letter = useRef(null);

  useEffect(() => {
    if (!host) return undefined;
    const el = document.createElement('div');
    el.className = 'turn-readout';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="turn-readout__letter"></span>';
    host.appendChild(el);
    root.current = el;
    letter.current = el.firstElementChild;
    return () => {
      el.remove();
      root.current = null;
      letter.current = null;
    };
  }, [host]);

  useFrame(() => {
    const el = root.current;
    const mark = letter.current;
    if (!el || !mark) return;

    const highlight = highlightRef?.current;
    const frame = highlight ? puzzle.viewFrame(cameraView(camera)) : null;
    const token = highlight ? turnToken(highlight, puzzle, frame) : null;
    if (!token) {
      el.classList.remove('is-on');
      return;
    }

    mark.textContent = token;
    el.classList.add('is-on');

    const rect = gl.domElement.getBoundingClientRect();
    _proj.copy(CUBE_TOP).project(camera);
    const x = (_proj.x * 0.5 + 0.5) * rect.width;
    const y = (-_proj.y * 0.5 + 0.5) * rect.height;
    place(mark, [x, y], ['-50%', '-300%']);
  });

  return null;
}
