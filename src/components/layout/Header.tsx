import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu, MapPin, User, MessageSquare, LogOut,
  LayoutDashboard, ChevronDown, HelpCircle, Store, ChevronRight, Truck, Search } from
"lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { CartSheet } from "@/components/cart/CartSheet";
import { Badge } from "@/components/ui/badge";
import { InstantSearch } from "@/components/search/InstantSearch";
import { supabase } from "@/integrations/supabase/client";
import { SiteLogo } from "@/components/SiteLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // kept for potential future use
  const [location, setLocation] = useState("Select Location");
  const [categories, setCategories] = useState<Category[]>([]);
  const currentPath = useLocation().pathname;
  const navigate = useNavigate();
  const { user, profile, role, signOut, isLoading } = useAuth();


  // Fetch categories for mega menu
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.
      from("categories").
      select("id, name, slug").
      eq("is_active", true).
      is("parent_id", null).
      order("sort_order").
      limit(20);
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district;
            const pincode = data.address?.postcode || "";
            if (city) setLocation(`${city}${pincode ? ` ${pincode}` : ""}`);
          } catch {
            console.log("Could not fetch location name");
          }
        },
        () => {
          console.log("Location permission denied");
        }
      );
    }
  }, []);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-card shadow-sm">
      {/* Main Header - White/Card */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16">
            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="flex-shrink-0 h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="p-4 border-b border-border bg-primary text-primary-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <User className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div>
                        {user ?
                        <>
                            <p className="font-medium text-sm">Hello, {profile?.full_name?.split(' ')[0] || "User"}</p>
                            <p className="text-xs text-primary-foreground/70 capitalize">{role || "Buyer"}</p>
                          </> :

                        <p className="font-medium text-sm">Hello, Sign In</p>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Mobile Search */}
                  <div className="p-3 border-b border-border">
                    <InstantSearch onClose={() => setIsOpen(false)} />
                  </div>

                  {/* Mobile Nav */}
                  <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    <Link
                      to="/"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        currentPath === "/" ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"
                      )}>

                      Home
                    </Link>
                    <Link
                      to="/products"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        currentPath === "/products" ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"
                      )}>

                      All Products
                    </Link>
                    <Link
                      to="/rfq"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary">

                      Request Quote
                    </Link>
                    <Link
                      to="/chat"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary">

                      <MessageSquare className="h-4 w-4" />
                      Chat with Sales
                    </Link>
                    
                    {/* Mobile Categories */}
                    <div className="pt-3 mt-3 border-t border-border">
                      <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-2">Categories</p>
                      {categories.slice(0, 8).map((cat) =>
                      <Link
                        key={cat.id}
                        to={`/products?category=${cat.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary">

                          {cat.name}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      )}
                    </div>
                  </nav>

                  {/* Mobile Footer */}
                  <div className="p-3 border-t border-border bg-secondary/30">
                    {user ?
                    <div className="space-y-2">
                        <Link to={role === "admin" ? "/admin" : "/dashboard"} onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm">
                            <LayoutDashboard className="h-4 w-4" />
                            {role === "admin" ? "Admin Panel" : "My Dashboard"}
                          </Button>
                        </Link>
                        <Button onClick={() => {signOut();setIsOpen(false);}} variant="destructive" className="w-full h-9 text-sm">
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div> :

                    <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-accent hover:bg-accent-hover h-9 text-sm">
                          Sign In / Register
                        </Button>
                      </Link>
                    }
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <SiteLogo className="w-8 h-8 sm:w-10 sm:h-10" />
            </Link>

            {/* Location Picker */}
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      try {
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                        );
                        const data = await response.json();
                        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district;
                        const pincode = data.address?.postcode || "";
                        if (city) setLocation(`${city}${pincode ? ` ${pincode}` : ""}`);
                      } catch {/* ignore */}
                    },
                    () => alert("Please allow location access to detect your city.")
                  );
                }
              }}
              className="flex items-center gap-1 h-10 px-2 text-left hover:bg-secondary/50 border border-transparent hover:border-border rounded-md">

              <MapPin className="h-4 w-4 text-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">Delivering to</span>
                <span className="text-xs font-medium text-foreground leading-tight truncate max-w-[80px] sm:max-w-[100px]">{location}</span>
              </div>
            </button>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-2xl mx-1 sm:mx-2">
              <InstantSearch placeholder="Search products..." />
            </div>

            {/* Spacer for mobile */}
            <div className="md:hidden flex-1" />

            {/* Action Buttons - Icon on top, text below */}
              <div className="hidden md:flex items-center gap-1 -mr-1">
              <Link to="/track-order" className="flex flex-col items-center justify-center w-14 h-14 hover:bg-secondary/50 rounded-md transition-colors">
                <Truck className="h-4.5 w-4.5 text-foreground mb-0.5" />
                <span className="text-[10px] text-foreground font-medium">Track Order</span>
              </Link>
              <Link to="/rfq" className="flex flex-col items-center justify-center w-14 h-14 hover:bg-secondary/50 rounded-md transition-colors">
                <Store className="h-4.5 w-4.5 text-foreground mb-0.5" />
                <span className="text-[10px] text-foreground font-medium">RFQ</span>
              </Link>
              <Link to="/help" className="flex flex-col items-center justify-center w-14 h-14 hover:bg-secondary/50 rounded-md transition-colors">
                <HelpCircle className="h-4.5 w-4.5 text-foreground mb-0.5" />
                <span className="text-[10px] text-foreground font-medium">Help</span>
              </Link>
            </div>

            {/* Cart & User Menu */}
            <div className="flex items-center gap-0 sm:gap-1">
              <div className="flex flex-col items-center justify-center w-10 sm:w-14 h-14">
                <CartSheet />
              </div>

              {/* User Menu */}
              {!isLoading && (
              user ?
              <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center h-14 w-10 sm:w-14 hover:bg-secondary/50 rounded-md transition-colors">
                        <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center sm:mb-0.5",
                      role === "shop" ? "border-shop bg-shop/10" : role === "retail" ? "border-retail bg-retail/10" : "border-primary bg-primary/10"
                    )}>
                          <User className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <div className="hidden sm:flex items-center gap-0.5">
                          <span className="text-[10px] font-medium text-foreground truncate max-w-[50px]">
                            Account
                          </span>
                          <ChevronDown className="h-2.5 w-2.5" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel className="py-2">
                        <p className="font-medium text-sm">{profile?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{role || "Buyer"} Account</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {role === "admin" &&
                  <Link to="/admin">
                          <DropdownMenuItem className="text-sm">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Admin Panel
                          </DropdownMenuItem>
                        </Link>
                  }
                      <Link to="/dashboard">
                        <DropdownMenuItem className="text-sm">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          My Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/chat">
                        <DropdownMenuItem className="text-sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Messages
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-destructive text-sm">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu> :

              <Link to="/login">
                    <button className="flex flex-col items-center justify-center h-14 w-10 sm:w-14 hover:bg-secondary/50 rounded-md transition-colors">
                      <div className="w-6 h-6 rounded-full border-2 border-foreground flex items-center justify-center sm:mb-0.5">
                        <User className="h-3.5 w-3.5 text-foreground" />
                      </div>
                      <div className="hidden sm:flex items-center gap-0.5">
                        <span className="text-[10px] font-medium text-foreground">Account</span>
                        <ChevronDown className="h-2.5 w-2.5" />
                      </div>
                    </button>
                  </Link>)

              }
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Header - Mega Menu Bar (Desktop/Tablet only) */}
      <div className="hidden md:block bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 bg-primary-dark">
          <div className="flex items-center h-10 overflow-x-auto">
            <nav className="flex items-center gap-1">
              {/* All Menu - opens full categories page */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 text-xs font-medium hover:bg-primary-light rounded transition-colors whitespace-nowrap flex items-center gap-1">
                    <Menu className="h-3.5 w-3.5" />
                    All
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-[60vh] overflow-y-auto">
                  <DropdownMenuLabel className="text-xs">All Categories</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((cat) =>
                  <Link key={cat.id} to={`/products?category=${cat.slug}`}>
                      <DropdownMenuItem className="text-sm cursor-pointer">
                        {cat.name}
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <Link to="/products">
                    <DropdownMenuItem className="text-sm font-medium cursor-pointer">
                      View All Products
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="w-px h-4 bg-primary-foreground/20" />
              {/* 8 visible categories */}
              {categories.slice(0, 8).map((cat) =>
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="px-2.5 py-1.5 text-xs font-medium hover:bg-primary-light rounded transition-colors whitespace-nowrap">

                  {cat.name}
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>);

}