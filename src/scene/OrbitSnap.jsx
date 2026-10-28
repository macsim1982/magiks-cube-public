// @ts-check
import { useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Spherical, TOUCH } from 'three';
import { snapAngle } from '../lib/math/angle';
import { POLAR_MAX, POLAR_MIN } from './framing';

const QUARTER = Math.PI / 2;
// Un doigt posé hors du cube tourne la caméra, comme la souris ;
// deux doigts appartiennent au cube, pas de pincer
const TOUCHES = { ONE: TOUCH.ROTATE, TWO: null };

/**
 * `locked` : vue de départ, plus de rotation ni de déplacement (mode « À toi »).
 * `disabled` : la caméra appartient à quelqu’un d’autre (intro).
 */
export default function OrbitSnap({ locked = false, disabled = false }) {
  const camera = useThree((state) => state.camera);
  const controls = useRef(null);
  const rest = useMemo(() => {
    const spherical = new Spherical().setFromVector3(camera.position);
    return { phi: spherical.phi, theta: spherical.theta };
  }, [camera]);

  useEffect(() => {
    const orbit = controls.current;
    if (!locked || !orbit) return;
    orbit.setAzimuthalAngle(rest.theta);
    orbit.setPolarAngle(rest.phi);
    orbit.update();
  }, [locked, rest]);

  // Orbite coupée par un geste à deux doigts : la caméra ne bouge
  // pas pendant le geste, elle se cale quand l’orbite revient
  const pendingSnap = useRef(false);
  const snap = (orbit) => orbit.setAzimuthalAngle(snapAngle(orbit.getAzimuthalAngle(), rest.theta, QUARTER));

  useFrame(() => {
    const orbit = controls.current;
    if (!pendingSnap.current || !orbit?.enabled) return;
    pendingSnap.current = false;
    snap(orbit);
  });

  const onEnd = () => {
    const orbit = controls.current;
    if (!orbit) return;
    if (!orbit.enabled) {
      pendingSnap.current = true;
      return;
    }
    snap(orbit);
    // orbit.setPolarAngle(rest.phi);
  };

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!disabled}
      enablePan={false}
      // Un doigt sur le cube le tourne (pointer.js), hors du cube la caméra
      touches={TOUCHES}
      enableRotate={!locked}
      enableDamping={true}
      minDistance={4}
      maxDistance={18}
      dampingFactor={0.1}
      minPolarAngle={POLAR_MIN}
      maxPolarAngle={POLAR_MAX}
      onEnd={onEnd}
    />
  );
}
