import { Link, useLocation } from "react-router-dom";
import {
  Package,
  FileText,
  User,
  ShoppingCart,
  FileQuestion,
  MessageSquare,
  ChevronLeft,
  LogOut,
  Home,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", tab: "overview" },
  { icon: ShoppingCart, label: "Orders", tab: "orders" },
  { icon: FileQuestion, label: "RFQ Requests", tab: "rfq" },
  { icon: FileText, label: "Invoices", tab: "invoices" },
  { icon: User, label: "Profile", tab: "profile" },
];

const quickLinks = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
];

interface BuyerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BuyerSidebar({ collapsed, onToggle, activeTab, onTabChange }: BuyerSidebarProps) {
  const location = useLocation();
  const { signOut, role } = useAuth();

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
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <span className="text-sm font-bold text-accent-foreground">V</span>
            </div>
            <span className="font-display font-bold text-sidebar-foreground">
              Vendor<span className="text-accent">Hub</span>
            </span>
          </Link>
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
      <ScrollArea className="flex-1 py-4 px-2">
        {/* Main Menu */}
        <div className="mb-6">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              My Account
            </p>
          )}
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.tab;
              
              return (
                <li key={item.tab}>
                  <button
                    onClick={() => onTabChange(item.tab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Quick Links
            </p>
          )}
          <ul className="space-y-1">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center"
          )}
        >
          <LogOut className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
