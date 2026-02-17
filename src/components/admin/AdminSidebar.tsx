import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ShoppingCart,
  FileText,
  Bell,
  Settings,
  MessageSquare,
  ChevronLeft,
  LogOut,
  Tag,
  Star,
  PanelTop,
  Image,
  Megaphone,
  Ticket,
  MapPin,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Package, label: "Products", href: "/admin/products" },
  { icon: Layers, label: "Categories", href: "/admin/categories" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  { icon: FileText, label: "RFQ Requests", href: "/admin/rfq" },
  { icon: Image, label: "Hero Slides", href: "/admin/hero-slides" },
  { icon: Megaphone, label: "Promo Banners", href: "/admin/promo-banners" },
  { icon: Ticket, label: "Coupons", href: "/admin/coupons" },
  { icon: MapPin, label: "Delivery Pincodes", href: "/admin/pincodes" },
  { icon: Tag, label: "Offers", href: "/admin/offers" },
  { icon: Star, label: "Reviews", href: "/admin/reviews" },
  { icon: PanelTop, label: "Custom Tabs", href: "/admin/custom-tabs" },
  { icon: MessageSquare, label: "Chat", href: "/admin/chat" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-[70px]" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <span className="text-sm font-bold text-accent-foreground">B</span>
            </div>
            <span className="font-display font-bold text-sidebar-foreground">
              Admin Panel
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/admin" && location.pathname.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          )}
        >
          <LogOut className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </Link>
      </div>
    </aside>
  );
}