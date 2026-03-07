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
      { x: Math.PI, y: 0, z: 0 },
      { x: Math.PI, y: Math.PI, z: 0 },
      { x: 0, y: Math.PI, z: Math.PI },
      { x: 0, y: 0, z: Math.PI / 2 },
      { x: 0, y: 0, z: -Math.PI / 2 },
      { x: Math.PI / 2, y: 0, z: 0 },
      { x: -Math.PI / 2, y: 0, z: 0 },
      { x: 0, y: Math.PI / 2, z: 0 },
      { x: 0, y: -Math.PI / 2, z: 0 },
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
        (Math.abs(candidate.x) > 0 ? 0.04 : 0) +
        (Math.abs(candidate.z) > 0 ? 0.04 : 0) +
        (Math.abs(candidate.y) > 0 ? 0.02 : 0);
      const score = widthHeightRatio - depthPenalty * 0.5 - orientationPenalty;

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

    const mapPointToCanvas = (point: { x: number; y: number }) => {
      const x = (1 - point.x) * metrics.videoWidth * metrics.drawScale + metrics.offsetX;
      const y = point.y * metrics.videoHeight * metrics.drawScale + metrics.offsetY;
      return {
        x: x - metrics.canvasWidth / 2,
        y: -(y - metrics.canvasHeight / 2),
      };
    };

    const leftEyeSource = landmarks[33];
    const rightEyeSource = landmarks[263];
    const noseTipSource = landmarks[6] ?? landmarks[1] ?? landmarks[168];

    if (!leftEyeSource || !rightEyeSource || !noseTipSource) {
      group.visible = false;
      return;
    }

    const leftTempleSource = landmarks[127] ?? leftEyeSource;
    const rightTempleSource = landmarks[356] ?? rightEyeSource;

    const leftEyeOuter = mapPointToCanvas(leftEyeSource);
    const rightEyeOuter = mapPointToCanvas(rightEyeSource);
    const leftTemple = mapPointToCanvas(leftTempleSource);
    const rightTemple = mapPointToCanvas(rightTempleSource);
    const noseTip = mapPointToCanvas(noseTipSource);

    const eyeDist = Math.max(
      1,
      Math.hypot(rightEyeOuter.x - leftEyeOuter.x, rightEyeOuter.y - leftEyeOuter.y)
    );

    const frameSpan = Math.max(
      1,
      Math.hypot(rightTemple.x - leftTemple.x, rightTemple.y - leftTemple.y)
    );

    const centerX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;

    const targetWidth = THREE.MathUtils.lerp(eyeDist * 2.0, frameSpan * 1.04, 0.6);
    const targetScale = THREE.MathUtils.clamp((targetWidth / baseModelWidth) * 0.94, 0.01, 1000);

    const tiltAngle = Math.atan2(
      rightEyeOuter.y - leftEyeOuter.y,
      rightEyeOuter.x - leftEyeOuter.x
    );

    const noseDropRatio = THREE.MathUtils.clamp((noseTip.y - eyeMidY) / eyeDist, 0, 0.6);
    const pitch = THREE.MathUtils.clamp((noseDropRatio - 0.24) * 0.9, -0.28, 0.28);

    const rawDepthDiff = (landmarks[263]?.z ?? 0) - (landmarks[33]?.z ?? 0);
    const yaw = THREE.MathUtils.clamp(-rawDepthDiff * 3.1, -0.5, 0.5);
    const roll = THREE.MathUtils.clamp(tiltAngle * 0.52, -0.3, 0.3);

    const targetY = eyeMidY + eyeDist * 0.08 + (noseTip.y - eyeMidY) * 0.08;

    group.visible = true;

    targetPosition.current.set(centerX, targetY, 0);
    smoothedPosition.current.lerp(targetPosition.current, 0.2);
    smoothedScale.current = THREE.MathUtils.lerp(smoothedScale.current, targetScale, 0.2);

    group.position.copy(smoothedPosition.current);
    group.scale.setScalar(smoothedScale.current);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pitch, 0.18);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, yaw, 0.18);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, roll, 0.18);
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
