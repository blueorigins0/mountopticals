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
  const smoothedScale = useRef(1);

  const { normalizedScene, baseModelWidth } = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    cloned.position.sub(center);

    const computedWidth = Math.max(size.x, size.y * 0.82, 0.001);

    return {
      normalizedScene: cloned,
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

    const targetWidth = eyeDist * 2.05;
    const targetScale = THREE.MathUtils.clamp(targetWidth / baseModelWidth, 0.01, 1000);

    const tiltAngle = Math.atan2(
      rightEyeOuter.y - leftEyeOuter.y,
      rightEyeOuter.x - leftEyeOuter.x
    );

    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    const pitch = THREE.MathUtils.clamp((noseBridge.y - eyeMidY) / eyeDist, -0.65, 0.65) * 2;

    const rawDepthDiff = (landmarks[263].z ?? 0) - (landmarks[33].z ?? 0);
    const yaw = THREE.MathUtils.clamp(rawDepthDiff * 6, -0.9, 0.9);

    group.visible = true;

    smoothedPosition.current.lerp(new THREE.Vector3(centerX, centerY, 0), 0.32);
    smoothedScale.current = THREE.MathUtils.lerp(smoothedScale.current, targetScale, 0.32);

    group.position.copy(smoothedPosition.current);
    group.scale.setScalar(smoothedScale.current);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pitch, 0.28);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, yaw, 0.28);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -tiltAngle, 0.28);
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
