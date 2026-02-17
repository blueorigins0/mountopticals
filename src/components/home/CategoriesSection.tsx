import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Cog, Cpu, Wrench, Boxes, Package, Zap, 
  Factory, Settings, HardHat, Gauge, Truck, Shield,
  Layers, PenTool, CircuitBoard, Bolt, Pipette, Hammer,
  Drill, Scale, Plug, Ruler, Box, Warehouse
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const defaultIcons = [
  { icon: Cog, color: "bg-primary/10 text-primary" },
  { icon: Cpu, color: "bg-accent/10 text-accent" },
  { icon: Wrench, color: "bg-shop/10 text-shop" },
  { icon: Boxes, color: "bg-retail/10 text-retail" },
  { icon: Package, color: "bg-warning/10 text-warning" },
  { icon: Zap, color: "bg-success/10 text-success" },
  { icon: Factory, color: "bg-primary/10 text-primary" },
  { icon: Settings, color: "bg-accent/10 text-accent" },
  { icon: HardHat, color: "bg-shop/10 text-shop" },
  { icon: Gauge, color: "bg-retail/10 text-retail" },
  { icon: Truck, color: "bg-warning/10 text-warning" },
  { icon: Shield, color: "bg-success/10 text-success" },
  { icon: Layers, color: "bg-primary/10 text-primary" },
  { icon: PenTool, color: "bg-accent/10 text-accent" },
  { icon: CircuitBoard, color: "bg-shop/10 text-shop" },
  { icon: Bolt, color: "bg-retail/10 text-retail" },
  { icon: Pipette, color: "bg-warning/10 text-warning" },
  { icon: Hammer, color: "bg-success/10 text-success" },
  { icon: Drill, color: "bg-primary/10 text-primary" },
  { icon: Scale, color: "bg-accent/10 text-accent" },
  { icon: Plug, color: "bg-shop/10 text-shop" },
  { icon: Ruler, color: "bg-retail/10 text-retail" },
  { icon: Box, color: "bg-warning/10 text-warning" },
  { icon: Warehouse, color: "bg-success/10 text-success" },
];

const defaultCategories = [
  "Industrial", "Electronics", "Tools", "Raw Materials",
  "Packaging", "Electrical", "Heavy Equipment", "Automation", 
  "Safety Gear", "Instruments", "Logistics", "Protection", 
  "Materials", "Precision", "Components", "Hardware",
  "Chemicals", "Construction", "Power Tools", "Measuring",
  "Plumbing", "HVAC", "Pumps", "Motors"
];

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSection, setShowSection] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Check if section is enabled
      const { data: settings } = await supabase.from("site_settings").select("value").eq("key", "homepage").maybeSingle();
      if (settings?.value) {
        const v = settings.value as any;
        if (v.show_categories === false) {
          setShowSection(false);
          setLoading(false);
          return;
        }
      }

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .is("parent_id", null)
        .order("sort_order")
        .limit(24);
      
      setCategories(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (!showSection && !loading) return null;

  const renderCategoryCard = (category: Category | null, idx: number, name?: string) => {
    const iconData = defaultIcons[idx % defaultIcons.length];
    const IconComponent = iconData.icon;
    const categoryName = category?.name || name || defaultCategories[idx];
    const categorySlug = category?.slug || categoryName.toLowerCase().replace(/\s+/g, '-');

    return (
      <motion.div
        key={category?.id || idx}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: idx * 0.02 }}
      >
        <Link
          to={`/products?category=${categorySlug}`}
          className="group block"
        >
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 hover:shadow-md hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5 flex flex-col items-center text-center">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${iconData.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="font-medium text-foreground text-xs sm:text-sm line-clamp-1">
              {categoryName}
            </h3>
          </div>
        </Link>
      </motion.div>
    );
  };

  // Create display categories with defaults
  const displayCategories = categories.length > 0 
    ? categories 
    : defaultCategories.map((name, idx) => ({ 
        id: `default-${idx}`, 
        name, 
        slug: name.toLowerCase().replace(/\s+/g, '-'), 
        description: null, 
        image_url: null 
      }));

  // Desktop: 12+12 = 24, Tablet: 10+10 = 20, Mobile: 4x4 = 16
  const desktopTopRow = displayCategories.slice(0, 12);
  const desktopBottomRow = displayCategories.slice(12, 24);
  
  const tabletTopRow = displayCategories.slice(0, 10);
  const tabletBottomRow = displayCategories.slice(10, 20);
  
  const mobileCategories = displayCategories.slice(0, 16);

  return (
    <section className="py-6 sm:py-8 bg-background">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground">
            Shop by Category
          </h2>
          <Link 
            to="/products" 
            className="text-accent font-medium text-sm hover:underline"
          >
            See All
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {/* Desktop Skeleton */}
            <div className="hidden lg:grid grid-cols-12 gap-3">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={`top-${i}`} className="h-24 rounded-xl" />
              ))}
            </div>
            <div className="hidden lg:grid grid-cols-12 gap-3">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={`bottom-${i}`} className="h-24 rounded-xl" />
              ))}
            </div>
            {/* Tablet Skeleton */}
            <div className="hidden md:grid lg:hidden grid-cols-10 gap-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={`tab-top-${i}`} className="h-24 rounded-xl" />
              ))}
            </div>
            <div className="hidden md:grid lg:hidden grid-cols-10 gap-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={`tab-bottom-${i}`} className="h-24 rounded-xl" />
              ))}
            </div>
            {/* Mobile Skeleton */}
            <div className="grid md:hidden grid-cols-4 gap-2">
              {[...Array(16)].map((_, i) => (
                <Skeleton key={`mobile-${i}`} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Layout: 12 + 12 = 24 categories */}
            <div className="hidden lg:block space-y-3">
              <div className="grid grid-cols-12 gap-3">
                {desktopTopRow.map((category, idx) => renderCategoryCard(category as Category, idx))}
              </div>
              <div className="grid grid-cols-12 gap-3">
                {desktopBottomRow.length > 0 
                  ? desktopBottomRow.map((category, idx) => renderCategoryCard(category as Category, idx + 12))
                  : defaultCategories.slice(12, 24).map((name, idx) => renderCategoryCard(null, idx + 12, name))
                }
              </div>
            </div>

            {/* Tablet Layout: 10 + 10 = 20 categories */}
            <div className="hidden md:block lg:hidden space-y-3">
              <div className="grid grid-cols-10 gap-3">
                {tabletTopRow.map((category, idx) => renderCategoryCard(category as Category, idx))}
              </div>
              <div className="grid grid-cols-10 gap-3">
                {tabletBottomRow.length > 0 
                  ? tabletBottomRow.map((category, idx) => renderCategoryCard(category as Category, idx + 10))
                  : defaultCategories.slice(10, 20).map((name, idx) => renderCategoryCard(null, idx + 10, name))
                }
              </div>
            </div>

            {/* Mobile Layout: 4x4 = 16 categories */}
            <div className="grid md:hidden grid-cols-4 gap-2">
              {mobileCategories.map((category, idx) => renderCategoryCard(category as Category, idx))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
