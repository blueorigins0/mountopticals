import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, CameraOff, RotateCcw, ShoppingCart } from "lucide-react";
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
      } catch (err) {
        console.error("Failed to load face landmarker:", err);
        // Retry with CPU
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
        } catch (err2) {
          console.error("CPU fallback also failed:", err2);
          setModelLoading(false);
        }
      }
    };
    initFaceLandmarker();

    return () => {
      // Cleanup handled in stopCamera
    };
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
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Please allow camera permission to use AR Try-On.");
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

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Detect face landmarks
      const now = performance.now();
      if (now !== lastTime) {
        lastTime = now;
        try {
          const results = faceLandmarker.detectForVideo(video, now);

          if (results.faceLandmarks && results.faceLandmarks.length > 0 && glassesImgRef.current) {
            const landmarks = results.faceLandmarks[0];

            // Key landmarks for glasses placement
            // 33: left eye outer corner, 263: right eye outer corner
            // 159: left eye top, 145: left eye bottom
            // 386: right eye top, 374: right eye bottom
            // 168: nose bridge top (between eyes)
            const leftEyeOuter = landmarks[33];
            const rightEyeOuter = landmarks[263];
            const noseBridge = landmarks[168];
            const leftEyeTop = landmarks[159];
            const leftEyeBottom = landmarks[145];

            // Mirror the x coordinates since we flipped the video
            const lx = (1 - leftEyeOuter.x) * canvas.width;
            const rx = (1 - rightEyeOuter.x) * canvas.width;
            const ly = leftEyeOuter.y * canvas.height;
            const ry = rightEyeOuter.y * canvas.height;

            // Calculate glasses dimensions
            const eyeDistance = Math.sqrt((rx - lx) ** 2 + (ry - ly) ** 2);
            const glassesWidth = eyeDistance * 1.65; // Wider than eye distance
            const glassesHeight = glassesWidth * (glassesImgRef.current.height / glassesImgRef.current.width);

            // Center position
            const centerX = (lx + rx) / 2;
            const centerY = (ly + ry) / 2;

            // Rotation angle
            const angle = Math.atan2(ry - ly, rx - lx);

            // Draw glasses
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            ctx.drawImage(
              glassesImgRef.current,
              -glassesWidth / 2,
              -glassesHeight / 2 - glassesHeight * 0.05, // Slight upward offset
              glassesWidth,
              glassesHeight
            );
            ctx.restore();
          }
        } catch (e) {
          // Skip frame on error
        }
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    // Wait for video to be ready
    const onPlaying = () => {
      renderFrame();
    };

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product.id, 1);
  };

  const mrp = product?.regular_price && product.regular_price > 0 ? product.regular_price : product?.guest_price || 0;
  const price = product?.retail_price || 0;
  const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

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

      {/* Camera / AR View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
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
                  className="bg-accent hover:bg-accent-hover text-white font-bold px-8 py-3 rounded-full mt-2"
                >
                  <Camera className="h-5 w-5 mr-2" /> Start Try-On
                </Button>
              </>
            )}
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain ${cameraActive ? "block" : "hidden"}`}
        />

        {/* Side controls when camera active */}
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
                  <span className="text-xs font-semibold text-[#388e3c]">({discount}% OFF)</span>
                </>
              )}
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            className="bg-accent hover:bg-accent-hover text-white font-bold text-xs px-4 h-10 rounded-lg flex-shrink-0"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Add to Cart
          </Button>
        </div>
      )}
    </div>
  );
}
