import { useState } from "react";
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
  ChevronDown,
  LogOut,
  Tag,
  Star,
  PanelTop,
  Image,
  Megaphone,
  Ticket,
  MapPin,
} from "lucide-react";

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  children?: { icon: any; label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  {
    icon: Package,
    label: "Products",
    href: "/admin/products",
    children: [
      { icon: Package, label: "All Products", href: "/admin/products" },
      { icon: Layers, label: "Categories", href: "/admin/categories" },
      { icon: Tag, label: "Attributes", href: "/admin/attributes" },
    ],
  },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  { icon: FileText, label: "RFQ Requests", href: "/admin/rfq" },
  { icon: Image, label: "Hero & Banners", href: "/admin/hero-slides" },
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
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/admin" && location.pathname.startsWith(href));

  const isParentActive = (item: MenuItem) =>
    item.children?.some(child => isActive(child.href)) || false;

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
            <span className="font-display font-bold text-sidebar-foreground">Admin Panel</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-sidebar-foreground hover:bg-sidebar-accent">
          <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openDropdowns.includes(item.label) || isParentActive(item);
            const active = hasChildren ? isParentActive(item) : isActive(item.href);

            if (hasChildren && !collapsed) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <ul className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
                      {item.children!.map((child) => (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                              isActive(child.href)
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <child.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            // For collapsed or non-dropdown items
            const linkHref = hasChildren ? item.children![0].href : item.href;
            return (
              <li key={item.label}>
                <Link
                  to={linkHref}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    active
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
