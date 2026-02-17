import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Tabs moved to ProductTabs component
import { 
  FileText, Truck, Shield, Minus, Plus, Check, 
  Package, Clock, Phone, MessageCircle, Factory, 
  Award, ChevronRight, ShoppingCart, Star, Zap, CheckCircle2, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useRFQCart } from "@/hooks/useRFQCart";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { RecentProducts } from "@/components/products/RecentProducts";
import { ProductOffers } from "@/components/products/ProductOffers";
import { ProductAttributes } from "@/components/products/ProductAttributes";
import { ProductFeatures } from "@/components/products/ProductFeatures";
import { ProductTabs } from "@/components/products/ProductTabs";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";

interface ProductVariation {
  id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  color_image: string | null;
  shop_price: number;
  retail_price: number;
  shop_moq: number | null;
  retail_moq: number | null;
  stock_quantity: number | null;
  weight: number | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  images: string[] | null;
  guest_price: number;
  shop_price: number;
  retail_price: number;
  regular_price: number;
  shop_moq: number;
  retail_moq: number;
  gst_percentage: number | null;
  stock_quantity: number | null;
  features: string[] | null;
  has_variations: boolean | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  category_id: string | null;
  category: { name: string } | null;
  brand: { name: string } | null;
  sku: string | null;
}

function DeliveryChecker() {
  const [pincode, setPincode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ delivery_days: number; city: string | null; state: string | null; is_cod_available: boolean | null } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleCheck = async () => {
    if (!pincode || pincode.length < 4) return;
    setChecking(true);
    setResult(null);
    setNotFound(false);
    const { data } = await supabase.from("delivery_pincodes").select("delivery_days, city, state, is_cod_available").eq("pincode", pincode).eq("is_active", true).maybeSingle();
    if (data) {
      setResult(data);
    } else {
      setNotFound(true);
    }
    setChecking(false);
  };

  const deliveryDate = result ? new Date(Date.now() + result.delivery_days * 86400000) : null;

  return (
    <div className="pt-3 border-t border-border">
      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-destructive" />
        Check Delivery Details
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Enter Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-9 text-xs flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
        />
        <Button size="sm" className="h-9 text-xs px-4 bg-accent hover:bg-accent-hover" onClick={handleCheck} disabled={checking}>
          {checking ? "..." : "Check"}
        </Button>
      </div>
      {result && (
        <div className="mt-2 p-2.5 rounded-lg bg-success/5 border border-success/20 space-y-1">
          <p className="text-xs font-medium text-success flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Delivery available
            {result.city && <span className="text-muted-foreground font-normal">to {result.city}{result.state ? `, ${result.state}` : ""}</span>}
          </p>
          <p className="text-xs text-foreground">
            Estimated delivery by <span className="font-semibold">{deliveryDate?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
            <span className="text-muted-foreground"> ({result.delivery_days} days)</span>
          </p>
          {result.is_cod_available && <p className="text-[10px] text-success">✓ Cash on Delivery available</p>}
        </div>
      )}
      {notFound && (
        <p className="mt-2 text-xs text-destructive">Delivery not available for this pincode. Please try another.</p>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToRFQCart } = useRFQCart();
  const { user, role } = useAuth();
  const { addToCart } = useCart();
  const [isAddingToRFQ, setIsAddingToRFQ] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Role-based pricing logic
  const buyerType: "guest" | "shop" | "retail" = !user ? "guest" : role === "shop" ? "shop" : "retail";

  const getRolePrice = (p: Product | null, v: ProductVariation | null | undefined) => {
    if (buyerType === "shop") return v?.shop_price ?? p?.shop_price ?? 0;
    if (buyerType === "retail") return v?.retail_price ?? p?.retail_price ?? 0;
    return (v as any)?.guest_price ?? p?.guest_price ?? p?.retail_price ?? 0;
  };

  const getRoleMoq = (p: Product | null, v: ProductVariation | null | undefined) => {
    if (buyerType === "guest") return 1;
    if (buyerType === "shop") return v?.shop_moq ?? p?.shop_moq ?? 1;
    return v?.retail_moq ?? p?.retail_moq ?? 1;
  };

  const getMrp = (p: Product | null, v: ProductVariation | null | undefined) => {
    // MRP is the regular_price, fallback to guest_price
    const regularPrice = (p as any)?.regular_price ?? 0;
    return regularPrice > 0 ? regularPrice : ((v as any)?.guest_price ?? p?.guest_price ?? p?.retail_price ?? 0);
  };

  const getPriceLabel = () => {
    if (buyerType === "shop") return "Wholesaler Price";
    if (buyerType === "retail") return "Retailer Price";
    return null;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`*, category:categories(name), brand:brands(name)`)
        .eq("slug", id)
        .maybeSingle();

      if (productError || !productData) {
        const { data: productById } = await supabase
          .from("products")
          .select(`*, category:categories(name), brand:brands(name)`)
          .eq("id", id)
          .maybeSingle();
        
        if (productById) {
          setProduct(productById as unknown as Product);
          if (productById.images?.[0]) setSelectedImage(productById.images[0]);
          setQuantity(buyerType === "shop" ? (productById.shop_moq || 1) : buyerType === "guest" ? 1 : (productById.retail_moq || 1));
          
          if (productById.has_variations) {
            const { data: vars } = await supabase
              .from("product_variations")
              .select("*")
              .eq("product_id", productById.id)
              .eq("is_active", true);
            setVariations(vars || []);
          }
        }
      } else {
        setProduct(productData as unknown as Product);
        if (productData.images?.[0]) setSelectedImage(productData.images[0]);
        setQuantity(buyerType === "shop" ? (productData.shop_moq || 1) : buyerType === "guest" ? 1 : (productData.retail_moq || 1));
        
        if (productData.has_variations) {
          const { data: vars } = await supabase
            .from("product_variations")
            .select("*")
            .eq("product_id", productData.id)
            .eq("is_active", true);
          setVariations(vars || []);
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const { uniqueSizes, uniqueColors, colorImageMap } = useMemo(() => {
    const sizes = [...new Set(variations.map(v => v.size).filter(Boolean))] as string[];
    const colors = [...new Set(variations.map(v => v.color).filter(Boolean))] as string[];
    const imageMap: Record<string, string> = {};
    variations.forEach(v => {
      if (v.color && v.color_image) {
        imageMap[v.color] = v.color_image;
      }
    });
    return { uniqueSizes: sizes, uniqueColors: colors, colorImageMap: imageMap };
  }, [variations]);

  const selectedVariation = useMemo(() => {
    if (!product?.has_variations || variations.length === 0) return null;
    if (selectedVariationId) {
      return variations.find(v => v.id === selectedVariationId);
    }
    return variations.find(v => 
      (!selectedSize || v.size === selectedSize) && 
      (!selectedColor || v.color === selectedColor)
    );
  }, [variations, selectedSize, selectedColor, selectedVariationId, product]);

  const currentMoq = getRoleMoq(product, selectedVariation);
  const currentPrice = getRolePrice(product, selectedVariation);
  const currentMrp = getMrp(product, selectedVariation);
  const gstPercent = product?.gst_percentage ?? 18;
  const currentStock = selectedVariation?.stock_quantity ?? product?.stock_quantity ?? 0;
  const moqValid = quantity >= currentMoq;

  const handleAddToRFQ = async () => {
    if (!product) return;
    setIsAddingToRFQ(true);
    try {
      await addToRFQCart(product.id, quantity, selectedVariation?.id);
    } finally {
      setIsAddingToRFQ(false);
    }
  };

  const handleAddToCartClick = async () => {
    if (!product || !moqValid) return;
    setIsAddingToCart(true);
    try {
      const success = await addToCart(product.id, quantity, selectedVariation?.id);
      return success;
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || !moqValid) return;
    const success = await handleAddToCartClick();
    if (success) {
      window.location.href = "/checkout";
    }
  };

  useEffect(() => {
    if (selectedColor && colorImageMap[selectedColor]) {
      setSelectedImage(colorImageMap[selectedColor]);
    }
  }, [selectedColor, colorImageMap]);

  useEffect(() => {
    if (uniqueSizes.length > 0 && !selectedSize) {
      setSelectedSize(uniqueSizes[0]);
    }
    if (uniqueColors.length > 0 && !selectedColor) {
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueSizes, uniqueColors, selectedSize, selectedColor]);

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= Math.max(currentStock, 9999)) {
      setQuantity(newQty);
    }
  };

  const handleWhatsAppClick = () => {
    if (!product) return;
    const url = `${window.location.origin}/product/${product.slug}`;
    const message = encodeURIComponent(
      `Hi, I'm interested in:\n\n*${product.name}*\nQuantity: ${quantity}\n${selectedVariation ? `Variation: ${selectedSize || ""} ${selectedColor || ""}` : ""}\n\n${url}\n\nPlease provide pricing and availability.`
    );
    window.open(`https://wa.me/917551120242?text=${message}`, "_blank");
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariationId(variantId);
    const variant = variations.find(v => v.id === variantId);
    if (variant) {
      if (variant.size) setSelectedSize(variant.size);
      if (variant.color) setSelectedColor(variant.color);
      if (variant.color_image) setSelectedImage(variant.color_image);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-5">
                <Skeleton className="aspect-square rounded-lg" />
              </div>
              <div className="md:col-span-7 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product not found</h1>
            <Link to="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const productImages = product.images?.length ? product.images : ["/placeholder.svg"];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${product.name} - Buy Online`}
        description={product.short_description || product.description?.substring(0, 160) || `Buy ${product.name} at best prices on VendorHub.`}
      />
      <Header />
      
      <main className="pt-2">
        <div className="container mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/products" className="hover:text-accent transition-colors">Products</Link>
            {product.category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link to={`/products?category=${product.category.name.toLowerCase()}`} className="hover:text-accent transition-colors">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>

          {/* Main Product Section */}
          <div className="grid md:grid-cols-12 gap-6">
            {/* Left: Image Gallery */}
            <div className="md:col-span-4">
              <div className="md:sticky md:top-32 space-y-3">
                {/* Main Image */}
                <div className="relative bg-card rounded-lg overflow-hidden border border-border">
                  <img
                    src={selectedImage || productImages[0]}
                    alt={product.name}
                    className="w-full aspect-square object-contain"
                  />
                  
                </div>

                {/* Thumbnail Gallery */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={cn(
                        "flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                        selectedImage === img 
                          ? "border-accent" 
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Product Info */}
            <div className="md:col-span-5 space-y-4">
              {/* Title & Meta */}
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground leading-tight mb-2">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  {product.sku && <span>SKU: {product.sku}</span>}
                  {product.brand && (
                    <>
                      <span>•</span>
                      <span>Brand: <span className="text-foreground font-medium">{product.brand.name}</span></span>
                    </>
                  )}
                </div>

                {/* Price + Rating in same row */}
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    {getPriceLabel() && (
                      <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded mb-1 inline-block">
                        {getPriceLabel()}
                      </span>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">₹{currentPrice.toLocaleString("en-IN")}</span>
                      {currentMrp > currentPrice && (
                        <>
                          <span className="text-sm text-muted-foreground line-through">₹{currentMrp.toLocaleString("en-IN")}</span>
                          <span className="text-sm font-semibold text-success">
                            {Math.round(((currentMrp - currentPrice) / currentMrp) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="h-3.5 w-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">(32 ratings)</span>
                </div>
              </div>

              {/* Variant Selection */}
              {variations.length > 0 && (uniqueSizes.length > 0 || uniqueColors.length > 0) && (
                <div className="space-y-3 bg-secondary/30 rounded-lg p-3">
                  {/* Pack/Size Selection */}
                  {uniqueSizes.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">Pack of</p>
                      <div className="flex gap-2 flex-wrap">
                        {uniqueSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded border transition-all",
                              selectedSize === size
                                ? "border-accent bg-accent/10 text-accent font-medium"
                                : "border-border bg-card hover:border-accent/50"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size/Color Selection */}
                  {uniqueColors.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">Size</p>
                      <div className="flex gap-2 flex-wrap">
                        {uniqueColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded border transition-all",
                              selectedColor === color
                                ? "border-accent bg-accent/10 text-accent font-medium"
                                : "border-border bg-card hover:border-accent/50"
                            )}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="text-xs text-accent font-medium hover:underline">
                    Explore 10 more variations
                  </button>
                </div>
              )}

              {/* Available Offers - dynamic from DB */}
              <ProductOffers categoryId={product.category_id} />

              {/* Product Attributes (e.g. Frame Dimensions) */}
              <ProductAttributes productId={product.id} />

              {/* Features - Dynamic from DB attributes */}
              <ProductFeatures 
                productId={product.id} 
                categoryName={product.category?.name}
                selectedColor={selectedColor}
                currentMoq={currentMoq}
              />
            </div>

            {/* Right: Sticky Buy Box */}
            <div className="md:col-span-3">
              <div className="md:sticky md:top-32 space-y-3">
                {/* Price & Buy Box */}
                <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                  {/* Price Display */}
                  <div>
                    {getPriceLabel() && (
                      <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded mb-1 inline-block">
                        {getPriceLabel()}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ₹{Math.round(currentPrice * (1 + gstPercent / 100)).toLocaleString("en-IN")} <span className="text-xs">(Incl. of all taxes)</span>
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-foreground">
                        ₹{currentPrice.toLocaleString("en-IN")}
                      </p>
                      <span className="text-sm text-success font-medium">+{gstPercent}% GST</span>
                    </div>
                    {currentMrp > currentPrice && (
                      <p className="text-xs text-success font-medium mt-0.5">
                        You save ₹{(currentMrp - currentPrice).toLocaleString("en-IN")} ({Math.round(((currentMrp - currentPrice) / currentMrp) * 100)}% off)
                      </p>
                    )}
                  </div>

                  {/* Quantity Selector + MOQ */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-border rounded-full">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= currentMoq}
                        className="p-2 hover:bg-secondary rounded-l-full transition-colors disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="p-2 hover:bg-secondary rounded-r-full transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum Order<br />Quantity- {currentMoq}
                    </p>
                  </div>

                  {!moqValid && (
                    <p className="text-xs text-destructive font-medium">
                      Minimum order quantity for this product is {currentMoq} units
                    </p>
                  )}

                  {/* CTA Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="bg-accent hover:bg-accent-hover text-[10px] sm:text-xs font-bold h-8 sm:h-9 uppercase tracking-wide rounded-md px-2"
                      onClick={handleAddToCartClick}
                      disabled={isAddingToCart || !moqValid}
                    >
                      {isAddingToCart ? "Adding..." : "ADD TO CART"}
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-[10px] sm:text-xs font-bold h-8 sm:h-9 uppercase tracking-wide rounded-md px-2"
                      onClick={handleBuyNow}
                      disabled={isAddingToCart || !moqValid}
                    >
                      BUY NOW
                    </Button>
                  </div>

                  {/* Quick Actions Row */}
                  <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-lg">
                    <button
                      onClick={() => window.open("tel:+917551120242")}
                      className="flex flex-col items-center gap-1.5 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="text-[10px] text-center text-muted-foreground leading-tight">
                        Call us at<br />+91 7551120242
                      </span>
                    </button>
                    <button
                      onClick={handleWhatsAppClick}
                      className="flex flex-col items-center gap-1.5 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5 text-success" />
                      <span className="text-[10px] text-center text-muted-foreground leading-tight">
                        Buy on<br />Chat
                      </span>
                    </button>
                    <button
                      onClick={handleAddToRFQ}
                      className="flex flex-col items-center gap-1.5 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-accent" />
                      <span className="text-[10px] text-center text-muted-foreground leading-tight">
                        Ask for Bulk<br />Qty Quote
                      </span>
                    </button>
                  </div>

                  {/* Delivery Pincode Check */}
                  <DeliveryChecker />

                  {/* Returns + Shipping - desktop: icon left + text right; tablet: icon top + text bottom */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                    <div className="flex md:flex-row flex-col md:items-center items-center md:text-left text-center gap-1.5 md:gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/20">
                      <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">Returns</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">As per Brand / 7 days</p>
                      </div>
                    </div>
                    <div className="flex md:flex-row flex-col md:items-center items-center md:text-left text-center gap-1.5 md:gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/20">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">Shipping</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Free for bulk orders</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges Row - icon top, text bottom on mobile */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 bg-card rounded-lg border border-border p-4 mt-6">
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Shield className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-foreground leading-tight">Warranty as per brand</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-foreground leading-tight">100% Original</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Zap className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-foreground leading-tight">Secure payments</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Award className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-foreground leading-tight">Buyer protection</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Star className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-foreground leading-tight">Top Brands</span>
            </div>
          </div>

          {/* Related Products - 5 cols on tablet, 6 on desktop */}
          <RelatedProducts currentProductId={product.id} categoryId={product.category_id} />

          {/* Explore Other Variants Section */}
          {variations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                EXPLORE OTHER VARIANTS
              </h2>
              <div className="space-y-3">
                {variations.map((variant, idx) => (
                  <div
                    key={variant.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border transition-all",
                      selectedVariationId === variant.id
                        ? "border-accent bg-accent/5"
                        : "border-border bg-card hover:border-accent/50"
                    )}
                  >
                    {idx < 3 && (
                      <Badge className={cn(
                        "text-[10px] px-2 py-0.5 shrink-0",
                        idx === 0 ? "bg-success" : idx === 1 ? "bg-warning" : "bg-accent"
                      )}>
                        {idx === 0 ? "Best Value" : idx === 1 ? "Most Purchased" : "Popular"}
                      </Badge>
                    )}
                    <div className="w-16 h-16 rounded bg-secondary overflow-hidden flex-shrink-0">
                      {variant.color_image ? (
                        <img src={variant.color_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {product.name} {variant.size && `- ${variant.size}`} {variant.color && `(${variant.color})`}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        {variant.size && <span>Pack of: {variant.size}</span>}
                        {variant.color && <span>Size: {variant.color}</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        MOQ: {variant.shop_moq || currentMoq} | Stock: {variant.stock_quantity || 0}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-foreground">
                        ₹{getRolePrice(product, variant).toLocaleString("en-IN")}
                      </p>
                      {getMrp(product, variant) > getRolePrice(product, variant) && (
                        <p className="text-[10px] text-muted-foreground line-through">
                          ₹{getMrp(product, variant).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="text-xs h-8"
                        onClick={() => { handleVariantSelect(variant.id); handleAddToCartClick(); }}
                      >
                        Add to Cart
                      </Button>
                      <Button size="sm" className="text-xs h-8 bg-primary"
                        onClick={() => { handleVariantSelect(variant.id); handleBuyNow(); }}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specifications, Description, Reviews & Custom Tabs */}
          <ProductTabs
            product={product}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            currentMoq={currentMoq}
          />

          {/* Recent Products - below tabs */}
          <RecentProducts currentProductId={product.id} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
