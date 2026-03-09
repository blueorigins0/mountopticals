import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  RefreshCw,
  Eye,
  Save,
  Store,
  ShoppingBag,
  Boxes,
  Tag,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { ImageUpload, GalleryUpload } from "@/components/admin/ImageUpload";
import ModelViewer from "@/components/ar/ModelViewer";

type Product = Tables<"products">;
type Category = Tables<"categories">;
type Brand = Tables<"brands">;
type ProductVariation = Tables<"product_variations">;

interface Attribute {
  name: string;
  values: string[];
  usedForVariations: boolean;
  visibleOnProduct: boolean;
}

interface VariationData {
  id?: string;
  sku: string;
  size: string | null;
  color: string | null;
  color_image: string;
  stock_quantity: number;
  shop_price: number;
  shop_moq: number;
  retail_price: number;
  retail_moq: number;
  weight: number;
  is_active: boolean;
}

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const SHIPPING_CLASSES = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "heavy", label: "Heavy Items" },
  { value: "fragile", label: "Fragile" },
  { value: "free", label: "Free Shipping" },
];

const TAX_CLASSES = [
  { value: "standard", label: "Standard Rate" },
  { value: "reduced", label: "Reduced Rate" },
  { value: "zero", label: "Zero Rate" },
  { value: "exempt", label: "Tax Exempt" },
];

const PRODUCT_LABELS = [
  "TRENDING",
  "BEST SELLER",
  "NEW ARRIVAL",
  "STOCK RUNNING LOW",
  "MOST LOVED",
];

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [productType, setProductType] = useState<"simple" | "variable">(
    product?.has_variations ? "variable" : "simple"
  );

  // Basic Info
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(product?.description || "");
  const [shortDescription, setShortDescription] = useState(product?.short_description || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [brandId, setBrandId] = useState(product?.brand_id || "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  // Images
  const [featureImage, setFeatureImage] = useState(product?.images?.[0] || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.images?.slice(1) || []);
  const [arImage, setArImage] = useState((product as any)?.ar_image || "");
  const [arModelUrl, setArModelUrl] = useState((product as any)?.ar_model_url || "");
  const [arFitScale, setArFitScale] = useState(((product as any)?.ar_fit_scale ?? 1).toString());
  const [arFitYOffset, setArFitYOffset] = useState(((product as any)?.ar_fit_y_offset ?? 0).toString());
  const [arFitTiltMultiplier, setArFitTiltMultiplier] = useState(((product as any)?.ar_fit_tilt_multiplier ?? 1).toString());
  const [arFlipFrontBack, setArFlipFrontBack] = useState(Boolean((product as any)?.ar_flip_front_back));
  const [arManualRotationDeg, setArManualRotationDeg] = useState<number>((product as any)?.ar_manual_rotation_deg ?? 0);

  // Simple Product Pricing (3-Tier)
  const [shopPrice, setShopPrice] = useState(product?.shop_price?.toString() || "");
  const [shopMoq, setShopMoq] = useState(product?.shop_moq?.toString() || "10");
  const [retailPrice, setRetailPrice] = useState(product?.retail_price?.toString() || "");
  const [retailMoq, setRetailMoq] = useState(product?.retail_moq?.toString() || "1");
  const [guestPrice, setGuestPrice] = useState(product?.guest_price?.toString() || "");
  const [regularPrice, setRegularPrice] = useState(product?.regular_price?.toString() || "");
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity?.toString() || "0");

  // Attributes
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttributeValue, setNewAttributeValue] = useState<{ [key: string]: string }>({});
  const [newAttributeName, setNewAttributeName] = useState("");
  const [existingAttrTypes, setExistingAttrTypes] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedExistingAttr, setSelectedExistingAttr] = useState("");

  // Frame Dimensions
  const [fdTypeId, setFdTypeId] = useState<string | null>(null);
  const [fdValues, setFdValues] = useState<Record<string, { value: string; image: string; id?: string }>>({});
  const [isSavingFd, setIsSavingFd] = useState(false);

  // Variations
  const [variations, setVariations] = useState<VariationData[]>([]);
  const [existingVariations, setExistingVariations] = useState<ProductVariation[]>([]);
  const [expandedVariation, setExpandedVariation] = useState<number | null>(null);

  // Shipping
  const [weight, setWeight] = useState(product?.weight?.toString() || "0");
  const [length, setLength] = useState(product?.length?.toString() || "0");
  const [width, setWidth] = useState(product?.width?.toString() || "0");
  const [height, setHeight] = useState(product?.height?.toString() || "0");
  const [shippingClass, setShippingClass] = useState(product?.shipping_class || "standard");

  // Tax
  const [gstPercentage, setGstPercentage] = useState(product?.gst_percentage?.toString() || "18");
  const [taxClass, setTaxClass] = useState(product?.tax_class || "standard");

  // Tags & Labels
  const [tags, setTags] = useState<string[]>(product?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState("");

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    shortDesc: true,
    productData: true,
    longDesc: true,
    publish: true,
    productImage: true,
    gallery: false,
    arAssets: false,
    categories: true,
    brands: false,
    tags: true,
    labels: true,
  });

  useEffect(() => {
    fetchData();
    if (product) {
      fetchProductData();
    }
  }, [product]);

  const FRAME_DIMENSION_FIELDS = [
    { label: "Lens Width", defaultImage: "" },
    { label: "Bridge Width", defaultImage: "" },
    { label: "Temple Length", defaultImage: "" },
    { label: "Lens Height", defaultImage: "" },
  ];

  const fetchData = async () => {
    const [categoriesRes, brandsRes, attrTypesRes] = await Promise.all([
      supabase.from("categories").select("*").eq("is_active", true).order("name"),
      supabase.from("brands").select("*").eq("is_active", true).order("name"),
      supabase.from("product_attribute_types").select("*").order("name"),
    ]);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (brandsRes.data) setBrands(brandsRes.data);
    if (attrTypesRes.data) {
      const types = attrTypesRes.data as { id: string; name: string; slug: string }[];
      setExistingAttrTypes(types.filter(t => t.slug !== "frame-dimensions"));
      const fdType = types.find(t => t.slug === "frame-dimensions");
      setFdTypeId(fdType?.id || null);
    }
  };

  const fetchProductData = async () => {
    if (!product) return;
    
    const [variationsRes, attrValuesRes] = await Promise.all([
      supabase.from("product_variations").select("*").eq("product_id", product.id),
      supabase.from("product_attribute_values").select("*, attribute_type:product_attribute_types(name, slug)").eq("product_id", product.id).order("sort_order"),
    ]);
    
    const variationsData = variationsRes.data;
    if (variationsData && variationsData.length > 0) {
      setExistingVariations(variationsData);
      setProductType("variable");
      
      const sizes = [...new Set(variationsData.map(v => v.size).filter(Boolean))] as string[];
      const colors = [...new Set(variationsData.map(v => v.color).filter(Boolean))] as string[];
      
      const loadedAttrs: Attribute[] = [];
      if (sizes.length > 0) loadedAttrs.push({ name: "Size", values: sizes, usedForVariations: true, visibleOnProduct: true });
      if (colors.length > 0) loadedAttrs.push({ name: "Color", values: colors, usedForVariations: true, visibleOnProduct: true });
      setAttributes(loadedAttrs);
      
      setVariations(variationsData.map(v => ({
        id: v.id,
        sku: v.sku || "",
        size: v.size,
        color: v.color,
        color_image: v.color_image || "",
        stock_quantity: v.stock_quantity || 0,
        shop_price: Number(v.shop_price),
        shop_moq: v.shop_moq || 10,
        retail_price: Number(v.retail_price),
        retail_moq: v.retail_moq || 1,
        weight: v.weight || 0,
        is_active: v.is_active ?? true,
      })));
    }

    // Load existing attribute values (non-frame-dimensions) into attributes state
    if (attrValuesRes.data) {
      const attrValues = attrValuesRes.data as any[];
      const nonFdAttrs = attrValues.filter(av => (av.attribute_type as any)?.slug !== "frame-dimensions");
      
      // Group by attribute type name
      const attrMap: Record<string, Attribute> = {};
      nonFdAttrs.forEach(av => {
        const typeName = (av.attribute_type as any)?.name;
        if (!typeName) return;
        if (!attrMap[typeName]) {
          attrMap[typeName] = { name: typeName, values: [], usedForVariations: false, visibleOnProduct: av.show_on_page ?? true };
        }
        if (!attrMap[typeName].values.includes(av.value_text)) {
          attrMap[typeName].values.push(av.value_text);
        }
      });
      
      // Merge with existing variation attrs
      setAttributes(prev => {
        const merged = [...prev];
        Object.values(attrMap).forEach(attr => {
          const existing = merged.find(a => a.name === attr.name);
          if (!existing) merged.push(attr);
        });
        return merged;
      });

      // Load frame dimensions
      const fdAttrs = attrValues.filter(av => (av.attribute_type as any)?.slug === "frame-dimensions");
      if (fdAttrs.length > 0) {
        const map: Record<string, { value: string; image: string; id?: string }> = {};
        FRAME_DIMENSION_FIELDS.forEach(f => {
          const existing = fdAttrs.find((d: any) => d.label === f.label);
          map[f.label] = existing
            ? { value: existing.value_text, image: existing.value_image || "", id: existing.id }
            : { value: "", image: f.defaultImage };
        });
        setFdValues(map);
      }
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const addAttribute = () => {
    const nameToAdd = newAttributeName.trim();
    if (nameToAdd && !attributes.find(a => a.name.toLowerCase() === nameToAdd.toLowerCase())) {
      setAttributes(prev => [...prev, { 
        name: nameToAdd, 
        values: [], 
        usedForVariations: false,
        visibleOnProduct: true 
      }]);
      setNewAttributeName("");
    }
  };

  const addExistingAttribute = () => {
    if (!selectedExistingAttr) return;
    const attrType = existingAttrTypes.find(t => t.id === selectedExistingAttr);
    if (!attrType) return;
    if (attributes.find(a => a.name.toLowerCase() === attrType.name.toLowerCase())) {
      toast({ title: "Attribute already added", variant: "destructive" });
      return;
    }
    
    // Fetch existing values for this attribute type across all products for reuse
    const fetchExistingValues = async () => {
      const { data } = await supabase
        .from("product_attribute_values")
        .select("value_text")
        .eq("attribute_type_id", attrType.id);
      const uniqueVals = [...new Set((data || []).map((d: any) => d.value_text))];
      setAttributes(prev => [...prev, {
        name: attrType.name,
        values: uniqueVals,
        usedForVariations: false,
        visibleOnProduct: true,
      }]);
    };
    fetchExistingValues();
    setSelectedExistingAttr("");
  };

  const removeAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const addAttributeValue = (attrIndex: number) => {
    const attrName = attributes[attrIndex].name;
    const value = newAttributeValue[attrName]?.trim();
    if (value && !attributes[attrIndex].values.includes(value)) {
      setAttributes(prev => prev.map((attr, i) => 
        i === attrIndex ? { ...attr, values: [...attr.values, value] } : attr
      ));
      setNewAttributeValue(prev => ({ ...prev, [attrName]: "" }));
    }
  };

  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    setAttributes(prev => prev.map((attr, i) => 
      i === attrIndex ? { ...attr, values: attr.values.filter((_, vi) => vi !== valueIndex) } : attr
    ));
  };

  const generateVariations = () => {
    const variationAttrs = attributes.filter(a => a.usedForVariations && a.values.length > 0);
    
    if (variationAttrs.length === 0) {
      toast({ title: "No attributes", description: "Add attribute values marked for variations first", variant: "destructive" });
      return;
    }

    const sizeAttr = attributes.find(a => a.name === "Size" && a.usedForVariations);
    const colorAttr = attributes.find(a => a.name === "Color" && a.usedForVariations);
    
    const sizes = sizeAttr?.values.length ? sizeAttr.values : [null];
    const colors = colorAttr?.values.length ? colorAttr.values : [null];
    
    const newVariations: VariationData[] = [];
    
    sizes.forEach(size => {
      colors.forEach(color => {
        const existing = variations.find(v => v.size === size && v.color === color);
        if (existing) {
          newVariations.push(existing);
        } else {
          newVariations.push({
            sku: `${sku || "SKU"}-${size || ""}${color ? `-${color}` : ""}`.toUpperCase().replace(/--/g, "-"),
            size,
            color,
            color_image: "",
            stock_quantity: 0,
            shop_price: parseFloat(shopPrice) || 0,
            shop_moq: parseInt(shopMoq) || 10,
            retail_price: parseFloat(retailPrice) || 0,
            retail_moq: parseInt(retailMoq) || 1,
            weight: 0,
            is_active: true,
          });
        }
      });
    });
    
    setVariations(newVariations);
    toast({ title: "Variations Generated", description: `${newVariations.length} variations created` });
  };

  const updateVariation = (index: number, field: keyof VariationData, value: any) => {
    setVariations(prev => prev.map((v, i) => 
      i === index ? { ...v, [field]: value } : v
    ));
  };

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const addCustomLabel = () => {
    if (customLabel.trim() && !selectedLabels.includes(customLabel.trim().toUpperCase())) {
      setSelectedLabels(prev => [...prev, customLabel.trim().toUpperCase()]);
      setCustomLabel("");
    }
  };

  const handleSave = async (asDraft = false) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }

    if (productType === "simple" && (!shopPrice || !retailPrice)) {
      toast({ title: "Error", description: "Wholesale and Retail prices are required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const allImages = featureImage ? [featureImage, ...galleryImages] : galleryImages;
      const isVariable = productType === "variable";
      
      const productData = {
        name,
        slug: slug || generateSlug(name),
        description: description || null,
        short_description: shortDescription || null,
        sku: sku || null,
        category_id: categoryId || null,
        brand_id: brandId || null,
        is_active: asDraft ? false : isActive,
        has_variations: isVariable,
        images: allImages,
        features: selectedLabels,
        tags,
        shop_price: isVariable ? 0 : parseFloat(shopPrice) || 0,
        retail_price: isVariable ? 0 : parseFloat(retailPrice) || 0,
        guest_price: isVariable ? 0 : parseFloat(guestPrice) || 0,
        regular_price: isVariable ? 0 : parseFloat(regularPrice) || 0,
        shop_moq: isVariable ? 1 : parseInt(shopMoq) || 10,
        retail_moq: isVariable ? 1 : parseInt(retailMoq) || 1,
        stock_quantity: isVariable ? 0 : parseInt(stockQuantity) || 0,
        weight: parseFloat(weight) || 0,
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        shipping_class: shippingClass,
        gst_percentage: parseFloat(gstPercentage) || 18,
        tax_class: taxClass,
        ar_image: arImage || null,
        ar_model_url: arModelUrl || null,
        ar_fit_scale: Math.max(0.4, parseFloat(arFitScale) || 1),
        ar_fit_y_offset: parseFloat(arFitYOffset) || 0,
        ar_fit_tilt_multiplier: Math.max(0.2, parseFloat(arFitTiltMultiplier) || 1),
        ar_flip_front_back: arFlipFrontBack,
        ar_manual_rotation_deg: arManualRotationDeg,
      } as any;

      let productId = product?.id;

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle variations
      if (isVariable && productId) {
        const existingIds = existingVariations.map(v => v.id);
        const currentIds = variations.filter(v => v.id).map(v => v.id);
        const toDelete = existingIds.filter(id => !currentIds.includes(id));
        
        if (toDelete.length > 0) {
          await supabase.from("product_variations").delete().in("id", toDelete);
        }

        for (const variation of variations) {
          const variationData = {
            product_id: productId,
            sku: variation.sku || null,
            size: variation.size,
            color: variation.color,
            color_image: variation.color_image || null,
            stock_quantity: variation.stock_quantity,
            shop_price: variation.shop_price,
            shop_moq: variation.shop_moq,
            retail_price: variation.retail_price,
            retail_moq: variation.retail_moq,
            weight: variation.weight,
            is_active: variation.is_active,
          };

          if (variation.id) {
            await supabase
              .from("product_variations")
              .update(variationData)
              .eq("id", variation.id);
          } else {
            await supabase
              .from("product_variations")
              .insert(variationData);
          }
        }
      } else if (!isVariable && productId && existingVariations.length > 0) {
        await supabase
          .from("product_variations")
          .delete()
          .eq("product_id", productId);
      }

      // Save product attributes (non-variation, non-frame-dimension)
      if (productId) {
        // Delete existing non-fd attributes for this product
        const { data: existingAttrs } = await supabase
          .from("product_attribute_values")
          .select("id, attribute_type:product_attribute_types(slug)")
          .eq("product_id", productId);
        
        const nonFdExisting = (existingAttrs || []).filter((a: any) => (a.attribute_type as any)?.slug !== "frame-dimensions");
        if (nonFdExisting.length > 0) {
          await supabase.from("product_attribute_values").delete().in("id", nonFdExisting.map((a: any) => a.id));
        }

        // Insert new attribute values
        for (const attr of attributes) {
          if (attr.usedForVariations && (attr.name === "Size" || attr.name === "Color")) continue; // Skip variation attrs
          if (attr.values.length === 0) continue;
          
          // Find or create attribute type
          let typeId: string | null = null;
          const existingType = existingAttrTypes.find(t => t.name.toLowerCase() === attr.name.toLowerCase());
          if (existingType) {
            typeId = existingType.id;
          } else {
            const slug = attr.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const { data: newType } = await supabase.from("product_attribute_types").insert({ name: attr.name, slug }).select().single();
            if (newType) typeId = newType.id;
          }
          
          if (typeId) {
            for (let i = 0; i < attr.values.length; i++) {
              await supabase.from("product_attribute_values").insert({
                product_id: productId,
                attribute_type_id: typeId,
                label: attr.name,
                value_text: attr.values[i],
                sort_order: i,
                show_on_page: attr.visibleOnProduct,
              });
            }
          }
        }

        // Save frame dimensions
        if (Object.keys(fdValues).length > 0) {
          let fdTid = fdTypeId;
          if (!fdTid) {
            const { data } = await supabase.from("product_attribute_types").insert({ name: "Frame Dimensions", slug: "frame-dimensions" }).select().single();
            if (data) { fdTid = data.id; setFdTypeId(data.id); }
          }
          if (fdTid) {
            for (let i = 0; i < FRAME_DIMENSION_FIELDS.length; i++) {
              const field = FRAME_DIMENSION_FIELDS[i];
              const val = fdValues[field.label];
              if (!val?.value) continue;
              const fdData = {
                product_id: productId,
                attribute_type_id: fdTid,
                label: field.label,
                value_text: val.value,
                value_image: val.image || null,
                sort_order: i,
                show_on_page: false,
              };
              if (val.id) {
                await supabase.from("product_attribute_values").update(fdData).eq("id", val.id);
              } else {
                await supabase.from("product_attribute_values").insert(fdData);
              }
            }
          }
        }
      }

      toast({ 
        title: asDraft ? "Draft Saved" : (product ? "Product Updated" : "Product Created"),
        description: asDraft ? "Product saved as draft" : "Product has been saved successfully." 
      });
      onSave();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save product", 
        variant: "destructive" 
      });
    }
    setIsSaving(false);
  };

  // Collapsible Section Component
  const CollapsibleSection = ({ 
    id, 
    title, 
    children,
    defaultOpen = true 
  }: { 
    id: keyof typeof openSections; 
    title: string; 
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => (
    <Card className="shadow-sm border">
      <Collapsible open={openSections[id]} onOpenChange={() => toggleSection(id)}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between hover:bg-muted/30 transition-colors">
            <span className="font-medium text-sm">{title}</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              {openSections[id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">
          {product ? "Edit Product" : "Add New Product"}
        </h1>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* ==================== LEFT COLUMN - Main Content ==================== */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Product Name */}
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(generateSlug(e.target.value));
            }}
            placeholder="Product name"
            className="text-lg h-12"
          />

          {/* Product Short Description */}
          <CollapsibleSection id="shortDesc" title="Product short description">
            <Textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Enter brief product summary..."
              rows={4}
              className="resize-y"
            />
          </CollapsibleSection>

          {/* ==================== PRODUCT DATA TABS ==================== */}
          <Card className="shadow-sm border">
            <Collapsible open={openSections.productData} onOpenChange={() => toggleSection("productData")}>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">Product data —</span>
                    <Select value={productType} onValueChange={(v: "simple" | "variable") => setProductType(v)}>
                      <SelectTrigger className="w-[140px] h-8" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple product</SelectItem>
                        <SelectItem value="variable">Variable product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {openSections.productData ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex">
                      {/* Vertical Tab List */}
                      <TabsList className="flex flex-col h-auto w-44 rounded-none border-r bg-muted/30 p-0">
                        <TabsTrigger 
                          value="general" 
                          className="justify-start w-full rounded-none border-l-2 border-transparent data-[state=active]:border-l-primary data-[state=active]:bg-background px-4 py-3"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary mr-2" />
                          General
                        </TabsTrigger>
                        <TabsTrigger 
                          value="inventory" 
                          className="justify-start w-full rounded-none border-l-2 border-transparent data-[state=active]:border-l-primary data-[state=active]:bg-background px-4 py-3"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary mr-2" />
                          Inventory
                        </TabsTrigger>
                        <TabsTrigger 
                          value="shipping" 
                          className="justify-start w-full rounded-none border-l-2 border-transparent data-[state=active]:border-l-primary data-[state=active]:bg-background px-4 py-3"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary mr-2" />
                          Shipping
                        </TabsTrigger>
                        <TabsTrigger 
                          value="tax" 
                          className="justify-start w-full rounded-none border-l-2 border-transparent data-[state=active]:border-l-primary data-[state=active]:bg-background px-4 py-3"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary mr-2" />
                          Tax / GST
                        </TabsTrigger>
                        <TabsTrigger 
                          value="attributes" 
                          className="justify-start w-full rounded-none border-l-2 border-transparent data-[state=active]:border-l-warning data-[state=active]:bg-background px-4 py-3"
                        >
                          <span className="w-2 h-2 rounded-full bg-warning mr-2" />
                          Attributes
                        </TabsTrigger>
                        <TabsTrigger 
                          value="frame-dimensions" 
                          className="justify-start w-full rounded-none border-l-2 border-transparent data-[state=active]:border-l-accent data-[state=active]:bg-background px-4 py-3"
                        >
                          <span className="w-2 h-2 rounded-full bg-accent mr-2" />
                          Frame Dimensions
                        </TabsTrigger>
                        {productType === "variable" && (
                          <TabsTrigger 
                            value="variations" 
                            className="justify-start w-full rounded-none border-l-2 border-transparent data-[state=active]:border-l-warning data-[state=active]:bg-background px-4 py-3"
                          >
                            <span className="w-2 h-2 rounded-full bg-warning mr-2" />
                            Variations
                          </TabsTrigger>
                        )}
                      </TabsList>

                      {/* Tab Content */}
                      <div className="flex-1 p-4 min-h-[300px]">
                        {/* ========== GENERAL TAB ========== */}
                        <TabsContent value="general" className="m-0 space-y-6">
                          <h3 className="font-semibold text-base border-b pb-2">Pricing & Stock</h3>
                          
                          <div className="grid md:grid-cols-3 gap-4">
                            {/* Wholesale (Shop) Block */}
                            <div className="rounded-xl border-2 border-shop/30 bg-shop/5 p-4 space-y-4">
                              <div className="flex items-center gap-2 text-shop font-semibold">
                                <Store className="h-5 w-5" />
                                <span>Wholesaler</span>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Regular Price / MRP (₹)</Label>
                                  <Input
                                    type="number"
                                    value={regularPrice}
                                    placeholder="Set in Buyer section"
                                    disabled
                                    className="bg-muted/50 border-shop/30"
                                  />
                                  <p className="text-xs text-muted-foreground">Auto-filled from Buyer Regular Price</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Sale Price (₹) *</Label>
                                  <Input
                                    type="number"
                                    value={shopPrice}
                                    onChange={(e) => setShopPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="border-shop/30 focus:border-shop"
                                    disabled={productType === "variable"}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Wholesale MOQ *</Label>
                                  <Input
                                    type="number"
                                    value={shopMoq}
                                    onChange={(e) => setShopMoq(e.target.value)}
                                    placeholder="10"
                                    className="border-shop/30 focus:border-shop"
                                    disabled={productType === "variable"}
                                  />
                                  <p className="text-xs text-muted-foreground">Minimum Order Quantity</p>
                                </div>
                              </div>
                            </div>

                            {/* Retailer Block */}
                            <div className="rounded-xl border-2 border-retail/30 bg-retail/5 p-4 space-y-4">
                              <div className="flex items-center gap-2 text-retail font-semibold">
                                <ShoppingBag className="h-5 w-5" />
                                <span>Retailer</span>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Regular Price / MRP (₹)</Label>
                                  <Input
                                    type="number"
                                    value={regularPrice}
                                    placeholder="Set in Buyer section"
                                    disabled
                                    className="bg-muted/50 border-retail/30"
                                  />
                                  <p className="text-xs text-muted-foreground">Auto-filled from Buyer Regular Price</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Sale Price (₹) *</Label>
                                  <Input
                                    type="number"
                                    value={retailPrice}
                                    onChange={(e) => setRetailPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="border-retail/30 focus:border-retail"
                                    disabled={productType === "variable"}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Retail MOQ *</Label>
                                  <Input
                                    type="number"
                                    value={retailMoq}
                                    onChange={(e) => setRetailMoq(e.target.value)}
                                    placeholder="1"
                                    className="border-retail/30 focus:border-retail"
                                    disabled={productType === "variable"}
                                  />
                                  <p className="text-xs text-muted-foreground">Minimum Order Quantity</p>
                                </div>
                              </div>
                            </div>

                            {/* Buyer Block */}
                            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
                              <div className="flex items-center gap-2 text-primary font-semibold">
                                <User className="h-5 w-5" />
                                <span>Buyer</span>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Regular Price / MRP (₹) *</Label>
                                  <Input
                                    type="number"
                                    value={regularPrice}
                                    onChange={(e) => setRegularPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="border-primary/30 focus:border-primary"
                                    disabled={productType === "variable"}
                                  />
                                  <p className="text-xs text-muted-foreground">Shown as strikethrough MRP for all tiers</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm">Sale Price (₹) *</Label>
                                  <Input
                                    type="number"
                                    value={guestPrice}
                                    onChange={(e) => setGuestPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="border-primary/30 focus:border-primary"
                                    disabled={productType === "variable"}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-sm text-muted-foreground">MOQ</Label>
                                  <Input
                                    type="number"
                                    value="1"
                                    disabled
                                    className="bg-muted/50"
                                  />
                                  <p className="text-xs text-muted-foreground">Fixed at 1 for individual buyers</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Stock Quantity (for simple products) */}
                          {productType === "simple" && (
                            <div className="pt-2">
                              <div className="flex items-center gap-2 mb-3">
                                <Boxes className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Stock Quantity</span>
                              </div>
                              <Input
                                type="number"
                                value={stockQuantity}
                                onChange={(e) => setStockQuantity(e.target.value)}
                                placeholder="0"
                                className="w-40"
                              />
                            </div>
                          )}

                          {productType === "variable" && (
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                              💡 For variable products, pricing and stock are set per variation in the <strong>Variations</strong> tab.
                            </p>
                          )}
                        </TabsContent>

                        {/* ========== INVENTORY TAB ========== */}
                        <TabsContent value="inventory" className="m-0 space-y-4">
                          <div className="space-y-2">
                            <Label>SKU (Stock Keeping Unit)</Label>
                            <Input
                              value={sku}
                              onChange={(e) => setSku(e.target.value)}
                              placeholder="SKU-001"
                              className="w-64"
                            />
                          </div>
                          
                          {productType === "simple" && (
                            <div className="space-y-2">
                              <Label>Stock Quantity</Label>
                              <Input
                                type="number"
                                value={stockQuantity}
                                onChange={(e) => setStockQuantity(e.target.value)}
                                placeholder="0"
                                className="w-40"
                              />
                            </div>
                          )}
                          
                          {productType === "variable" && (
                            <p className="text-sm text-muted-foreground">
                              Stock is managed at variation level for variable products.
                            </p>
                          )}
                        </TabsContent>

                        {/* ========== SHIPPING TAB ========== */}
                        <TabsContent value="shipping" className="m-0 space-y-4">
                          <div className="space-y-2">
                            <Label>Weight (kg)</Label>
                            <Input
                              type="number"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                              placeholder="0"
                              className="w-40"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Dimensions (cm)</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                placeholder="Length"
                                className="w-28"
                              />
                              <Input
                                type="number"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                placeholder="Width"
                                className="w-28"
                              />
                              <Input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="Height"
                                className="w-28"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Shipping class</Label>
                            <Select value={shippingClass} onValueChange={setShippingClass}>
                              <SelectTrigger className="w-64">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SHIPPING_CLASSES.map(sc => (
                                  <SelectItem key={sc.value} value={sc.value}>{sc.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>

                        {/* ========== TAX TAB ========== */}
                        <TabsContent value="tax" className="m-0 space-y-4">
                          <div className="space-y-2">
                            <Label>GST Percentage (%)</Label>
                            <Input
                              type="number"
                              value={gstPercentage}
                              onChange={(e) => setGstPercentage(e.target.value)}
                              placeholder="18"
                              className="w-40"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Tax class</Label>
                            <Select value={taxClass} onValueChange={setTaxClass}>
                              <SelectTrigger className="w-64">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TAX_CLASSES.map(tc => (
                                  <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>

                        {/* ========== ATTRIBUTES TAB ========== */}
                        <TabsContent value="attributes" className="m-0 space-y-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {productType === "variable" 
                              ? "Define attributes like Size, Color etc. Mark them \"Used for variations\" to create product variants."
                              : "Add product attributes for filters and product page display."
                            }
                          </p>

                          {attributes.map((attr, attrIndex) => (
                            <div key={attr.name} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{attr.name}</h4>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeAttribute(attrIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="flex gap-2">
                                <Input
                                  value={newAttributeValue[attr.name] || ""}
                                  onChange={(e) => setNewAttributeValue(prev => ({ 
                                    ...prev, 
                                    [attr.name]: e.target.value 
                                  }))}
                                  placeholder={`Add value (e.g., ${attr.name === "Size" ? "S, M, L" : attr.name === "Color" ? "Red, Blue" : "Value"})`}
                                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttributeValue(attrIndex))}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => addAttributeValue(attrIndex)}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {attr.values.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {attr.values.map((value, valueIndex) => (
                                    <Badge key={value} variant="secondary" className="gap-1 py-1">
                                      {value}
                                      <button
                                        type="button"
                                        onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-6 pt-2 border-t">
                                {productType === "variable" && (
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`variations-${attr.name}`}
                                      checked={attr.usedForVariations}
                                      onCheckedChange={(checked) => {
                                        setAttributes(prev => prev.map((a, i) => 
                                          i === attrIndex ? { ...a, usedForVariations: !!checked } : a
                                        ));
                                      }}
                                    />
                                    <Label htmlFor={`variations-${attr.name}`} className="text-sm cursor-pointer">
                                      Used for variations
                                    </Label>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`visible-${attr.name}`}
                                    checked={attr.visibleOnProduct}
                                    onCheckedChange={(checked) => {
                                      setAttributes(prev => prev.map((a, i) => 
                                        i === attrIndex ? { ...a, visibleOnProduct: !!checked } : a
                                      ));
                                    }}
                                  />
                                  <Label htmlFor={`visible-${attr.name}`} className="text-sm cursor-pointer">
                                    Show in Features
                                  </Label>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Add Existing Attribute */}
                          {existingAttrTypes.length > 0 && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Select value={selectedExistingAttr} onValueChange={setSelectedExistingAttr}>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select existing attribute..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {existingAttrTypes
                                    .filter(t => !attributes.find(a => a.name.toLowerCase() === t.name.toLowerCase()))
                                    .map(t => (
                                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button type="button" variant="outline" onClick={addExistingAttribute}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                              </Button>
                            </div>
                          )}

                          {/* Add New Custom Attribute */}
                          <div className="flex gap-2">
                            <Input
                              value={newAttributeName}
                              onChange={(e) => setNewAttributeName(e.target.value)}
                              placeholder="Or create new attribute..."
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttribute())}
                            />
                            <Button type="button" variant="outline" onClick={addAttribute}>
                              <Plus className="h-4 w-4 mr-1" /> Create
                            </Button>
                          </div>

                          {productType === "variable" && (
                            <Button 
                              type="button" 
                              onClick={generateVariations}
                              className="w-full mt-4"
                              variant="default"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Generate Variations from Attributes
                            </Button>
                          )}
                        </TabsContent>

                        {/* ========== FRAME DIMENSIONS TAB ========== */}
                        <TabsContent value="frame-dimensions" className="m-0 space-y-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            Enter frame dimension values for eyewear products. Images are pre-configured from the Attributes page.
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            {FRAME_DIMENSION_FIELDS.map((field) => (
                              <div key={field.label} className="border rounded-lg p-4 space-y-2 text-center">
                                {fdValues[field.label]?.image && (
                                  <img src={fdValues[field.label].image} alt={field.label} className="w-12 h-12 object-contain mx-auto" />
                                )}
                                <Label className="text-xs font-medium">{field.label}</Label>
                                <Input
                                  value={fdValues[field.label]?.value || ""}
                                  onChange={(e) => setFdValues(prev => ({
                                    ...prev,
                                    [field.label]: { ...prev[field.label], value: e.target.value }
                                  }))}
                                  placeholder="e.g. 52mm"
                                  className="text-center h-9"
                                />
                                {!fdValues[field.label]?.image && (
                                  <div className="pt-1">
                                    <ImageUpload
                                      value={fdValues[field.label]?.image || ""}
                                      onChange={(url) => setFdValues(prev => ({
                                        ...prev,
                                        [field.label]: { ...prev[field.label], image: url }
                                      }))}
                                      bucket="product-images"
                                      compact
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Frame dimensions are saved automatically when you save the product.
                          </p>
                        </TabsContent>

                        {/* ========== VARIATIONS TAB ========== */}
                        {productType === "variable" && (
                          <TabsContent value="variations" className="m-0 space-y-4">
                            {variations.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No variations yet.</p>
                                <p className="text-sm">Add attributes and click "Generate Variations" in the Attributes tab.</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground mb-3">
                                  {variations.length} variation(s) — Click to expand and edit
                                </p>
                                
                                {variations.map((variation, index) => (
                                  <Collapsible 
                                    key={index} 
                                    open={expandedVariation === index}
                                    onOpenChange={() => setExpandedVariation(expandedVariation === index ? null : index)}
                                  >
                                    <div className="border rounded-lg overflow-hidden">
                                      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30">
                                        <div className="flex items-center gap-3">
                                          <span className="font-medium">
                                            #{index + 1} — 
                                            {variation.size && <Badge variant="outline" className="ml-2">{variation.size}</Badge>}
                                            {variation.color && <Badge variant="outline" className="ml-1">{variation.color}</Badge>}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-muted-foreground">
                                            ₹{variation.shop_price} / ₹{variation.retail_price}
                                          </span>
                                          {expandedVariation === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent>
                                        <div className="p-4 border-t bg-muted/10 space-y-4">
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                              <Label className="text-xs">SKU</Label>
                                              <Input
                                                value={variation.sku}
                                                onChange={(e) => updateVariation(index, "sku", e.target.value)}
                                                className="h-9"
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label className="text-xs">Stock Qty</Label>
                                              <Input
                                                type="number"
                                                value={variation.stock_quantity}
                                                onChange={(e) => updateVariation(index, "stock_quantity", parseInt(e.target.value) || 0)}
                                                className="h-9"
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <Label className="text-xs">Variation Image</Label>
                                              <ImageUpload
                                                value={variation.color_image}
                                                onChange={(url) => updateVariation(index, "color_image", url)}
                                                bucket="product-images"
                                                compact
                                              />
                                            </div>
                                          </div>

                                          {/* B2B Pricing for Variation */}
                                          <div className="grid md:grid-cols-2 gap-4">
                                            {/* Wholesale */}
                                            <div className="rounded-lg border border-shop/30 bg-shop/5 p-3 space-y-2">
                                              <span className="text-xs font-semibold text-shop">Wholesale</span>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                  <Label className="text-xs">Price (₹)</Label>
                                                  <Input
                                                    type="number"
                                                    value={variation.shop_price}
                                                    onChange={(e) => updateVariation(index, "shop_price", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-sm border-shop/30"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <Label className="text-xs">MOQ</Label>
                                                  <Input
                                                    type="number"
                                                    value={variation.shop_moq}
                                                    onChange={(e) => updateVariation(index, "shop_moq", parseInt(e.target.value) || 10)}
                                                    className="h-8 text-sm border-shop/30"
                                                  />
                                                </div>
                                              </div>
                                            </div>

                                            {/* Retail */}
                                            <div className="rounded-lg border border-retail/30 bg-retail/5 p-3 space-y-2">
                                              <span className="text-xs font-semibold text-retail">Retail</span>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                  <Label className="text-xs">Price (₹)</Label>
                                                  <Input
                                                    type="number"
                                                    value={variation.retail_price}
                                                    onChange={(e) => updateVariation(index, "retail_price", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-sm border-retail/30"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <Label className="text-xs">MOQ</Label>
                                                  <Input
                                                    type="number"
                                                    value={variation.retail_moq}
                                                    onChange={(e) => updateVariation(index, "retail_moq", parseInt(e.target.value) || 1)}
                                                    className="h-8 text-sm border-retail/30"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex items-center gap-2">
                                              <Switch
                                                checked={variation.is_active}
                                                onCheckedChange={(checked) => updateVariation(index, "is_active", checked)}
                                              />
                                              <Label className="text-sm">Active</Label>
                                            </div>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => removeVariation(index)}
                                              className="text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                                            </Button>
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        )}
                      </div>
                    </div>
                  </Tabs>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Product Description (Long) */}
          <CollapsibleSection id="longDesc" title="Product description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed product description..."
              rows={8}
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">Supports markdown formatting</p>
          </CollapsibleSection>
        </div>

        {/* ==================== RIGHT COLUMN - Sidebar ==================== */}
        <div className="space-y-4">
          
          {/* Publish Box */}
          <CollapsibleSection id="publish" title="Publish">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Draft
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onClose}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
              
              <div className="text-sm space-y-1.5 py-2 border-y">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{isActive ? "Active" : "Draft"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibility:</span>
                  <span className="font-medium">Public</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active-toggle" className="text-sm">Active</Label>
                <Switch
                  id="active-toggle"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <Button 
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="w-full bg-primary"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {product ? "Update" : "Publish"}
              </Button>
            </div>
          </CollapsibleSection>

          {/* Product Image */}
          <CollapsibleSection id="productImage" title="Product image">
            <ImageUpload
              value={featureImage}
              onChange={setFeatureImage}
              bucket="product-images"
            />
          </CollapsibleSection>

          {/* Product Gallery */}
          <CollapsibleSection id="gallery" title="Product gallery">
            <GalleryUpload
              value={galleryImages}
              onChange={setGalleryImages}
              bucket="product-images"
              maxImages={10}
            />
          </CollapsibleSection>

          {/* AR Try-On Assets */}
          <CollapsibleSection id="arAssets" title="AR Try-On Assets">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">AR Image (Front-facing transparent PNG)</Label>
                <p className="text-xs text-muted-foreground mb-2">Upload a front-view frame image without temples for realistic 2D AR overlay</p>
                <ImageUpload
                  value={arImage}
                  onChange={setArImage}
                  bucket="product-images"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">3D Model (GLB/GLTF)</Label>
                <p className="text-xs text-muted-foreground mb-2">Upload a 3D model file or paste URL for full 3D AR try-on experience</p>
                {arModelUrl && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-md">
                    <span className="text-xs text-foreground truncate flex-1">{arModelUrl}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setArModelUrl("")}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) {
                          toast({ title: "File too large", description: "Max 20MB allowed", variant: "destructive" });
                          return;
                        }
                        try {
                          const ext = file.name.split('.').pop();
                          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                          const { error } = await supabase.storage.from("product-images").upload(fileName, file);
                          if (error) throw error;
                          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
                          setArModelUrl(urlData.publicUrl);
                          toast({ title: "3D Model uploaded!" });
                        } catch (err: any) {
                          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                        }
                      }}
                    />
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload GLB/GLTF</span>
                  </label>
                  <div className="flex gap-1">
                    <Input
                      value={arModelUrl}
                      onChange={(e) => setArModelUrl(e.target.value)}
                      placeholder="https://example.com/model.glb"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <div>
                  <Label className="text-sm font-medium">AR Calibration Controls</Label>
                  <p className="text-xs text-muted-foreground">Per-product fitting for scale, vertical placement, and tilt sensitivity.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Scale</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0.4"
                      max="3"
                      value={arFitScale}
                      onChange={(e) => setArFitScale(e.target.value)}
                      placeholder="1.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vertical Offset</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="-0.5"
                      max="0.5"
                      value={arFitYOffset}
                      onChange={(e) => setArFitYOffset(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tilt Multiplier</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0.2"
                      max="2"
                      value={arFitTiltMultiplier}
                      onChange={(e) => setArFitTiltMultiplier(e.target.value)}
                      placeholder="1.00"
                    />
                  </div>
                </div>

                <div className="space-y-2 rounded-md border border-border p-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Auto + Manual Orientation</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Auto orientation always on rahega; neeche se 0°/90°/180°/270° manual correction de sakte ho.
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[0, 90, 180, 270].map((deg) => (
                      <Button
                        key={deg}
                        type="button"
                        size="sm"
                        variant={arManualRotationDeg === deg ? "default" : "outline"}
                        onClick={() => setArManualRotationDeg(deg)}
                      >
                        {deg}°
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={arFlipFrontBack ? "outline" : "default"}
                      onClick={() => setArFlipFrontBack(false)}
                    >
                      Normal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={arFlipFrontBack ? "default" : "outline"}
                      onClick={() => setArFlipFrontBack(true)}
                    >
                      Flipped
                    </Button>
                   </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-dashed"
                    onClick={() => {
                      setArManualRotationDeg(0);
                      setArFlipFrontBack(false);
                      setArFitScale("1");
                      setArFitYOffset("0");
                      setArFitTiltMultiplier("1");
                    }}
                  >
                    ↺ Reset to Auto
                  </Button>
                </div>

                {arModelUrl && (
                  <div className="space-y-2">
                    <Label className="text-xs">Live 3D Preview</Label>
                    <p className="text-[11px] text-muted-foreground">Quick selector use karke temples ko ear-side align karke save karo.</p>
                    <div className="h-48 rounded-lg overflow-hidden border border-border">
                      <ModelViewer
                        modelUrl={arModelUrl}
                        forceFlipFrontBack={arFlipFrontBack}
                        manualRotationDeg={arManualRotationDeg}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Product Categories */}
          <CollapsibleSection id="categories" title="Product categories">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories available</p>
              ) : (
                categories.filter(cat => !cat.parent_id).map(cat => (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={categoryId === cat.id}
                        onCheckedChange={(checked) => setCategoryId(checked ? cat.id : "")}
                      />
                      <Label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer font-medium">{cat.name}</Label>
                    </div>
                    {/* Subcategories */}
                    {categories.filter(sub => sub.parent_id === cat.id).map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 ml-5 mt-1">
                        <Checkbox
                          id={`cat-${sub.id}`}
                          checked={categoryId === sub.id}
                          onCheckedChange={(checked) => setCategoryId(checked ? sub.id : "")}
                        />
                        <Label htmlFor={`cat-${sub.id}`} className="text-sm cursor-pointer text-muted-foreground">— {sub.name}</Label>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          {/* Brands */}
          <CollapsibleSection id="brands" title="Brands">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground">No brands available</p>
              ) : (
                brands.map(brand => (
                  <div key={brand.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={brandId === brand.id}
                      onCheckedChange={(checked) => setBrandId(checked ? brand.id : "")}
                    />
                    <Label htmlFor={`brand-${brand.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                      {brand.logo_url && (
                        <img src={brand.logo_url} alt={brand.name} className="w-5 h-5 object-contain" />
                      )}
                      {brand.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          {/* Product Tags */}
          <CollapsibleSection id="tags" title="Product tags">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add new tag"
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, i) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <button onClick={() => removeTag(i)} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Product Labels */}
          <CollapsibleSection id="labels" title="Product Label">
            <div className="space-y-3">
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g., TRENDING, BEST SELLER"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomLabel())}
              />
              <div className="flex flex-wrap gap-1">
                {PRODUCT_LABELS.map(label => (
                  <Badge
                    key={label}
                    variant={selectedLabels.includes(label) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleLabel(label)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
              {selectedLabels.filter(l => !PRODUCT_LABELS.includes(l)).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  {selectedLabels.filter(l => !PRODUCT_LABELS.includes(l)).map(label => (
                    <Badge key={label} variant="default" className="text-xs">
                      {label}
                      <button onClick={() => toggleLabel(label)} className="ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </motion.div>
  );
}
