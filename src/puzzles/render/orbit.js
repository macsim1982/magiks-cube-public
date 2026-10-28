// @ts-check
/**
 * L’orbite de la caméra (OrbitControls, `makeDefault`) suit ou non le
 * pointeur : coupée pendant un glissé sur le cube ou un geste à deux doigts.
 */
export function setOrbit(get, enabled) {
  const controls = get().controls;
  if (controls && 'enabled' in controls) controls.enabled = enabled;
}
