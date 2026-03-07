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
    finalScene.position.y -= finalSize.y * 0.09;
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

    const leftEyeOuter = mapPointToCanvas(landmarks[33]);
    const rightEyeOuter = mapPointToCanvas(landmarks[263]);
    const noseBridge = mapPointToCanvas(landmarks[168]);

    const eyeDist = Math.max(
      1,
      Math.hypot(rightEyeOuter.x - leftEyeOuter.x, rightEyeOuter.y - leftEyeOuter.y)
    );

    const centerX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const centerY = (leftEyeOuter.y + rightEyeOuter.y) / 2;

    const targetWidth = eyeDist * 2.08;
    const targetScale = THREE.MathUtils.clamp(targetWidth / baseModelWidth, 0.01, 1000);

    const tiltAngle = Math.atan2(
      rightEyeOuter.y - leftEyeOuter.y,
      rightEyeOuter.x - leftEyeOuter.x
    );

    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    const bridgeRatio = THREE.MathUtils.clamp((noseBridge.y - eyeMidY) / eyeDist, -0.35, 0.35);
    const pitch = bridgeRatio * 1.15;

    const rawDepthDiff = (landmarks[263].z ?? 0) - (landmarks[33].z ?? 0);
    const yaw = THREE.MathUtils.clamp(-rawDepthDiff * 4.8, -0.65, 0.65);
    const roll = THREE.MathUtils.clamp(tiltAngle * 0.68, -0.42, 0.42);

    const targetY = centerY + eyeDist * 0.03;

    group.visible = true;

    targetPosition.current.set(centerX, targetY, 0);
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
