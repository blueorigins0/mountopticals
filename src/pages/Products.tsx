import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Filter, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  images: string[] | null;
  guest_price: number;
  retail_price: number;
  shop_price: number;
  regular_price: number;
  shop_moq: number;
  retail_moq: number;
  has_variations: boolean | null;
  category: { name: string; id: string } | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function FilterSidebar({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: { 
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox 
              checked={selectedCategory === ""} 
              onCheckedChange={() => onCategoryChange("")}
            />
            <span className="text-sm text-muted-foreground">All Products</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={selectedCategory === cat.id}
                onCheckedChange={() => onCategoryChange(cat.id)}
              />
              <span className="text-sm text-muted-foreground">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* MOQ Filter */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Minimum Order</h3>
        <div className="space-y-2">
          {["1-50", "51-100", "101-500", "500+"].map((range) => (
            <label key={range} className="flex items-center gap-2 cursor-pointer">
              <Checkbox />
              <span className="text-sm text-muted-foreground">{range} units</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isLoading, setIsLoading] = useState(true);
  const [categoryBanner, setCategoryBanner] = useState<{ name: string; banner_image: string | null } | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);

  const buyerType: "guest" | "shop" | "retail" = !user ? "guest" : role === "shop" ? "shop" : role === "retail" ? "retail" : "guest";

  const getDisplayPrice = (p: Product) => {
    if (buyerType === "shop") return p.shop_price;
    if (buyerType === "retail") return p.retail_price;
    return p.guest_price;
  };

  const getMrp = (p: Product) => p.regular_price > 0 ? p.regular_price : p.guest_price;

  const getDiscount = (p: Product) => {
    const price = getDisplayPrice(p);
    const mrp = getMrp(p);
    if (mrp <= 0 || price >= mrp) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const getPriceLabel = () => {
    if (buyerType === "shop") return "Wholesaler";
    if (buyerType === "retail") return "Retailer";
    return null;
  };

  // Sync URL params
  useEffect(() => {
    const cat = searchParams.get("category");
    const search = searchParams.get("search");
    if (cat) setSelectedCategory(cat);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  // Removed handleAddToRFQ - not needed for B2C cards

  const clearSearch = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  const clearCategory = () => {
    setSelectedCategory("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("category");
    setSearchParams(newParams);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order");
      
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch category banner and sub-categories when a category is selected
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!selectedCategory || categories.length === 0) {
        setCategoryBanner(null);
        setSubCategories([]);
        return;
      }
      const match = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
      if (match) {
        const { data: catData } = await supabase
          .from("categories")
          .select("name, banner_image")
          .eq("id", match.id)
          .single();
        setCategoryBanner(catData as any);

        const { data: subCats } = await supabase
          .from("categories")
          .select("id, name, slug, image_url")
          .eq("parent_id", match.id)
          .eq("is_active", true)
          .order("sort_order");
        setSubCategories((subCats || []) as any);
      } else {
        setCategoryBanner(null);
        setSubCategories([]);
      }
    };
    fetchCategoryDetails();
  }, [selectedCategory, categories]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          short_description,
          images,
          guest_price,
          retail_price,
          shop_price,
          regular_price,
          shop_moq,
          retail_moq,
          has_variations,
          category_id,
          category:categories(id, name)
        `)
        .eq("is_active", true);

      // Filter by category slug or id
      if (selectedCategory) {
        const categoryMatch = categories.find(
          c => c.slug === selectedCategory || c.id === selectedCategory
        );
        if (categoryMatch) {
          query = query.eq("category_id", categoryMatch.id);
        }
      }

      // Search filter
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setProducts(data as unknown as Product[]);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, categories]);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "moq-low":
        return a.shop_moq - b.shop_moq;
      case "moq-high":
        return b.shop_moq - a.shop_moq;
      case "name-az":
        return a.name.localeCompare(b.name);
      case "name-za":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={categoryBanner?.name ? `${categoryBanner.name} - Industrial Products` : "All Products - Industrial B2B Marketplace"}
        description={`Browse ${categoryBanner?.name || 'industrial'} products at wholesale and retail prices on VendorHub.`}
      />
      <Header />
      <main className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          {/* Category Banner */}
          {categoryBanner?.banner_image && selectedCategory ? (
            <div className="relative h-[250px] rounded-lg overflow-hidden mb-6">
              <img src={categoryBanner.banner_image} alt={categoryBanner.name} className="w-full h-full object-cover" />
            </div>
          ) : !selectedCategory ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">All Products</h1>
              <p className="text-muted-foreground text-sm">Browse our complete product catalog</p>
            </motion.div>
          ) : (
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{categoryBanner?.name || selectedCategory}</h1>
            </div>
          )}

          {/* Sub-categories */}
          {subCategories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-foreground mb-3">ALL CATEGORIES ({subCategories.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {subCategories.map(sub => (
                  <Link
                    key={sub.id}
                    to={`/products?category=${sub.slug}`}
                    className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all group"
                  >
                    {(sub as any).image_url && (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={(sub as any).image_url} alt={sub.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <div className="p-2 text-center">
                      <span className="text-xs sm:text-sm font-medium text-foreground">{sub.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(searchQuery || selectedCategory) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Search: {searchQuery}
                  <button onClick={clearSearch} className="ml-1 hover:bg-muted rounded p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Category: {categories.find(c => c.id === selectedCategory || c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={clearCategory} className="ml-1 hover:bg-muted rounded p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-8">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-36 bg-card rounded-xl p-6 shadow-card border border-border">
                <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                <FilterSidebar 
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6 bg-card rounded-xl p-4 shadow-card border border-border">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{sortedProducts.length}</span> products
                </p>

                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild className="lg:hidden">
                      <Button variant="outline" size="sm" className="gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Filter className="h-5 w-5" />
                          Filters
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterSidebar 
                          categories={categories}
                          selectedCategory={selectedCategory}
                          onCategoryChange={setSelectedCategory}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="moq-low">MOQ: Low to High</SelectItem>
                      <SelectItem value="moq-high">MOQ: High to Low</SelectItem>
                      <SelectItem value="name-az">Name: A to Z</SelectItem>
                      <SelectItem value="name-za">Name: Z to A</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="hidden sm:flex border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "bg-card hover:bg-secondary"}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-accent text-accent-foreground" : "bg-card hover:bg-secondary"}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-card rounded-xl overflow-hidden shadow-card border border-border">
                      <div className="aspect-square bg-muted animate-pulse" />
                      <div className="p-3 sm:p-4 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-8 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Products Found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or browse all products.</p>
                  <Button onClick={() => setSelectedCategory("")} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-3 sm:gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5" : "grid-cols-1"}`}>
                  {sortedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
