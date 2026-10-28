// @ts-check
/** Le pivot revient à zéro : ni rotation, ni déplacement */
export function zeroPivot(pivot) {
  pivot.rotation.set(0, 0, 0);
  pivot.quaternion.identity();
  pivot.position.set(0, 0, 0);
}

/** Les maillages des pièces `ids`, ceux qui existent */
export const meshesOf = (meshById, ids) => ids.map((id) => meshById.get(id)).filter(Boolean);

/**
 * Les pièces `meshes` passent sous le pivot remis à zéro, sans bouger à
 * l’écran : le pivot peut alors les tourner ensemble.
 */
export function gatherOnPivot({ groupRef, pivotRef }, meshes) {
  const pivot = pivotRef.current;
  zeroPivot(pivot);
  groupRef.current.updateMatrixWorld();
  pivot.updateMatrixWorld();
  meshes.forEach((mesh) => pivot.attach(mesh));
  return meshes;
}
