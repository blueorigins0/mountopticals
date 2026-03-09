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

const Y_ROTATION_STEP = Math.PI / 12; // 15°
const Y_ROTATION_CANDIDATES = Array.from({ length: 24 }, (_, i) => i * Y_ROTATION_STEP);

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

const scoreOrientation = (box: THREE.Box3, size: THREE.Vector3) => {
  const safeDepth = Math.max(size.z, 0.001);
  const safeHeight = Math.max(size.y, 0.001);

  // Frontal orientation for eyewear should be wide (x) and thin (z)
  const widthDepthRatio = size.x / safeDepth;
  const widthHeightRatio = size.x / safeHeight;

  // Keep depth balanced around center to avoid selecting extreme side profiles
  const frontDepth = Math.max(0, box.max.z);
  const backDepth = Math.max(0, -box.min.z);
  const depthBalance = 1 - Math.min(1, Math.abs(frontDepth - backDepth) / Math.max(frontDepth + backDepth, 0.001));

  return widthDepthRatio * 8 + widthHeightRatio * 0.4 + depthBalance;
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
    const score = scoreOrientation(box, size);

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

  // If model protrudes more in front than behind, flip so temples go backward.
  if (frontDepth > backDepth * 1.03) {
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

