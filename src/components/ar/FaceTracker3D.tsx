import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface TrackingFrameMetrics {
  canvasWidth: number;
  canvasHeight: number;
  videoWidth: number;
  videoHeight: number;
  drawScale: number;
  offsetX: number;
  offsetY: number;
}

interface FaceTracker3DProps {
  modelUrl: string;
  landmarksRef: React.MutableRefObject<any[] | null>;
  frameMetricsRef: React.MutableRefObject<TrackingFrameMetrics | null>;
  canvasWidth: number;
  canvasHeight: number;
  fitScaleMultiplier?: number;
  fitYOffset?: number;
  fitTiltMultiplier?: number;
  onModelLoaded?: () => void;
}

function TrackedGlasses({
  modelUrl,
  landmarksRef,
  frameMetricsRef,
  fitScaleMultiplier = 1,
  fitYOffset = 0,
  fitTiltMultiplier = 1,
  onModelLoaded,
}: Omit<FaceTracker3DProps, "canvasWidth" | "canvasHeight">) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null);
  const modelLoadedNotifiedRef = useRef(false);
  const smoothedPosition = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const smoothedScale = useRef(1);

  const { normalizedScene, baseModelWidth } = useMemo(() => {
    const getBounds = (object: THREE.Object3D) => {
      object.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      return { box, size, center };
    };

    const rotationCandidates = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: Math.PI, z: 0 },
    ];

    let bestScene: THREE.Object3D | null = null;
    let bestScore = -Infinity;

    for (const candidate of rotationCandidates) {
      const candidateScene = scene.clone(true);
      candidateScene.rotation.set(candidate.x, candidate.y, candidate.z);

      const initialBounds = getBounds(candidateScene);
      candidateScene.position.sub(initialBounds.center);

      const centeredBounds = getBounds(candidateScene);
      const frontDepth = Math.max(0, centeredBounds.box.max.z);
      const backDepth = Math.max(0, -centeredBounds.box.min.z);

      const widthHeightRatio = centeredBounds.size.x / Math.max(centeredBounds.size.y, 0.001);
      const depthPenalty = centeredBounds.size.z / Math.max(centeredBounds.size.x, 0.001);
      const orientationBias = backDepth - frontDepth * 1.6;
      const score = widthHeightRatio - depthPenalty * 2.6 + orientationBias * 0.22;

      const shouldReplace =
        score > bestScore + 1e-6 ||
        (Math.abs(score - bestScore) <= 1e-6 && candidate.y === 0);

      if (shouldReplace) {
        bestScore = score;
        bestScene = candidateScene;
      }
    }

    const finalScene = bestScene ?? scene.clone(true);
    let { box: finalBox, size: finalSize, center: finalCenter } = getBounds(finalScene);

    finalScene.position.sub(finalCenter);
    ({ box: finalBox, size: finalSize } = getBounds(finalScene));

    const frontDepth = Math.max(0, finalBox.max.z);
    const backDepth = Math.max(0, -finalBox.min.z);

    if (frontDepth > backDepth * 1.08) {
      finalScene.rotation.y += Math.PI;
      ({ center: finalCenter } = getBounds(finalScene));
      finalScene.position.sub(finalCenter);
      ({ size: finalSize } = getBounds(finalScene));
    }

    finalScene.position.y -= finalSize.y * 0.03;
    finalScene.updateMatrixWorld(true);

    const computedWidth = Math.max(finalSize.x, finalSize.y * 1.05, 0.001);

    return {
      normalizedScene: finalScene,
      baseModelWidth: computedWidth,
    };
  }, [scene]);

  useEffect(() => {
    if (!modelLoadedNotifiedRef.current) {
      modelLoadedNotifiedRef.current = true;
      onModelLoaded?.();
    }
  }, [onModelLoaded]);

  useFrame(() => {
    const landmarks = landmarksRef.current;
    const metrics = frameMetricsRef.current;
    const group = groupRef.current;

    if (!landmarks || !metrics || !group) {
      if (group) group.visible = false;
      return;
    }

    const mapPointToCanvas = (point: { x: number; y: number }) => ({
      x: (1 - point.x) * metrics.videoWidth * metrics.drawScale + metrics.offsetX,
      y: point.y * metrics.videoHeight * metrics.drawScale + metrics.offsetY,
    });

    const leftEyeSource = landmarks[33];
    const rightEyeSource = landmarks[263];
    const noseBridgeSource = landmarks[168] ?? landmarks[6] ?? landmarks[1];

    if (!leftEyeSource || !rightEyeSource || !noseBridgeSource) {
      group.visible = false;
      return;
    }

    const leftTempleSource = landmarks[127] ?? leftEyeSource;
    const rightTempleSource = landmarks[356] ?? rightEyeSource;

    const leftEye = mapPointToCanvas(leftEyeSource);
    const rightEye = mapPointToCanvas(rightEyeSource);
    const leftTemple = mapPointToCanvas(leftTempleSource);
    const rightTemple = mapPointToCanvas(rightTempleSource);
    const noseBridge = mapPointToCanvas(noseBridgeSource);

    const eyeDist = Math.max(1, Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y));
    const frameSpan = Math.max(
      1,
      Math.hypot(rightTemple.x - leftTemple.x, rightTemple.y - leftTemple.y)
    );

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const templeMidX = (leftTemple.x + rightTemple.x) / 2;
    const centerX = THREE.MathUtils.lerp(eyeMidX, templeMidX, 0.34);

    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const templeMidY = (leftTemple.y + rightTemple.y) / 2;
    const bridgeDrop = noseBridge.y - eyeMidY;

    const targetWidth = THREE.MathUtils.lerp(eyeDist * 1.92, frameSpan * 1.28, 0.75) * fitScaleMultiplier;
    const targetScale = THREE.MathUtils.clamp((targetWidth / baseModelWidth) * 1.2, 0.01, 1000);

    const tiltAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    let normalizedTiltAngle = tiltAngle;
    if (normalizedTiltAngle > Math.PI / 2) normalizedTiltAngle -= Math.PI;
    if (normalizedTiltAngle < -Math.PI / 2) normalizedTiltAngle += Math.PI;

    const noseDropRatio = THREE.MathUtils.clamp(bridgeDrop / eyeDist, 0, 0.9);
    const pitch = THREE.MathUtils.clamp((noseDropRatio - 0.18) * 0.2, -0.08, 0.08);

    const templeDepthDiff =
      (landmarks[356]?.z ?? landmarks[263]?.z ?? 0) -
      (landmarks[127]?.z ?? landmarks[33]?.z ?? 0);
    const yaw = THREE.MathUtils.clamp(-templeDepthDiff * 0.68, -0.08, 0.08);
    const roll = THREE.MathUtils.clamp(-normalizedTiltAngle * 0.72 * fitTiltMultiplier, -0.2, 0.2);

    const targetYCanvas =
      THREE.MathUtils.lerp(eyeMidY + eyeDist * (0.04 + fitYOffset), templeMidY + eyeDist * (0.045 + fitYOffset), 0.3) +
      bridgeDrop * 0.24;

    group.visible = true;

    const worldX = centerX - metrics.canvasWidth / 2;
    const worldY = -(targetYCanvas - metrics.canvasHeight / 2);

    targetPosition.current.set(worldX, worldY, 0);
    smoothedPosition.current.lerp(targetPosition.current, 0.34);
    smoothedScale.current = THREE.MathUtils.lerp(smoothedScale.current, targetScale, 0.34);

    group.position.copy(smoothedPosition.current);
    group.scale.setScalar(smoothedScale.current);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pitch, 0.28);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, yaw, 0.28);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, roll, 0.28);
  });

  return (
    <group ref={groupRef} visible={false}>
      <primitive object={normalizedScene} />
    </group>
  );
}

function CameraUpdater({
  canvasWidth,
  canvasHeight,
}: {
  canvasWidth: number;
  canvasHeight: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.left = -canvasWidth / 2;
      camera.right = canvasWidth / 2;
      camera.top = canvasHeight / 2;
      camera.bottom = -canvasHeight / 2;
      camera.updateProjectionMatrix();
    }
  }, [camera, canvasWidth, canvasHeight]);

  return null;
}

export default function FaceTracker3D({
  modelUrl,
  landmarksRef,
  frameMetricsRef,
  canvasWidth,
  canvasHeight,
  fitScaleMultiplier = 1,
  fitYOffset = 0,
  fitTiltMultiplier = 1,
  onModelLoaded,
}: FaceTracker3DProps) {
  if (!canvasWidth || !canvasHeight) return null;

  return (
    <Canvas
      orthographic
      camera={{
        left: -canvasWidth / 2,
        right: canvasWidth / 2,
        top: canvasHeight / 2,
        bottom: -canvasHeight / 2,
        near: -1000,
        far: 1000,
        position: [0, 0, 500],
      }}
      gl={{ alpha: true, antialias: true }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <CameraUpdater canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[0, 5, 5]} intensity={0.7} />
      <directionalLight position={[-3, 2, -3]} intensity={0.35} />
      <TrackedGlasses
        modelUrl={modelUrl}
        landmarksRef={landmarksRef}
        frameMetricsRef={frameMetricsRef}
        fitScaleMultiplier={fitScaleMultiplier}
        fitYOffset={fitYOffset}
        fitTiltMultiplier={fitTiltMultiplier}
        onModelLoaded={onModelLoaded}
      />
    </Canvas>
  );
}
