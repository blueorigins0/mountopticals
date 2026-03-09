import * as THREE from "three";

interface NormalizeModelOptions {
  forceFlipFrontBack?: boolean;
  verticalOffsetFactor?: number;
}

interface NormalizedModelResult {
  normalizedScene: THREE.Object3D;
  baseModelWidth: number;
  isFrontBackFlipped: boolean;
}

const Y_ROTATION_CANDIDATES = [0, Math.PI / 2, -Math.PI / 2, Math.PI] as const;

const getBounds = (object: THREE.Object3D) => {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
};

const recenterAndMeasure = (object: THREE.Object3D) => {
  const { center } = getBounds(object);
  object.position.sub(center);
  return getBounds(object);
};

export function normalizeGlassesScene(
  sourceScene: THREE.Object3D,
  { forceFlipFrontBack = false, verticalOffsetFactor = 0.03 }: NormalizeModelOptions = {}
): NormalizedModelResult {
  let bestScene: THREE.Object3D | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const angle of Y_ROTATION_CANDIDATES) {
    const candidate = sourceScene.clone(true);
    candidate.rotation.y += angle;

    const { box, size } = recenterAndMeasure(candidate);
    const widthDepthRatio = size.x / Math.max(size.z, 0.001);
    const frontDepth = Math.max(0, box.max.z);
    const backDepth = Math.max(0, -box.min.z);
    const backBias = backDepth - frontDepth;
    const score = widthDepthRatio * 4 + backBias;

    if (score > bestScore) {
      bestScore = score;
      bestScene = candidate;
    }
  }

  const finalScene = bestScene ?? sourceScene.clone(true);
  let { box: finalBox, size: finalSize } = recenterAndMeasure(finalScene);
  let didFlipFrontBack = false;

  const frontDepth = Math.max(0, finalBox.max.z);
  const backDepth = Math.max(0, -finalBox.min.z);

  if (frontDepth > backDepth) {
    finalScene.rotation.y += Math.PI;
    didFlipFrontBack = !didFlipFrontBack;
    ({ box: finalBox, size: finalSize } = recenterAndMeasure(finalScene));
  }

  if (forceFlipFrontBack) {
    finalScene.rotation.y += Math.PI;
    didFlipFrontBack = !didFlipFrontBack;
    ({ box: finalBox, size: finalSize } = recenterAndMeasure(finalScene));
  }

  finalScene.position.y -= finalSize.y * verticalOffsetFactor;
  finalScene.updateMatrixWorld(true);

  const baseModelWidth = Math.max(finalSize.x, finalSize.y * 1.05, 0.001);

  return {
    normalizedScene: finalScene,
    baseModelWidth,
    isFrontBackFlipped: didFlipFrontBack,
  };
}
