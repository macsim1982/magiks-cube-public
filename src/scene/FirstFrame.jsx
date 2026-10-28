// @ts-check
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// La 1re image compile les shaders : le loader couvre jusqu’à la 2e
const FRAMES = 2;

/** Appelle `onReady` une fois, quand la scène a vraiment dessiné. */
export default function FirstFrame({ onReady }) {
  const frames = useRef(0);

  useFrame(() => {
    if (frames.current > FRAMES) return;
    frames.current += 1;
    if (frames.current === FRAMES) onReady?.();
  });

  return null;
}
