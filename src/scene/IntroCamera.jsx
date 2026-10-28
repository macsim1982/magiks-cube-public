// @ts-check
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Spherical } from 'three';
import { mdEmphasized } from '../lib/dom/motion';
import { CLASSIC_RADIUS, fitDistance, homePose, introPose, NO_RESERVE } from './framing';

const scratch = new Spherical();

/**
 * Caméra de l’intro. Elle suit `introPose` du début à la vue de
 * repos ; si l’on passe l’intro, elle y glisse depuis là où elle est.
 * `intro` : `{ active, startedAt, skippedAt, duration, glide }`, horloge
 * `performance.now()`. Inactive : elle ne touche à rien.
 */
export default function IntroCamera({ intro, rest, reserve = NO_RESERVE }) {
  const camera = /** @type {import('three').PerspectiveCamera} */ (useThree((state) => state.camera));
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const glide = useRef(null);

  useFrame(() => {
    if (!intro.active) return;
    const now = performance.now();
    const end = {
      ...homePose(),
      // La fin de l’intro est un cube classique : elle se pose sur son cadrage
      distance: fitDistance({ fov: camera.fov, width, height, reserve, rest, radius: CLASSIC_RADIUS }),
    };
    let pose;
    if (intro.skippedAt) {
      if (glide.current?.at !== intro.skippedAt) {
        scratch.setFromVector3(camera.position);
        glide.current = {
          at: intro.skippedAt,
          from: { theta: scratch.theta, phi: scratch.phi, distance: scratch.radius },
        };
      }
      const { from } = glide.current;
      const k = mdEmphasized(Math.min(1, (now - intro.skippedAt) / intro.glide));
      // Par le plus court chemin autour du cube
      const turn = Math.atan2(Math.sin(end.theta - from.theta), Math.cos(end.theta - from.theta));
      pose = {
        theta: from.theta + turn * k,
        phi: from.phi + (end.phi - from.phi) * k,
        distance: from.distance + (end.distance - from.distance) * k,
      };
    } else {
      pose = introPose(intro.startedAt ? (now - intro.startedAt) / intro.duration : 0, end);
    }
    camera.position.setFromSphericalCoords(pose.distance, pose.phi, pose.theta);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
