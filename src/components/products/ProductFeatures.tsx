import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AttributeValue {
  id: string;
  label: string;
  value_text: string;
  value_image: string | null;
  sort_order: number;
  show_on_page: boolean;
  attribute_type: { name: string } | null;
}

interface ProductFeaturesProps {
  productId: string;
  categoryName?: string | null;
  selectedColor?: string | null;
  currentMoq: number;
}

export function ProductFeatures({ productId, categoryName, selectedColor, currentMoq }: ProductFeaturesProps) {
  const [attributes, setAttributes] = useState<AttributeValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("product_attribute_values")
        .select("*, attribute_type:product_attribute_types(name)")
        .eq("product_id", productId)
        .eq("show_on_page", true)
        .order("sort_order");
      
      setAttributes((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [productId]);

  if (loading) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">FEATURES</p>
      </div>
      <div className="border border-border rounded-lg overflow-hidden text-xs">
        {/* Dynamic attributes from DB */}
        {attributes.map((attr, idx) => (
          <div key={attr.id} className={`grid grid-cols-2 divide-x divide-border ${idx > 0 ? "border-t border-border" : ""}`}>
            <div className="p-2.5 bg-secondary/30">
              <span className="text-muted-foreground">{attr.label}</span>
            </div>
            <div className="p-2.5">
              <span className="font-medium text-foreground">{attr.value_text}</span>
            </div>
          </div>
        ))}
        {/* Static fallback rows */}
        {attributes.length === 0 && (
          <>
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="p-2.5 bg-secondary/30">
                <span className="text-muted-foreground">Type of Product</span>
              </div>
              <div className="p-2.5">
                <span className="font-medium text-foreground">{categoryName || "Product"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
              <div className="p-2.5 bg-secondary/30">
                <span className="text-muted-foreground">Color</span>
              </div>
              <div className="p-2.5">
                <span className="font-medium text-foreground">{selectedColor || "Standard"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
              <div className="p-2.5 bg-secondary/30">
                <span className="text-muted-foreground">MOQ</span>
              </div>
              <div className="p-2.5">
                <span className="font-medium text-foreground">{currentMoq} units</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
