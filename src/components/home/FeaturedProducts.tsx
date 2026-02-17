import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/products/ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  guest_price: number;
  retail_price: number;
  shop_price: number;
  regular_price: number;
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, images, guest_price, retail_price, shop_price, regular_price")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      
      setProducts(data as unknown as Product[] || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-6 sm:py-8 bg-secondary/30">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground">
              Featured Products
            </h2>
            
          </div>
          <Link to="/products" className="text-accent font-medium text-sm hover:underline flex items-center gap-1">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(16.666%-10px)] space-y-2">
                <Skeleton className="aspect-square rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-2">No Products Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Products will appear here once added</p>
            <Link to="/products">
              <Button className="bg-accent hover:bg-accent-hover text-sm">Browse Products</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
