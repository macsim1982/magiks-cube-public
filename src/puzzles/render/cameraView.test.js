import { describe, expect, it } from 'vitest';
import { PerspectiveCamera } from 'three';
import { DEFAULT_FRAME, viewFrame } from '../core/frame';
import { cameraView } from './cameraView';

// Vue de repos (`CAMERA_HOME`, scene/framing.js) : diagonale du cube, hauteur 4
const REACH = Math.hypot(4, 6) / Math.SQRT2;
const CAMERA_HOME = [REACH, 4, REACH];

const cameraAt = (x, y, z) => {
  const camera = new PerspectiveCamera();
  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return camera;
};

// Quart de tour de la caméra autour de Y (aimant d’`OrbitSnap`)
const orbit = ([x, y, z], quarters) => {
  const a = (quarters * Math.PI) / 2;
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
};

// La caméra réelle, lue par l’adaptateur : même repère qu’avant le lot C
describe('viewFrame(cameraView(camera))', () => {
  it('gives the default frame from the rest view on the diagonal', () => {
    expect(viewFrame(cameraView(cameraAt(...CAMERA_HOME)))).toEqual(DEFAULT_FRAME);
  });

  it('keeps the previous rest view [4, 4, 6] on the default frame', () => {
    expect(viewFrame(cameraView(cameraAt(4, 4, 6)))).toEqual(DEFAULT_FRAME);
  });

  it('follows each quarter turn of the camera', () => {
    expect(viewFrame(cameraView(cameraAt(...orbit(CAMERA_HOME, 1))))).toEqual({
      R: { axis: 'z', sign: -1 },
      U: { axis: 'y', sign: 1 },
      F: { axis: 'x', sign: 1 },
    });
    expect(viewFrame(cameraView(cameraAt(...orbit(CAMERA_HOME, 2))))).toEqual({
      R: { axis: 'x', sign: -1 },
      U: { axis: 'y', sign: 1 },
      F: { axis: 'z', sign: -1 },
    });
  });
});
