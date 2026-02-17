import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AttributeValue {
  id: string;
  label: string;
  value_text: string;
  value_image: string | null;
  sort_order: number;
  attribute_type: { name: string } | null;
}

interface ProductAttributesProps {
  productId: string;
}

export function ProductAttributes({ productId }: ProductAttributesProps) {
  const [attributes, setAttributes] = useState<AttributeValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("product_attribute_values")
        .select("*, attribute_type:product_attribute_types(name)")
        .eq("product_id", productId)
        .order("sort_order");
      
      setAttributes((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [productId]);

  if (loading || attributes.length === 0) return null;

  // Group by attribute type
  const grouped = attributes.reduce<Record<string, { typeName: string; values: AttributeValue[] }>>((acc, attr) => {
    const typeName = (attr.attribute_type as any)?.name || "Other";
    if (!acc[typeName]) acc[typeName] = { typeName, values: [] };
    acc[typeName].values.push(attr);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([typeName, group]) => (
        <div key={typeName}>
          <h3 className="text-sm font-semibold text-foreground mb-3">{typeName}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {group.values.map((attr) => (
              <div key={attr.id} className="flex flex-col items-center text-center bg-card border border-border rounded-lg p-3">
                {attr.value_image && (
                  <img src={attr.value_image} alt={attr.label} className="w-12 h-12 object-contain mb-2" />
                )}
                <span className="text-sm font-bold text-foreground">{attr.value_text}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{attr.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
