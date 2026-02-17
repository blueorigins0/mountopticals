import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useOrderNotificationSound } from "@/hooks/useOrderNotificationSound";

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Listen for new order notifications with sound
  useOrderNotificationSound();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Desktop/Tablet Sidebar - visible on md and up */}
      <div className="hidden md:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar - only on small screens */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen h-screen flex flex-col transition-all duration-300",
          "md:ml-64",
          sidebarCollapsed && "md:ml-[70px]"
        )}
      >
        <AdminHeader onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}