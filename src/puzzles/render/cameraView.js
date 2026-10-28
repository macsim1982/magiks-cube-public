// @ts-check
import { Vector3 } from 'three';

/**
 * Adaptateur : la caméra Three.js en vecteurs du monde, pour `viewFrame`
 * (puzzles/core, sans Three.js). `toCamera` : du cube vers la caméra ;
 * `screenUp` : le haut de l’écran.
 * @returns {import('../types.js').CameraView}
 */
export function cameraView(camera) {
  const toCamera = camera.getWorldDirection(new Vector3()).negate();
  const screenUp = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  return { toCamera: toCamera.toArray(), screenUp: screenUp.toArray() };
}
