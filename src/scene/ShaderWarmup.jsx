// @ts-check
import { useLayoutEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { WebGLRenderTarget } from 'three';

/**
 * Compile les shaders de la scène avant que `children` ne se dessinent, en
 * parallèle (KHR_parallel_shader_compile) : sinon la première image bloque
 * le fil principal le temps que le GPU compile (~150 ms sur un portable,
 * bien plus sur un téléphone). `children` restent cachés jusque-là, puis
 * `onWarm(true)`.
 */
export default function ShaderWarmup({ children, onWarm }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const [warm, setWarm] = useState(false);

  useLayoutEffect(() => {
    let alive = true;
    // Dans sa propre tâche, après le rendu React
    const id = setTimeout(() => {
      // Le rendu passe par le post-process, donc par une cible : on compile
      // dans une cible aussi, sinon les shaders (tone mapping, sortie
      // linéaire) ne seraient pas ceux de l’image et tout serait recompilé
      const target = new WebGLRenderTarget(1, 1);
      const previous = gl.getRenderTarget();
      gl.setRenderTarget(target);
      const pending = gl.compileAsync(scene, camera);
      gl.setRenderTarget(previous);
      target.dispose();
      pending.then(() => {
        if (!alive) return;
        setWarm(true);
        onWarm?.(true);
      });
    });
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [gl, scene, camera, onWarm]);

  return <group visible={warm}>{children}</group>;
}
