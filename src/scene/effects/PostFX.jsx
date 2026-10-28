// @ts-check
import { Bloom, EffectComposer, Noise, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { SSR } from './SSR';

export default function PostFX() {
  return (
    <EffectComposer>
      <SSR intensity={1} maxDistance={4} thickness={0.4} />
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Noise premultiply opacity={0.12} />
    </EffectComposer>
  );
}
