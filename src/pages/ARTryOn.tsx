import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, CameraOff, RotateCcw, ShoppingCart, ImageIcon, Video, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  guest_price: number;
  retail_price: number;
  regular_price: number;
}

type MediaTab = "tryon" | "photos" | "videos" | "360";

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const glassesImgRef = useRef<HTMLImageElement | null>(null);

  // Load product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, images, guest_price, retail_price, regular_price")
        .eq("id", productId)
        .maybeSingle();
      if (data) setProduct(data as Product);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  // Load glasses image
  useEffect(() => {
    if (!product?.images?.[0]) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = product.images[0];
    img.onload = () => {
      glassesImgRef.current = img;
    };
  }, [product]);

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
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
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
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

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
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
  }, []);

  // Render loop - FIXED: no double-mirror, glasses drawn correctly on mirrored video
  useEffect(() => {
    if (!cameraActive || !faceLandmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = -1;

    const renderFrame = () => {
      if (!video || video.paused || video.ended || !ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Mirror the entire canvas for selfie view
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      const now = performance.now();
      if (now !== lastTime) {
        lastTime = now;
        try {
          // Detect on UN-mirrored video feed
          const results = faceLandmarker.detectForVideo(video, now);

          if (results.faceLandmarks?.length && glassesImgRef.current) {
            const landmarks = results.faceLandmarks[0];

            // Landmarks are in un-mirrored space, so mirror the x
            const leftEyeOuter = landmarks[33];
            const rightEyeOuter = landmarks[263];

            // Mirror x coordinates to match the mirrored canvas
            const lx = (1 - leftEyeOuter.x) * canvas.width;
            const rx = (1 - rightEyeOuter.x) * canvas.width;
            const ly = leftEyeOuter.y * canvas.height;
            const ry = rightEyeOuter.y * canvas.height;

            const eyeDistance = Math.sqrt((rx - lx) ** 2 + (ry - ly) ** 2);
            const glassesWidth = eyeDistance * 1.6;

            // Use aspect ratio from original image but cap the height
            // For a front-view glasses image, use natural aspect ratio
            const naturalAspect = glassesImgRef.current.height / glassesImgRef.current.width;
            const glassesHeight = glassesWidth * Math.min(naturalAspect, 0.55);

            const centerX = (lx + rx) / 2;
            const centerY = (ly + ry) / 2;
            const angle = Math.atan2(ry - ly, rx - lx);

            // Draw glasses - mirror the image horizontally so it appears correct on mirrored video
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            // Flip glasses horizontally to match the mirrored video
            ctx.scale(-1, 1);
            ctx.drawImage(
              glassesImgRef.current,
              -glassesWidth / 2,
              -glassesHeight / 2 - glassesHeight * 0.08,
              glassesWidth,
              glassesHeight
            );
            ctx.restore();
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
  }, [cameraActive, faceLandmarker]);

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

  const tabs: { key: MediaTab; label: string; icon: React.ReactNode }[] = [
    { key: "tryon", label: "Try On", icon: <Camera className="h-4 w-4" /> },
    { key: "photos", label: "Photos", icon: <ImageIcon className="h-4 w-4" /> },
    { key: "videos", label: "Videos", icon: <Video className="h-4 w-4" /> },
    { key: "360", label: "360°", icon: <RotateCw className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-white font-semibold text-sm">3D Try On</h1>
        <div className="w-9" />
      </div>

      {/* Media Tabs */}
      <div className="flex items-center justify-center gap-1 px-4 py-2 bg-black/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "tryon" && cameraActive) stopCamera();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-black"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {activeTab === "tryon" && (
          <>
            {!cameraActive && (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                {modelLoading ? (
                  <>
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white/70 text-sm">Loading AR Model...</p>
                  </>
                ) : cameraError ? (
                  <>
                    <CameraOff className="h-16 w-16 text-white/40" />
                    <p className="text-white/70 text-sm">{cameraError}</p>
                    <Button onClick={startCamera} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                      <RotateCcw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-white/60" />
                    </div>
                    <p className="text-white text-lg font-semibold">Virtual Try-On</p>
                    <p className="text-white/60 text-sm max-w-xs">
                      See how this eyewear looks on you using your camera
                    </p>
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
              className={`w-full h-full object-contain ${cameraActive ? "block" : "hidden"}`}
            />

            {cameraActive && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                <button
                  onClick={stopCamera}
                  className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/20"
                >
                  <CameraOff className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "photos" && (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            {product?.images?.length ? (
              <div className="grid grid-cols-2 gap-2 p-4 max-w-md">
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
        <div className="bg-white rounded-t-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-20 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
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
            className="bg-accent hover:bg-accent/90 text-white font-bold text-xs px-4 h-10 rounded-lg flex-shrink-0"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Add to Cart
          </Button>
        </div>
      )}
    </div>
  );
}
