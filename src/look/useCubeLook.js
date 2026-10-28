import { use, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { BufferGeometry, Color, Mesh } from 'three';
import { animate, MD_COLOR, MD_SPATIAL, mdEmphasized, mdStandard } from '../lib/dom/motion';
import { DEFAULT_MIRROR_STICKER, FACE_KEYS, offsetFromLook, stickerHex } from './look';
import { applyStickerMaps, applySurface, createMaterials, shaderWitnesses } from './materials';
import { loadPlasticTextures } from './textures';

// Géométrie vide des témoins : jamais dessinée, seulement compilée
const NOTHING = new BufferGeometry();

/** Le décalage des couches (Mirror) glisse vers sa nouvelle valeur ; `offsetView` le suit */
function useLookOffset(mirror, offsetValue) {
  const offset = useRef(offsetFromLook({ mirror, offset: offsetValue }));
  const [offsetView, setOffsetView] = useState(() => [...offset.current]);
  const prevMirror = useRef(mirror);

  useLayoutEffect(() => {
    const target = offsetFromLook({ mirror, offset: offsetValue });
    const from = [...offset.current];
    const switched = prevMirror.current !== mirror;
    prevMirror.current = mirror;
    if (from.every((value, i) => Math.abs(value - target[i]) < 1e-6)) return undefined;
    return animate(switched ? MD_SPATIAL : 0.12, mdEmphasized, (k) => {
      offset.current = from.map((value, i) => value + (target[i] - value) * k);
      setOffsetView(offset.current);
    });
  }, [mirror, offsetValue]);

  return offsetView;
}

/** La copie éclairée d’un sticker reprend les réglages de son original, plus brillante */
function syncLitMaterial(mat, src) {
  const mapsChanged = mat.roughnessMap !== src.roughnessMap
    || mat.normalMap !== src.normalMap
    || mat.clearcoatNormalMap !== src.clearcoatNormalMap;
  mat.metalness = src.metalness;
  mat.roughness = Math.max(0, src.roughness * 0.25);
  mat.ior = src.ior;
  mat.clearcoat = src.clearcoat;
  mat.clearcoatRoughness = src.clearcoatRoughness;
  mat.roughnessMap = src.roughnessMap;
  mat.normalMap = src.normalMap;
  mat.clearcoatNormalMap = src.clearcoatNormalMap;
  mat.envMapIntensity = (src.envMapIntensity ?? 1) * 1.35;
  mat.color.copy(src.color);
  if (mapsChanged) mat.needsUpdate = true;
  return mat;
}

/** Un sticker de la couche qui tourne passe à sa copie éclairée, ou en revient */
function glowSticker(obj, { on, materials, lit }) {
  if (obj.userData?.kind !== 'sticker') return;
  const src = materials.stickers[obj.userData.face];
  if (!src) return;
  const glowing = lit.glowing.current;
  if (on && !glowing.has(obj)) {
    glowing.set(obj, src);
    obj.material = lit.getLit(src);
  } else if (!on && glowing.has(obj)) {
    obj.material = src;
    glowing.delete(obj);
  }
}

/**
 * Les stickers de la couche qui tourne brillent (copies éclairées). Pas
 * dans userData : R3F remplace cet objet à chaque rendu (animation d’offset).
 */
function useLitStickers(materials) {
  const litMats = useRef(new Map());
  const glowing = useRef(new Map());

  const getLit = useCallback((src) => {
    if (!litMats.current.has(src)) litMats.current.set(src, src.clone());
    return syncLitMaterial(litMats.current.get(src), src);
  }, []);

  return useMemo(() => {
    const lit = {
      glowing,
      getLit,
      syncAll: () => litMats.current.forEach((mat, src) => syncLitMaterial(mat, src)),
      syncColors: () => litMats.current.forEach((mat, src) => mat.color.copy(src.color)),
      disposeAll: () => {
        litMats.current.forEach((mat) => mat.dispose());
        litMats.current.clear();
      },
    };
    lit.setStickerGlow = (cubelets, on) => {
      if (!on && !cubelets) {
        for (const [obj, src] of glowing.current) obj.material = src;
        glowing.current.clear();
        return;
      }
      cubelets?.forEach((root) => root.traverse((obj) => glowSticker(obj, { on, materials, lit })));
    };
    return lit;
  }, [materials, getLit]);
}

/**
 * Les témoins entrent dans la scène, cachés : la compilation d’avance de la
 * scène (scene/ShaderWarmup) prend aussi l’état du sticker qui n’est pas affiché.
 */
function useShaderWitnesses(scene, textures) {
  useLayoutEffect(() => {
    const meshes = shaderWitnesses(textures).map((material) => {
      const mesh = new Mesh(NOTHING, material);
      mesh.visible = false;
      return mesh;
    });
    scene.add(...meshes);
    return () => scene.remove(...meshes);
  }, [scene, textures]);
}

/** Plastique et stickers suivent le look ; les stickers de la scène reprennent leur matériau */
function useSurfaces({ materials, look, scene, lit }) {
  const { body, sticker, mirror } = look;
  useLayoutEffect(() => {
    applySurface(materials.body, body);
    const surface = mirror ? DEFAULT_MIRROR_STICKER : sticker;
    for (const key of FACE_KEYS) {
      applySurface(materials.stickers[key], surface);
      applyStickerMaps(materials.stickers[key], materials.textures, mirror);
    }
    lit.syncAll();
    scene.traverse((obj) => {
      if (!obj.isMesh || obj.userData?.kind !== 'sticker') return;
      const src = materials.stickers[obj.userData.face];
      if (!src) return;
      if (lit.glowing.current.has(obj)) {
        lit.glowing.current.set(obj, src);
        obj.material = lit.getLit(src);
      } else if (obj.material !== src) {
        obj.material = src;
      }
    });
  }, [materials, body, sticker, mirror, scene, lit]);
}

/** Les couleurs se posent d’un coup la première fois, puis glissent (MD) */
function useLookColors({ materials, colors, mirror, lit }) {
  const ready = useRef(false);
  useLayoutEffect(() => {
    const look = { colors, mirror };
    const pairs = [
      [materials.body.color, colors.body],
      ...FACE_KEYS.map((key) => [materials.stickers[key].color, stickerHex(look, key)]),
    ];
    if (!ready.current) {
      for (const [color, hex] of pairs) color.set(hex);
      ready.current = true;
      return undefined;
    }
    const start = pairs.map(([color]) => color.clone());
    const end = pairs.map(([, hex]) => new Color(hex));
    return animate(MD_COLOR, mdStandard, (k) => {
      pairs.forEach(([color], i) => color.copy(start[i]).lerp(end[i], k));
      lit.syncColors();
    });
  }, [materials, colors, mirror, lit]);
}

/**
 * Le look du cube : matériaux, décalage Mirror animé, couleurs
 * et surfaces, et l’éclat des stickers de la couche qui tourne.
 */
export function useCubeLook(look) {
  // Calculées dans un worker : le rendu les attend, comme l’environnement
  const textures = use(loadPlasticTextures());
  const materials = useMemo(() => createMaterials(textures), [textures]);
  const scene = useThree((state) => state.scene);
  const offsetView = useLookOffset(look.mirror, look.offset);
  const lit = useLitStickers(materials);

  useEffect(() => () => {
    materials.body.dispose();
    Object.values(materials.stickers).forEach((mat) => mat.dispose());
    lit.disposeAll();
  }, [materials, lit]);

  useShaderWitnesses(scene, textures);
  useSurfaces({ materials, look, scene, lit });
  useLookColors({ materials, colors: look.colors, mirror: look.mirror, lit });

  return { materials, offsetView, setStickerGlow: lit.setStickerGlow };
}
