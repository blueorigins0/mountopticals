import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    images?: string[] | null;
    guest_price: number;
    retail_price: number;
    shop_price: number;
    regular_price: number;
  };
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className = "" }: ProductCardProps) {
  const { user, role } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const buyerType: "guest" | "shop" | "retail" = !user ? "guest" : role === "shop" ? "shop" : role === "retail" ? "retail" : "guest";

  const getDisplayPrice = () => {
    if (buyerType === "shop") return product.shop_price;
    if (buyerType === "retail") return product.retail_price;
    return product.guest_price;
  };

  const getMrp = () => product.regular_price > 0 ? product.regular_price : product.guest_price;

  const price = getDisplayPrice();
  const mrp = getMrp();
  const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const getPriceLabel = () => {
    if (buyerType === "shop") return "Wholesaler";
    if (buyerType === "retail") return "Retailer";
    return null;
  };

  const label = getPriceLabel();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = await addToCart(product.id, 1);
    if (added) navigate("/checkout");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={className}
    >
      <Link to={`/product/${product.slug}`} className="group block h-full">
        <div className="bg-white rounded-[5px] border border-border overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all duration-300 h-full flex flex-col relative">
          {/* Image */}
          <div className="relative aspect-[700/394] overflow-hidden bg-[#f5f5f5]">
            <img
              src={product.images?.[0] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Content */}
          <div className="px-3 pb-3 pt-2 flex flex-col flex-grow">
            {/* Rating badge */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-0.5 bg-[#388e3c] text-white text-[11px] font-bold px-1.5 py-[2px] rounded-sm shadow-sm">
                4.8 <Star className="h-2.5 w-2.5 fill-current" />
              </span>
              <span className="text-[11px] text-muted-foreground">(48 Reviews)</span>
            </div>

            {/* Title */}
            <h3 className="text-foreground text-[13px] sm:text-sm line-clamp-2 mb-1.5 leading-snug font-normal">
              {product.name}
            </h3>

            {/* Price */}
            <div className="mt-auto">
              {label && (
                <span className="text-[9px] sm:text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded mb-1 inline-block">
                  {label} Price
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-base sm:text-lg font-bold text-foreground">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    ₹{mrp.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-[#388e3c]">
                    {discount}% OFF
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hover overlay with Add to Cart + Buy Now */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-3 py-2.5 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-full group-hover:translate-y-0">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center w-10 h-9 border border-border rounded hover:bg-secondary transition-colors"
            >
              <ShoppingCart className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 h-9 bg-[#f97015] hover:bg-[#e86510] text-white text-xs font-bold rounded transition-colors uppercase tracking-wide"
            >
              Buy Now
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
