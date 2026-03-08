import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  RotateCcw,
  ShoppingCart,
  ImageIcon,
  Video,
  RotateCw,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { TrackingFrameMetrics } from "@/components/ar/FaceTracker3D";

const FaceTracker3D = lazy(() => import("@/components/ar/FaceTracker3D"));

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  guest_price: number;
  retail_price: number;
  regular_price: number;
  ar_image: string | null;
  ar_model_url: string | null;
}

type MediaTab = "tryon" | "photos" | "videos" | "360";
type ModelRenderStatus = "idle" | "checking" | "ready" | "failed";

export default function ARTryOn() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MediaTab>("tryon");
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });
  const [modelRenderStatus, setModelRenderStatus] = useState<ModelRenderStatus>("idle");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tryOnStageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const glassesImgRef = useRef<HTMLImageElement | null>(null);
  const landmarksRef = useRef<any[] | null>(null);
  const frameMetricsRef = useRef<TrackingFrameMetrics | null>(null);
  const overlayStateRef = useRef({ x: 0, y: 0, width: 0, angle: 0, initialized: false });

  const has3DModel = !!product?.ar_model_url;
  const use3DOverlay = has3DModel && modelRenderStatus === "ready";
  const use2DOverlay = !use3DOverlay;

  // Load product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, images, guest_price, retail_price, regular_price, ar_image, ar_model_url")
        .eq("id", productId)
        .maybeSingle();
      if (data) setProduct(data as unknown as Product);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  // Load glasses image for 2D overlay (fallback when 3D is not available)
  useEffect(() => {
    if (!use2DOverlay) {
      glassesImgRef.current = null;
      overlayStateRef.current.initialized = false;
      return;
    }

    const arSrc = product?.ar_image || product?.images?.[0];
    if (!arSrc) {
      glassesImgRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = arSrc;
    img.onload = () => {
      glassesImgRef.current = img;
    };
  }, [product, use2DOverlay]);

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        setFaceLandmarker(landmarker);
        setModelLoading(false);
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
          );
          const landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          });
          setFaceLandmarker(landmarker);
          setModelLoading(false);
        } catch {
          setModelLoading(false);
        }
      }
    };
    initFaceLandmarker();
  }, []);

  // Validate GLB/GLTF URL and fallback to 2D when URL is invalid/inaccessible
  useEffect(() => {
    let isMounted = true;

    const verifyModelUrl = async () => {
      const modelUrl = product?.ar_model_url;

      if (!modelUrl) {
        if (isMounted) setModelRenderStatus("idle");
        return;
      }

      if (isMounted) setModelRenderStatus("checking");

      try {
        const response = await fetch(modelUrl, { method: "GET" });
        const contentType = (response.headers.get("content-type") || "").toLowerCase();
        const lowerUrl = modelUrl.toLowerCase();

        const looksLikeModel =
          lowerUrl.endsWith(".glb") ||
          lowerUrl.endsWith(".gltf") ||
          contentType.includes("model/gltf-binary") ||
          contentType.includes("model/gltf+json") ||
          contentType.includes("application/octet-stream") ||
          contentType.includes("binary/octet-stream");

        if (!isMounted) return;
        setModelRenderStatus(response.ok && looksLikeModel ? "ready" : "failed");
      } catch {
        if (isMounted) setModelRenderStatus("failed");
      }
    };

    verifyModelUrl();

    return () => {
      isMounted = false;
    };
  }, [product?.ar_model_url]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 960 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 3 / 4 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera permission.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    landmarksRef.current = null;
    frameMetricsRef.current = null;
    overlayStateRef.current.initialized = false;
    setVideoDims({ w: 0, h: 0 });
  }, []);

  // Render loop
  useEffect(() => {
    if (!cameraActive || !faceLandmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = -1;

    const renderFrame = () => {
      if (!video || video.paused || video.ended || !ctx) return;
      if (!video.videoWidth || !video.videoHeight) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const stageWidth = tryOnStageRef.current?.clientWidth || video.videoWidth;
      const stageHeight = tryOnStageRef.current?.clientHeight || video.videoHeight;

      if (!stageWidth || !stageHeight) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      if (canvas.width !== stageWidth || canvas.height !== stageHeight) {
        canvas.width = stageWidth;
        canvas.height = stageHeight;
      }

      setVideoDims((prev) =>
        prev.w !== stageWidth || prev.h !== stageHeight
          ? { w: stageWidth, h: stageHeight }
          : prev
      );

      const drawScale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight) * 1.12;
      const drawWidth = video.videoWidth * drawScale;
      const drawHeight = video.videoHeight * drawScale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;

      frameMetricsRef.current = {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        drawScale,
        offsetX,
        offsetY,
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();

      const now = performance.now();
      if (now !== lastTime) {
        lastTime = now;

        try {
          const results = faceLandmarker.detectForVideo(video, now);

          if (results.faceLandmarks?.length) {
            const landmarks = results.faceLandmarks[0];
            landmarksRef.current = landmarks;

            if (use2DOverlay && glassesImgRef.current) {
              const mapPointToCanvas = (point: { x: number; y: number }) => ({
                x: (1 - point.x) * video.videoWidth * drawScale + offsetX,
                y: point.y * video.videoHeight * drawScale + offsetY,
              });

              const leftEyeSource = landmarks[33];
              const rightEyeSource = landmarks[263];

              if (leftEyeSource && rightEyeSource) {
                const leftTempleSource = landmarks[127] ?? leftEyeSource;
                const rightTempleSource = landmarks[356] ?? rightEyeSource;
                const noseTipSource = landmarks[6] ?? landmarks[1] ?? landmarks[168] ?? leftEyeSource;

                const leftEyeOuter = mapPointToCanvas(leftEyeSource);
                const rightEyeOuter = mapPointToCanvas(rightEyeSource);
                const leftTemple = mapPointToCanvas(leftTempleSource);
                const rightTemple = mapPointToCanvas(rightTempleSource);
                const noseTip = mapPointToCanvas(noseTipSource);

                const eyeDistance = Math.hypot(
                  rightEyeOuter.x - leftEyeOuter.x,
                  rightEyeOuter.y - leftEyeOuter.y
                );

                const frameDistance = Math.hypot(
                  rightTemple.x - leftTemple.x,
                  rightTemple.y - leftTemple.y
                );

                const hasArImage = !!product?.ar_image;
                const targetWidth = Math.max(
                  eyeDistance * (hasArImage ? 1.9 : 1.6),
                  frameDistance * (hasArImage ? 1.02 : 0.9)
                );

                const naturalAspect = glassesImgRef.current.height / glassesImgRef.current.width;
                const aspectRatio = hasArImage ? naturalAspect : Math.min(naturalAspect, 0.42);

                const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
                const noseDrop = Math.max(0, noseTip.y - eyeMidY);
                const depthDiff = (landmarks[263]?.z ?? 0) - (landmarks[33]?.z ?? 0);
                const horizontalShift = Math.max(
                  -eyeDistance * 0.2,
                  Math.min(eyeDistance * 0.2, -depthDiff * eyeDistance * 0.95)
                );

                const targetCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2 + horizontalShift;
                const targetCenterY = eyeMidY + eyeDistance * 0.075 + noseDrop * 0.14;

                const rawAngle = Math.atan2(
                  rightEyeOuter.y - leftEyeOuter.y,
                  rightEyeOuter.x - leftEyeOuter.x
                );
                let normalizedAngle = rawAngle;
                if (normalizedAngle > Math.PI / 2) normalizedAngle -= Math.PI;
                if (normalizedAngle < -Math.PI / 2) normalizedAngle += Math.PI;
                const targetAngle = normalizedAngle * 0.42;

                const overlayState = overlayStateRef.current;
                if (!overlayState.initialized) {
                  overlayState.x = targetCenterX;
                  overlayState.y = targetCenterY;
                  overlayState.width = targetWidth;
                  overlayState.angle = targetAngle;
                  overlayState.initialized = true;
                } else {
                  overlayState.x += (targetCenterX - overlayState.x) * 0.22;
                  overlayState.y += (targetCenterY - overlayState.y) * 0.22;
                  overlayState.width += (targetWidth - overlayState.width) * 0.22;
                  overlayState.angle += (targetAngle - overlayState.angle) * 0.22;
                }

                const renderHeight = overlayState.width * aspectRatio;

                ctx.save();
                ctx.translate(overlayState.x, overlayState.y);
                ctx.rotate(overlayState.angle);
                ctx.drawImage(
                  glassesImgRef.current,
                  -overlayState.width / 2,
                  -renderHeight / 2 - renderHeight * 0.02,
                  overlayState.width,
                  renderHeight
                );
                ctx.restore();
              }
            }
          } else {
            landmarksRef.current = null;
            overlayStateRef.current.initialized = false;
          }
        } catch {
          // Skip frame
        }
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    const onPlaying = () => renderFrame();

    if (video.readyState >= 2) {
      renderFrame();
    } else {
      video.addEventListener("playing", onPlaying, { once: true });
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
      video.removeEventListener("playing", onPlaying);
    };
  }, [cameraActive, faceLandmarker, use2DOverlay, product?.ar_image]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, 1);
  };

  const mrp = product?.regular_price && product.regular_price > 0 ? product.regular_price : product?.guest_price || 0;
  const price = product?.retail_price || 0;
  const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const tabs: { key: MediaTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "photos", label: "Photos", icon: ImageIcon },
    { key: "videos", label: "Videos", icon: Video },
    { key: "360", label: "360 View", icon: RotateCw },
    { key: "tryon", label: "3D Try On", icon: Camera },
  ];

  return (
    <div className="h-[100dvh] bg-black relative overflow-hidden">
      {/* Floating top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white">
            <Heart className="h-5 w-5" />
          </button>
          <button
            onClick={handleAddToCart}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 overflow-hidden">
        {activeTab === "tryon" && (
          <div ref={tryOnStageRef} className="absolute inset-0">
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6 z-10">
                {modelLoading ? (
                  <>
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white/70 text-sm">Loading AR Model...</p>
                  </>
                ) : cameraError ? (
                  <>
                    <CameraOff className="h-16 w-16 text-white/40" />
                    <p className="text-white/70 text-sm">{cameraError}</p>
                    <Button
                      onClick={startCamera}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-white/60" />
                    </div>
                    <p className="text-white text-lg font-semibold">3D Try On</p>
                    <p className="text-white/60 text-sm max-w-xs">
                      See how this eyewear looks on you using your camera
                    </p>
                    {has3DModel && modelRenderStatus === "failed" && (
                      <p className="text-white/60 text-xs max-w-xs">
                        3D model URL inaccessible hai, isliye fallback try-on use hoga.
                      </p>
                    )}
                    <Button
                      onClick={startCamera}
                      className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-3 rounded-full mt-2"
                    >
                      <Camera className="h-5 w-5 mr-2" /> Start Try-On
                    </Button>
                  </>
                )}
              </div>
            )}

            <video ref={videoRef} playsInline muted className="hidden" />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />

            {/* 3D GLB overlay on camera feed */}
            {cameraActive && use3DOverlay && videoDims.w > 0 && (
              <Suspense fallback={null}>
                <FaceTracker3D
                  modelUrl={product!.ar_model_url!}
                  landmarksRef={landmarksRef}
                  frameMetricsRef={frameMetricsRef}
                  canvasWidth={videoDims.w}
                  canvasHeight={videoDims.h}
                  onModelLoaded={() => setModelRenderStatus("ready")}
                />
              </Suspense>
            )}

            {/* Camera controls */}
            {cameraActive && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                <button
                  onClick={stopCamera}
                  className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/20"
                >
                  <CameraOff className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "photos" && (
          <div className="flex flex-col items-center gap-4 text-center px-6 w-full pt-24 pb-52">
            {product?.images?.length ? (
              <div className="grid grid-cols-2 gap-2 p-4 max-w-md w-full">
                {product.images.map((img, i) => (
                  <div key={i} className="bg-white/10 rounded-lg overflow-hidden aspect-square">
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ImageIcon className="h-16 w-16 text-white/30" />
                <p className="text-white/60 text-sm">No photos available</p>
              </>
            )}
          </div>
        )}

        {activeTab === "videos" && (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <Video className="h-16 w-16 text-white/30" />
            <p className="text-white/60 text-sm">No videos available</p>
          </div>
        )}

        {activeTab === "360" && (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <RotateCw className="h-16 w-16 text-white/30" />
            <p className="text-white/60 text-sm">360° view coming soon</p>
          </div>
        )}
      </div>

      {/* Bottom product card */}
      {product && (
        <div className="bg-white p-3 flex items-center gap-3">
          <div className="w-20 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={product.images?.[0] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-foreground">₹{price.toLocaleString("en-IN")}</span>
              {discount > 0 && (
                <>
                  <span className="text-xs text-muted-foreground line-through">₹{mrp.toLocaleString("en-IN")}</span>
                  <span className="text-xs font-semibold text-[hsl(var(--accent))]">({discount}% OFF)</span>
                </>
              )}
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            className="bg-accent hover:bg-accent/90 text-white font-bold text-xs px-4 h-9 rounded-lg flex-shrink-0"
          >
            Add to Cart
          </Button>
        </div>
      )}

      {/* Bottom tabs - Lenskart style */}
      <div className="bg-gray-900 flex items-center justify-around py-1.5 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== "tryon" && cameraActive) stopCamera();
              }}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
                activeTab === tab.key
                  ? "bg-white/15 text-white"
                  : "text-white/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
