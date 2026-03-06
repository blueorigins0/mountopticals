import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Grid3X3, ShoppingCart, User, Menu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allMenuOpen, setAllMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order")
        .limit(30);
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Hide on admin and AR try-on pages
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/ar-tryon/")) return null;

  const visibleCategories = categories.slice(0, 8);
  const remainingCategories = categories.slice(8);

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg safe-area-bottom">
        <div className="flex items-stretch h-14">
          <Link
            to="/"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0",
              isActive("/") ? "text-accent" : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Home</span>
          </Link>

          <Link
            to="/products"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0",
              isActive("/products") ? "text-accent" : "text-muted-foreground"
            )}
          >
            <Grid3X3 className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Shop</span>
          </Link>

          {/* All Menu */}
          <Sheet open={allMenuOpen} onOpenChange={setAllMenuOpen}>
            <SheetTrigger asChild>
              <button className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground min-w-0">
                <Menu className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-4 border-b border-border bg-primary text-primary-foreground">
                <SheetTitle className="text-primary-foreground text-left">All Categories</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto h-[calc(100vh-64px)]">
                <div className="p-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      onClick={() => setAllMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <span>{cat.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                <div className="p-4 border-t border-border">
                  <Link
                    to="/rfq"
                    onClick={() => setAllMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Request Quote (RFQ)
                  </Link>
                  <Link
                    to="/help"
                    onClick={() => setAllMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Help & FAQ
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setAllMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    Chat with Sales
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            to="/checkout"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0",
              isActive("/checkout") ? "text-accent" : "text-muted-foreground"
            )}
          >
            <ShoppingCart className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Cart</span>
          </Link>

          <Link
            to={user ? "/dashboard" : "/login"}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0",
              (isActive("/dashboard") || isActive("/login")) ? "text-accent" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Account</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="md:hidden h-14" />
    </>
  );
}
