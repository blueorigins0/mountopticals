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
  onModelLoaded?: () => void;
}

function TrackedGlasses({
  modelUrl,
  landmarksRef,
  frameMetricsRef,
  onModelLoaded,
}: Omit<FaceTracker3DProps, "canvasWidth" | "canvasHeight">) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null);
  const modelLoadedNotifiedRef = useRef(false);
  const smoothedPosition = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const smoothedScale = useRef(1);

  const { normalizedScene, baseModelWidth } = useMemo(() => {
    const rotationCandidates = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: Math.PI, z: 0 },
      { x: 0, y: 0, z: Math.PI },
      { x: 0, y: Math.PI, z: Math.PI },
      { x: Math.PI, y: 0, z: 0 },
      { x: Math.PI, y: Math.PI, z: 0 },
      { x: Math.PI, y: 0, z: Math.PI },
      { x: Math.PI, y: Math.PI, z: Math.PI },
    ];

    let bestScene: THREE.Object3D | null = null;
    let bestScore = -Infinity;

    for (const candidate of rotationCandidates) {
      const candidateScene = scene.clone(true);
      candidateScene.rotation.set(candidate.x, candidate.y, candidate.z);
      candidateScene.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(candidateScene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      candidateScene.position.sub(center);
      candidateScene.updateMatrixWorld(true);

      const widthHeightRatio = size.x / Math.max(size.y, 0.001);
      const depthPenalty = size.z / Math.max(size.x, 0.001);
      const orientationPenalty =
        (Math.abs(candidate.x) > 0 ? 0.08 : 0) +
        (Math.abs(candidate.z) > 0 ? 0.08 : 0) +
        (Math.abs(candidate.y) > 0 ? 0.03 : 0);
      const score = widthHeightRatio - depthPenalty * 2.1 - orientationPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestScene = candidateScene;
      }
    }

    const finalScene = bestScene ?? scene.clone(true);
    finalScene.updateMatrixWorld(true);

    const finalBox = new THREE.Box3().setFromObject(finalScene);
    const finalSize = new THREE.Vector3();
    const finalCenter = new THREE.Vector3();
    finalBox.getSize(finalSize);
    finalBox.getCenter(finalCenter);

    finalScene.position.sub(finalCenter);
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

    const targetWidth = THREE.MathUtils.lerp(eyeDist * 1.54, frameSpan * 1.08, 0.74);
    const targetScale = THREE.MathUtils.clamp((targetWidth / baseModelWidth) * 0.96, 0.01, 1000);

    const tiltAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const noseDropRatio = THREE.MathUtils.clamp(bridgeDrop / eyeDist, 0, 0.9);
    const pitch = THREE.MathUtils.clamp((noseDropRatio - 0.2) * 0.34, -0.14, 0.14);

    const templeDepthDiff =
      (landmarks[356]?.z ?? landmarks[263]?.z ?? 0) -
      (landmarks[127]?.z ?? landmarks[33]?.z ?? 0);
    const yaw = THREE.MathUtils.clamp(templeDepthDiff * 1.05, -0.14, 0.14);
    const roll = THREE.MathUtils.clamp(-tiltAngle * 0.52, -0.16, 0.16);

    const targetYCanvas =
      THREE.MathUtils.lerp(eyeMidY + eyeDist * 0.06, templeMidY + eyeDist * 0.07, 0.2) + bridgeDrop * 0.34;

    group.visible = true;

    const worldX = centerX - metrics.canvasWidth / 2;
    const worldY = -(targetYCanvas - metrics.canvasHeight / 2);

    targetPosition.current.set(worldX, worldY, 0);
    smoothedPosition.current.lerp(targetPosition.current, 0.24);
    smoothedScale.current = THREE.MathUtils.lerp(smoothedScale.current, targetScale, 0.24);

    group.position.copy(smoothedPosition.current);
    group.scale.setScalar(smoothedScale.current);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pitch, 0.22);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, yaw, 0.22);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, roll, 0.22);
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
        onModelLoaded={onModelLoaded}
      />
    </Canvas>
  );
}
