import { patchStats, VIEWS } from '../../../scan';

/** Côté (px) de l’image analysée : assez pour 27 petits carrés nets */
const SIZE = 360;

let canvas = null;

function context() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
  }
  return canvas.getContext('2d', { willReadFrequently: true });
}

/**
 * Lecture des 27 stickers d’une photo, dans l’ordre de
 * `VIEWS[photo]` : couleur et régularité de chaque case (`patchStats`).
 * `square` : le carré du cadre dans `image`, en px de l’image (vidéo ou
 * photo importée).
 * @param {CanvasImageSource} image
 * @param {{ x: number, y: number, size: number }} square
 * @param {number} photo 0 ou 1
 */
export function readCells(image, square, photo) {
  const ctx = context();
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.drawImage(image, square.x, square.y, square.size, square.size, 0, 0, SIZE, SIZE);
  const pixels = ctx.getImageData(0, 0, SIZE, SIZE);
  return VIEWS[photo].map(({ at, patch }) => patchStats(pixels, [at[0] * SIZE, at[1] * SIZE], patch * SIZE));
}

/** Couleurs seules des 27 stickers (`readCells`). */
export function readFrame(image, square, photo) {
  return readCells(image, square, photo).map((cell) => cell.rgb);
}

/** Le carré du milieu d’une vidéo : ce que montre `object-fit: cover` dans le cadre. */
export function videoSquare(video) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const size = Math.min(width, height);
  return { x: (width - size) / 2, y: (height - size) / 2, size };
}

/**
 * Le carré du cadre dans une photo importée, glissée (`x`, `y` en px du
 * cadre) et zoomée (`zoom` ≥ 1) sous le cadre de côté `frame` px.
 * @param {{ naturalWidth: number, naturalHeight: number }} image
 * @param {number} frame
 * @param {{ x: number, y: number, zoom: number }} place
 */
export function photoSquare({ naturalWidth, naturalHeight }, frame, { x, y, zoom }) {
  const scale = Math.max(frame / naturalWidth, frame / naturalHeight) * zoom;
  return {
    x: (-frame / 2 - x) / scale + naturalWidth / 2,
    y: (-frame / 2 - y) / scale + naturalHeight / 2,
    size: frame / scale,
  };
}

/** Taille affichée d’une photo importée qui couvre le cadre (avant zoom). */
export function photoCover({ naturalWidth, naturalHeight }, frame) {
  const scale = Math.max(frame / naturalWidth, frame / naturalHeight);
  return { width: naturalWidth * scale, height: naturalHeight * scale };
}
