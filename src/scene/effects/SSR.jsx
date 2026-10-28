// @ts-check
import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';

// Mini G-buffer : normale en espace vue + réflectance (F0) et brillance de chaque matériau.
// F0 suit metalness (métaux) et reflectivity / IOR (diélectriques) ; la brillance suit roughness / clearcoat.
const gBufferVertex = /* glsl */ `
  out vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const gBufferFragment = /* glsl */ `
  precision highp float;
  uniform vec3 f0;
  uniform float smoothness;
  in vec3 vNormal;
  layout(location = 0) out vec4 gNormal;
  layout(location = 1) out vec4 gMaterial;
  void main() {
    gNormal = vec4(normalize(vNormal), 1.0);
    gMaterial = vec4(f0, smoothness);
  }
`;

const ssrFragment = /* glsl */ `
  uniform sampler2D gNormal;
  uniform sampler2D gMaterial;
  uniform mat4 cameraProjection;
  uniform mat4 cameraProjectionInverse;
  uniform float intensity;
  uniform float maxDistance;
  uniform float thickness;

  vec3 viewPosition(const in vec2 uv, const in float depth) {
    vec4 p = cameraProjectionInverse * vec4(vec3(uv, depth) * 2.0 - 1.0, 1.0);
    return p.xyz / p.w;
  }

  vec2 project(const in vec3 p) {
    vec4 clip = cameraProjection * vec4(p, 1.0);
    return clip.xy / clip.w * 0.5 + 0.5;
  }

  // Écart entre la surface visible et le rayon : > 0 quand le rayon passe derrière la surface
  float depthGap(const in vec3 p, out vec2 uv) {
    uv = project(p);
    return getViewZ(readDepth(uv)) - p.z;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    outputColor = inputColor;
    vec4 material = texture2D(gMaterial, uv);
    if (depth >= 1.0 || material.a < 0.02) return;

    vec3 normal = normalize(texture2D(gNormal, uv).xyz);
    vec3 origin = viewPosition(uv, depth);
    vec3 view = normalize(origin);
    vec3 dir = reflect(view, normal);

    // Départ décalé le long de la normale contre l'auto-intersection, pas tramé contre le banding
    float stepLength = maxDistance / float(STEPS);
    float jitter = fract(sin(dot(uv * resolution, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 ray = origin + normal * 0.01 + dir * stepLength * jitter;

    vec2 hitUv = vec2(-1.0);
    vec2 sampleUv;
    for (int i = 0; i < STEPS; i++) {
      ray += dir * stepLength;
      float gap = depthGap(ray, sampleUv);
      if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) break;
      if (gap > 0.0 && gap < thickness) {
        // Raffinement par dichotomie entre le dernier point devant et le premier derrière
        vec3 front = ray - dir * stepLength;
        vec3 back = ray;
        for (int j = 0; j < REFINE_STEPS; j++) {
          vec3 middle = (front + back) * 0.5;
          if (depthGap(middle, sampleUv) > 0.0) back = middle;
          else front = middle;
        }
        hitUv = project(back);
        break;
      }
    }
    if (hitUv.x < 0.0) return;

    // Atténuations : bords de l'écran, rayons revenant vers la caméra, distance parcourue
    vec2 edge = smoothstep(0.0, 0.08, hitUv) * (1.0 - smoothstep(0.92, 1.0, hitUv));
    float facing = 1.0 - smoothstep(0.4, 0.9, dir.z);
    float travel = 1.0 - smoothstep(0.6, 1.0, distance(origin, ray) / maxDistance);

    // Fresnel de Schlick sur la réflectance du matériau, brillance au carré pour les surfaces satinées
    float cosTheta = clamp(dot(-view, normal), 0.0, 1.0);
    vec3 fresnel = material.rgb + (1.0 - material.rgb) * pow(1.0 - cosTheta, 5.0);
    float weight = material.a * material.a * edge.x * edge.y * facing * travel * intensity;

    outputColor.rgb = inputColor.rgb + texture2D(inputBuffer, hitUv).rgb * fresnel * weight;
  }
`;

const DIELECTRIC_F0 = new THREE.Color(0.04, 0.04, 0.04);

export class SSREffect extends Effect {
  constructor(scene, camera, { intensity = 1, maxDistance = 4, thickness = 0.15, steps = 48, refineSteps = 6 } = {}) {
    const gBuffer = new THREE.WebGLRenderTarget(1, 1, { count: 2, type: THREE.HalfFloatType });

    super('SSREffect', ssrFragment, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH,
      defines: new Map([
        ['STEPS', String(steps)],
        ['REFINE_STEPS', String(refineSteps)],
      ]),
      uniforms: new Map(/** @type {[string, THREE.Uniform<any>][]} */ ([
        ['gNormal', new THREE.Uniform(gBuffer.textures[0])],
        ['gMaterial', new THREE.Uniform(gBuffer.textures[1])],
        ['cameraProjection', new THREE.Uniform(new THREE.Matrix4())],
        ['cameraProjectionInverse', new THREE.Uniform(new THREE.Matrix4())],
        ['intensity', new THREE.Uniform(intensity)],
        ['maxDistance', new THREE.Uniform(maxDistance)],
        ['thickness', new THREE.Uniform(thickness)],
      ])),
    });

    this.scene = scene;
    this.camera = camera;
    this.gBuffer = gBuffer;
    this.gBufferMaterials = new Map();
    this.clearColor = new THREE.Color();
    this.f0 = new THREE.Color();
  }

  gBufferMaterialFor(material) {
    const metalness = material.metalness ?? 0;
    const ior = material.ior ?? 1.5;
    const f = (ior - 1) / (ior + 1);
    const dielectric = Math.max(f * f, (material.reflectivity ?? 0) ** 2);
    this.f0.set(dielectric, dielectric, dielectric).lerp(material.color ?? DIELECTRIC_F0, metalness);
    const base = 1 - (material.roughness ?? 1);
    const coat = (material.clearcoat ?? 0) * (1 - (material.clearcoatRoughness ?? 0));
    const smoothness = Math.max(base, coat);

    let gMaterial = this.gBufferMaterials.get(material);
    if (!gMaterial) {
      gMaterial = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: gBufferVertex,
        fragmentShader: gBufferFragment,
        uniforms: {
          f0: { value: this.f0.clone() },
          smoothness: { value: smoothness },
        },
      });
      this.gBufferMaterials.set(material, gMaterial);
    } else {
      gMaterial.uniforms.f0.value.copy(this.f0);
      gMaterial.uniforms.smoothness.value = smoothness;
    }
    return gMaterial;
  }

  update(renderer) {
    const { scene, camera } = this;
    this.uniforms.get('cameraProjection').value.copy(camera.projectionMatrix);
    this.uniforms.get('cameraProjectionInverse').value.copy(camera.projectionMatrixInverse);

    // Rendu du G-buffer : on échange les matériaux le temps d'un rendu, sans fond ni ombres
    const swapped = [];
    scene.traverseVisible((object) => {
      if (!object.isMesh || Array.isArray(object.material)) return;
      if (!object.layers.isEnabled(0)) return;
      swapped.push([object, object.material]);
      object.material = this.gBufferMaterialFor(object.material);
    });

    const background = scene.background;
    const previousTarget = renderer.getRenderTarget();
    const shadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const clearAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this.clearColor);

    scene.background = null;
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(this.gBuffer);
    try {
      renderer.clear();
      renderer.render(scene, camera);
    } finally {
      renderer.setRenderTarget(previousTarget);
      renderer.setClearColor(this.clearColor, clearAlpha);
      renderer.shadowMap.autoUpdate = shadowAutoUpdate;
      scene.background = background;
      swapped.forEach(([object, material]) => {
        object.material = material;
      });
    }
  }

  setSize(width, height) {
    this.gBuffer.setSize(width, height);
  }

  dispose() {
    this.gBuffer.dispose();
    this.gBufferMaterials.forEach((material) => material.dispose());
    super.dispose();
  }
}

export function SSR({ intensity = 1, maxDistance = 4, thickness = 0.15, steps = 48, refineSteps = 6 }) {
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  const effect = useMemo(
    () => new SSREffect(scene, camera, { steps, refineSteps }),
    [scene, camera, steps, refineSteps]
  );

  useEffect(() => {
    effect.uniforms.get('intensity').value = intensity;
    effect.uniforms.get('maxDistance').value = maxDistance;
    effect.uniforms.get('thickness').value = thickness;
  }, [effect, intensity, maxDistance, thickness]);

  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} />;
}
