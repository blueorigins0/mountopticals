import * as THREE from "three";

interface NormalizeModelOptions {
  forceFlipFrontBack?: boolean;
  verticalOffsetFactor?: number;
  manualRotationDeg?: number;
}

interface NormalizedModelResult {
  normalizedScene: THREE.Object3D;
  baseModelWidth: number;
  isFrontBackFlipped: boolean;
}

// Test 4 cardinal directions (0°, 90°, 180°, 270°)
const CARDINAL_ROTATIONS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

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
  object.updateMatrixWorld(true);
  return getBounds(object);
};

/**
 * Score an orientation for eyewear frontal view.
 * Ideal glasses orientation:
 * - Wide on X-axis (left-right frame width)
 * - Short on Y-axis (lens height)
 * - Thin on Z-axis (front-back depth, temples should extend backward)
 */
const scoreOrientation = (size: THREE.Vector3, box: THREE.Box3) => {
  const safeX = Math.max(size.x, 0.001);
  const safeY = Math.max(size.y, 0.001);
  const safeZ = Math.max(size.z, 0.001);

  // Primary: X should be the largest dimension (frame width)
  const xIsWidest = safeX / Math.max(safeY, safeZ);
  
  // Secondary: Z (depth) should be larger than Y (height) for temples
  const zOverY = safeZ / safeY;
  
  // Tertiary: Frame should be wider than it is tall
  const widthHeightRatio = safeX / safeY;
  
  // Quaternary: Temples should extend backward (negative Z)
  const frontZ = Math.max(0, box.max.z);
  const backZ = Math.max(0, -box.min.z);
  const backwardBias = backZ > frontZ ? 1 : 0;

  return xIsWidest * 10 + widthHeightRatio * 3 + zOverY * 2 + backwardBias;
};

const normalizeQuarterRotation = (deg: number) => {
  const snapped = Math.round((Number.isFinite(deg) ? deg : 0) / 90) * 90;
  return ((snapped % 360) + 360) % 360;
};

export function normalizeGlassesScene(
  sourceScene: THREE.Object3D,
  { forceFlipFrontBack = false, verticalOffsetFactor = 0.03, manualRotationDeg = 0 }: NormalizeModelOptions = {}
): NormalizedModelResult {
  // Step 1: Find the best cardinal rotation
  let bestScene: THREE.Object3D | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestAngle = 0;

  for (const angle of CARDINAL_ROTATIONS) {
    const candidate = sourceScene.clone(true);
    candidate.rotation.set(0, 0, 0); // Reset rotation first
    candidate.rotation.y = angle;
    candidate.updateMatrixWorld(true);

    const { box, size } = recenterAndMeasure(candidate);
    const score = scoreOrientation(size, box);

    if (score > bestScore) {
      bestScore = score;
      bestScene = candidate;
      bestAngle = angle;
    }
  }

  const finalScene = bestScene ?? sourceScene.clone(true);
  let { box: finalBox, size: finalSize } = recenterAndMeasure(finalScene);
  let didFlipFrontBack = false;

  // Step 2: Check if temples are pointing forward and flip if needed
  const frontZ = Math.max(0, finalBox.max.z);
  const backZ = Math.max(0, -finalBox.min.z);

  // If more geometry is in front (+Z) than back (-Z), flip 180°
  if (frontZ > backZ * 1.1) {
    finalScene.rotation.y += Math.PI;
    didFlipFrontBack = true;
    finalScene.updateMatrixWorld(true);
    ({ box: finalBox, size: finalSize } = recenterAndMeasure(finalScene));
  }

  // Step 3: Apply manual force flip if requested
  if (forceFlipFrontBack) {
    finalScene.rotation.y += Math.PI;
    didFlipFrontBack = !didFlipFrontBack;
    finalScene.updateMatrixWorld(true);
    ({ box: finalBox, size: finalSize } = recenterAndMeasure(finalScene));
  }

  // Step 4: Apply manual rotation (0, 90, 180, 270 degrees)
  const normalizedManualRotationDeg = normalizeQuarterRotation(manualRotationDeg);
  if (normalizedManualRotationDeg !== 0) {
    finalScene.rotation.y += THREE.MathUtils.degToRad(normalizedManualRotationDeg);
    if (normalizedManualRotationDeg === 180) {
      didFlipFrontBack = !didFlipFrontBack;
    }
    finalScene.updateMatrixWorld(true);
    ({ box: finalBox, size: finalSize } = recenterAndMeasure(finalScene));
  }

  // Step 5: Apply vertical offset
  finalScene.position.y -= finalSize.y * verticalOffsetFactor;
  finalScene.updateMatrixWorld(true);

  // Base model width for scaling (use the widest dimension)
  const baseModelWidth = Math.max(finalSize.x, 0.001);

  return {
    normalizedScene: finalScene,
    baseModelWidth,
    isFrontBackFlipped: didFlipFrontBack,
  };
}


