import * as THREE from 'three';
import { plasticTextures } from './textures';
import { DEFAULT_BODY, DEFAULT_LOOK, DEFAULT_MIRROR_STICKER, DEFAULT_STICKER, FACE_COLORS, FACE_KEYS } from './look';

export const applySurface = (material, params) => {
  material.metalness = params.metalness;
  material.roughness = params.roughness;
  material.reflectivity = params.reflectivity;
  material.clearcoat = params.clearcoat;
  material.clearcoatRoughness = params.clearcoatRoughness;
};

// Vinyle classique lisse : le relief « peau d’orange » est porté par le vernis
// (clearcoatNormalMap). Seul le sticker miroir a sa propre normal map.
export const applyStickerMaps = (material, textures, mirror) => {
  material.roughnessMap = mirror ? textures.stickerMirrorRoughness : textures.stickerRoughness;
  material.normalMap = mirror ? textures.stickerMirrorNormal : null;
  material.clearcoatNormalMap = mirror ? textures.stickerMirrorClearcoatNormal : textures.stickerClearcoatNormal;
  material.needsUpdate = true;
};

export function createMaterials(textures = plasticTextures()) {
  const stickers = Object.fromEntries(
    FACE_KEYS.map((face) => [
      face,
      new THREE.MeshPhysicalMaterial({
        color: FACE_COLORS[face],
        ...DEFAULT_STICKER,
        roughnessMap: textures.stickerRoughness,
        normalMap: null,
        normalScale: new THREE.Vector2(0.25, 0.25),
        ior: 1.5,
        clearcoatNormalMap: textures.stickerClearcoatNormal,
        clearcoatNormalScale: new THREE.Vector2(0.12, 0.12),
      }),
    ])
  );
  return {
    textures,
    body: new THREE.MeshPhysicalMaterial({
      color: DEFAULT_LOOK.colors.body,
      ...DEFAULT_BODY,
      roughnessMap: textures.bodyRoughness,
      normalMap: textures.bodyNormal,
      normalScale: new THREE.Vector2(0.25, 0.25),
      ior: 1.46,
    }),
    stickers,
  };
}

let witnesses = null;

/**
 * Matériaux témoins, jamais libérés : le corps, et le sticker en couleurs et
 * en Mirror. Ils gardent leurs shaders compilés pour toute la session : passer
 * de l’un à l’autre (fin de l’intro, bouton Mirror) ou reconstruire le cube
 * (« Recommencer », autre puzzle) ne recompile rien.
 */
export function shaderWitnesses(textures = plasticTextures()) {
  if (!witnesses) {
    const { body, stickers } = createMaterials(textures);
    const classic = stickers[FACE_KEYS[0]];
    const mirror = classic.clone();
    applySurface(mirror, DEFAULT_MIRROR_STICKER);
    applyStickerMaps(mirror, textures, true);
    witnesses = [body, classic, mirror];
  }
  return witnesses;
}
