import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BottomNavigation } from "@/components/layout/BottomNavigation";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import RFQ from "./pages/RFQ";
import Checkout from "./pages/Checkout";
import Chat from "./pages/Chat";
import Help from "./pages/Help";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";
 import Dashboard from "./pages/Dashboard";

// Admin
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminUserCreate from "./pages/admin/UserCreate";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminRFQ from "./pages/admin/RFQ";
import AdminCategories from "./pages/admin/Categories";
import AdminChat from "./pages/admin/Chat";
import AdminNotifications from "./pages/admin/Notifications";
import AdminSettings from "./pages/admin/Settings";
import AdminInvoices from "./pages/admin/Invoices";
import AdminOffers from "./pages/admin/Offers";
import AdminReviews from "./pages/admin/Reviews";
import AdminCustomTabs from "./pages/admin/CustomTabs";
import AdminHeroSlides from "./pages/admin/HeroSlides";
import AdminPromoBanners from "./pages/admin/PromoBanners";
import AdminCoupons from "./pages/admin/Coupons";
import AdminPincodes from "./pages/admin/Pincodes";
import AdminHomepageSections from "./pages/admin/HomepageSections";
import AdminAttributes from "./pages/admin/Attributes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/rfq" element={<RFQ />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/help" element={<Help />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/new" element={<AdminUserCreate />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="rfq" element={<AdminRFQ />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="hero-slides" element={<AdminHeroSlides />} />
              <Route path="promo-banners" element={<AdminPromoBanners />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="pincodes" element={<AdminPincodes />} />
              <Route path="chat" element={<AdminChat />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="offers" element={<AdminOffers />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="custom-tabs" element={<AdminCustomTabs />} />
              <Route path="homepage-sections" element={<AdminHomepageSections />} />
              <Route path="attributes" element={<AdminAttributes />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNavigation />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
