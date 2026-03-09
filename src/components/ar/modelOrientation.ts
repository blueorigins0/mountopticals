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

// Test all 24 cardinal orientations (6 face directions × 4 in-plane rotations)
// This covers models exported with any axis convention
const CANDIDATE_ROTATIONS: [number, number, number][] = [];

// Generate: 4 Y-rotations × 4 X-rotations = 16 combos (covers most cases)
for (const xAngle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
  for (const yAngle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    CANDIDATE_ROTATIONS.push([xAngle, yAngle, 0]);
  }
}
// Also add Z-axis rotations for edge cases
for (const zAngle of [Math.PI / 2, (3 * Math.PI) / 2]) {
  for (const yAngle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    CANDIDATE_ROTATIONS.push([0, yAngle, zAngle]);
  }
}

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
 * - X-axis: widest (frame width, left-right)
 * - Y-axis: shortest (lens height, up-down)  
 * - Z-axis: medium (temple depth, front-back)
 * 
 * Key insight: For glasses, X >> Z > Y always.
 * Width/height ratio should be high (wide frame, short lenses).
 */
const scoreOrientation = (size: THREE.Vector3, box: THREE.Box3) => {
  const safeX = Math.max(size.x, 0.001);
  const safeY = Math.max(size.y, 0.001);
  const safeZ = Math.max(size.z, 0.001);

  const maxDim = Math.max(safeX, safeY, safeZ);
  const minDim = Math.min(safeX, safeY, safeZ);

  // Primary: X must be the largest dimension (frame width spans left-right)
  const xIsWidest = safeX / maxDim; // 1.0 when X is widest

  // Secondary: Y must be the smallest dimension (lens height is shortest)
  const yIsShortest = minDim / safeY; // 1.0 when Y is shortest

  // Tertiary: Width-to-height ratio should be large (glasses are wide and short)
  const aspectRatio = safeX / safeY;

  // Quaternary: Z (depth/temples) should be between X and Y
  const zIsMedium = (safeZ > safeY && safeZ < safeX) ? 2 : 0;

  // Bonus: Temples should extend backward (-Z direction)
  const backZ = Math.max(0, -box.min.z);
  const frontZ = Math.max(0, box.max.z);
  const backwardBias = backZ > frontZ ? 1 : 0;

  return (
    xIsWidest * 15 +
    yIsShortest * 10 +
    aspectRatio * 5 +
    zIsMedium * 3 +
    backwardBias * 1
  );
};

const normalizeQuarterRotation = (deg: number) => {
  const snapped = Math.round((Number.isFinite(deg) ? deg : 0) / 90) * 90;
  return ((snapped % 360) + 360) % 360;
};

export function normalizeGlassesScene(
  sourceScene: THREE.Object3D,
  { forceFlipFrontBack = false, verticalOffsetFactor = 0.03, manualRotationDeg = 0 }: NormalizeModelOptions = {}
): NormalizedModelResult {
  // Step 1: Find the best orientation from all candidates
  let bestScene: THREE.Object3D | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const [rx, ry, rz] of CANDIDATE_ROTATIONS) {
    const candidate = sourceScene.clone(true);
    candidate.rotation.set(rx, ry, rz);
    candidate.updateMatrixWorld(true);

    const { box, size } = recenterAndMeasure(candidate);
    const score = scoreOrientation(size, box);

    if (score > bestScore) {
      bestScore = score;
      bestScene = candidate;
    }
  }

  const finalScene = bestScene ?? sourceScene.clone(true);
  let { box: finalBox, size: finalSize } = recenterAndMeasure(finalScene);
  let didFlipFrontBack = false;

  // Step 2: Ensure temples point backward (-Z)
  const frontZ = Math.max(0, finalBox.max.z);
  const backZ = Math.max(0, -finalBox.min.z);

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

  // Base model width for scaling
  const baseModelWidth = Math.max(finalSize.x, 0.001);

  return {
    normalizedScene: finalScene,
    baseModelWidth,
    isFrontBackFlipped: didFlipFrontBack,
  };
}
