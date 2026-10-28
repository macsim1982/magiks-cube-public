// @ts-check
export default function KeyLight() {
  return (
    <directionalLight
      position={[2, 6, 3]}
      intensity={1.2}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0002}
      shadow-normalBias={0.02}
      shadow-camera-left={-4}
      shadow-camera-right={4}
      shadow-camera-top={4}
      shadow-camera-bottom={-4}
    />
  );
}
