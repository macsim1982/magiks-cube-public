// @ts-check
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// La lumière respire : son intensité va de GLOW_LOW à GLOW_HIGH en GLOW_PERIOD secondes.
// Au-dessus de 1, le bloom de la scène (PostFX) la fait déborder entre les stickers.
const GLOW_PERIOD = 1.4;
const GLOW_LOW = 0.8;
const GLOW_HIGH = 1.8;

// Le plastique d’origine de chaque corps allumé. Pas dans `userData` : React le remplace à chaque rendu
const bases = new WeakMap();

/**
 * Les pièces s’allument de l’intérieur : leur corps (le plastique) prend la
 * matière lumineuse `material`, les stickers ne changent pas. Rend de quoi
 * les éteindre (`lightDown`).
 */
export function lightUp(pieces, material) {
  const lit = [];
  for (const piece of pieces) {
    const body = piece.children.find((child) => child.userData?.kind === 'body');
    if (!(body instanceof THREE.Mesh)) continue;
    // Le plastique d’origine, gardé une fois, même si une autre lumière est déjà là
    if (!body.material.userData?.glow) bases.set(body, body.material);
    body.material = material;
    lit.push({ body, material });
  }
  return lit;
}

/** Les pièces s’éteignent, sauf celles qu’une autre lumière a reprises depuis */
export function lightDown(lit) {
  for (const { body, material } of lit) {
    if (body.material === material && bases.has(body)) body.material = bases.get(body);
  }
}

// Le plastique reste sombre ; ses bords, vus de biais, s’allument (effet de bord, « fresnel »)
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-view.xyz);
    gl_Position = projectionMatrix * view;
  }
`;
const fragmentShader = `
  uniform vec3 color;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
    gl_FragColor = vec4(vec3(0.02) + color * intensity * rim, 1.0);
  }
`;

/** La matière lumineuse, de couleur `color`, qui respire tant que la vue vit */
export function useGlow(color) {
  const material = useMemo(() => {
    const glow = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(color) }, intensity: { value: GLOW_LOW } },
      vertexShader,
      fragmentShader,
      toneMapped: false,
    });
    glow.userData.glow = true;
    return glow;
  }, [color]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock }) => {
    const wave = (1 + Math.sin((clock.elapsedTime / GLOW_PERIOD) * 2 * Math.PI)) / 2;
    material.uniforms.intensity.value = GLOW_LOW + (GLOW_HIGH - GLOW_LOW) * wave;
  });
  return material;
}
