import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface FaceTracker3DProps {
  modelUrl: string;
  landmarksRef: React.MutableRefObject<any[] | null>;
  canvasWidth: number;
  canvasHeight: number;
}

function TrackedGlasses({
  modelUrl,
  landmarksRef,
  canvasWidth,
  canvasHeight,
}: FaceTracker3DProps) {
  const { scene } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const lm = landmarksRef.current;
    if (!lm || !groupRef.current || !canvasWidth) return;

    // MediaPipe landmarks are in un-mirrored normalized coords
    // Canvas shows mirrored video, so swap left/right semantic points
    const leftEyeOuter = lm[33];
    const rightEyeOuter = lm[263];
    const noseBridge = lm[168];

    // Convert to mirrored canvas pixel coords
    const lx = (1 - rightEyeOuter.x) * canvasWidth;
    const ly = rightEyeOuter.y * canvasHeight;
    const rx = (1 - leftEyeOuter.x) * canvasWidth;
    const ry = leftEyeOuter.y * canvasHeight;

    // Center between eyes → orthographic coords (origin = canvas center)
    const cx = (lx + rx) / 2 - canvasWidth / 2;
    const cy = -((ly + ry) / 2 - canvasHeight / 2);

    const eyeDist = Math.hypot(rx - lx, ry - ly);
    const scale = eyeDist / 55;

    const tiltAngle = Math.atan2(ry - ly, rx - lx);

    groupRef.current.position.set(cx, cy, 0);
    groupRef.current.scale.setScalar(scale);
    groupRef.current.rotation.z = -tiltAngle;

    // Face pitch (looking up/down)
    const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
    groupRef.current.rotation.x = (noseBridge.y - eyeMidY) * 4;

    // Face yaw (looking left/right)
    const depthDiff = rightEyeOuter.z - leftEyeOuter.z;
    groupRef.current.rotation.y = depthDiff * 5;
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
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
  canvasWidth,
  canvasHeight,
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
      <ambientLight intensity={1.2} />
      <directionalLight position={[0, 5, 5]} intensity={0.6} />
      <directionalLight position={[-3, 2, -3]} intensity={0.3} />
      <TrackedGlasses
        modelUrl={modelUrl}
        landmarksRef={landmarksRef}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    </Canvas>
  );
}
