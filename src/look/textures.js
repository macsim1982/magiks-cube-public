import * as THREE from 'three';
import { PLASTIC_SIZE, plasticMaps } from './plastic';

function toTexture(size, data) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

const toTextures = (maps) => Object.fromEntries(
  Object.entries(maps).map(([name, data]) => [name, toTexture(PLASTIC_SIZE, data)])
);

let plastic = null;
let loading = null;

/**
 * Textures du plastique, générées une seule fois : elles sont identiques à
 * chaque appel, et la scène peut être construite deux fois avant sa première
 * image (rendu suspendu par l’environnement), puis à chaque « Recommencer ».
 * Partagées : ne pas les `dispose()` avec les matériaux.
 */
export function plasticTextures() {
  plastic ??= toTextures(plasticMaps());
  return plastic;
}

/**
 * Les mêmes, calculées dans un worker : la scène les attend (Suspense) en
 * même temps que l’environnement, sans bloquer le fil principal.
 * Sans worker, calcul sur place.
 */
export function loadPlasticTextures() {
  if (plastic) loading ??= Promise.resolve(plastic);
  loading ??= new Promise((resolve) => {
    const done = (maps) => {
      plastic ??= toTextures(maps);
      resolve(plastic);
    };
    try {
      const worker = new Worker(new URL('./plastic.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (event) => {
        worker.terminate();
        done(event.data);
      };
      worker.onerror = () => {
        worker.terminate();
        done(plasticMaps());
      };
    } catch {
      done(plasticMaps());
    }
  });
  return loading;
}
