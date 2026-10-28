import { describe, expect, it } from 'vitest';
import { DEFAULT_FRAME, viewFrame } from './frame';

const view = (toCamera, screenUp = [0, 1, 0]) => ({ toCamera, screenUp });

describe('viewFrame', () => {
  it('reads the rest view on the diagonal as the default frame', () => {
    expect(viewFrame(view([0.6, 0.5, 0.6]))).toEqual(DEFAULT_FRAME);
  });

  it('turns with the camera around the cube', () => {
    expect(viewFrame(view([0.6, 0.5, -0.6]))).toEqual({
      R: { axis: 'z', sign: -1 },
      U: { axis: 'y', sign: 1 },
      F: { axis: 'x', sign: 1 },
    });
  });

  // Caméra penchée d’un quart de tour : le haut de l’écran devient la gauche du cube
  it('follows the screen up when the camera rolls', () => {
    expect(viewFrame(view([0.6, 0.5, 0.6], [-Math.SQRT1_2, 0, Math.SQRT1_2])).U).toEqual({ axis: 'x', sign: -1 });
  });
});
