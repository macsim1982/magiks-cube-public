import { solveFacelets } from './solveFacelets';

self.onmessage = (event) => {
  const { id, facelets } = event.data;
  try {
    self.postMessage({ id, solution: solveFacelets(facelets) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
