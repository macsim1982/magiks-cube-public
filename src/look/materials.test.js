import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_MIRROR_STICKER, DEFAULT_STICKER } from './look';
import { applyStickerMaps, applySurface, createMaterials, shaderWitnesses } from './materials';

describe('createMaterials', () => {
  afterEach(() => vi.restoreAllMocks());

  it('builds every material without Three.js warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const materials = createMaterials();
    for (const mirror of [true, false]) {
      for (const sticker of Object.values(materials.stickers)) applyStickerMaps(sticker, materials.textures, mirror);
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([true, false])('gives every map a texture or null (mirror: %s)', (mirror) => {
    const { body, stickers, textures } = createMaterials();
    for (const sticker of Object.values(stickers)) applyStickerMaps(sticker, textures, mirror);
    for (const material of [body, ...Object.values(stickers)]) {
      for (const key of ['normalMap', 'roughnessMap', 'clearcoatNormalMap']) {
        expect(material[key], key).not.toBeUndefined();
      }
    }
  });

  it('shares the plastic textures between calls', () => {
    expect(createMaterials().textures).toBe(createMaterials().textures);
  });
});

describe('shaderWitnesses', () => {
  it('keeps the same materials for the whole session', () => {
    expect(shaderWitnesses()).toBe(shaderWitnesses());
  });

  // Ce qui change le shader d’un sticker : ses cartes et les réglages qui
  // allument une option (clearcoat > 0)
  it.each([false, true])('has a witness for the sticker as the cube shows it (mirror: %s)', (mirror) => {
    const { stickers, textures } = createMaterials();
    const sticker = Object.values(stickers)[0];
    applySurface(sticker, mirror ? DEFAULT_MIRROR_STICKER : DEFAULT_STICKER);
    applyStickerMaps(sticker, textures, mirror);
    const keys = ['normalMap', 'roughnessMap', 'clearcoatNormalMap', 'metalness', 'roughness', 'clearcoat'];
    const twin = shaderWitnesses().find((witness) => keys.every((key) => witness[key] === sticker[key]));
    expect(twin).toBeDefined();
  });
});
