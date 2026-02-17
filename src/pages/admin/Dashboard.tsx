import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  IndianRupee, 
  ShoppingCart, 
  Users, 
  Package, 
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Store,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  totalProducts: number;
  shopOrders: number;
  shopRevenue: number;
  retailOrders: number;
  retailRevenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  buyer_type: string;
  total: number;
  status: string;
  user_id: string | null;
  profile?: { full_name: string | null; company_name: string | null };
}

interface PendingRFQ {
  id: string;
  rfq_number: string;
  full_name: string;
  product_name: string;
  quantity: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingRFQs, setPendingRFQs] = useState<PendingRFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      const [ordersRes, productsRes, usersRes, rfqRes, recentOrdersRes] = await Promise.all([
        supabase.from("orders").select("total, buyer_type, status"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("rfq_requests").select("id, rfq_number, full_name, product_name, quantity").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("id, order_number, buyer_type, total, status, user_id").order("created_at", { ascending: false }).limit(5),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const shopOrders = orders.filter(o => o.buyer_type === "shop");
      const retailOrders = orders.filter(o => o.buyer_type === "retail");

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        activeUsers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
        shopOrders: shopOrders.length,
        shopRevenue: shopOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        retailOrders: retailOrders.length,
        retailRevenue: retailOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      });

      // Fetch profiles for recent orders
      const ordersList = recentOrdersRes.data || [];
      if (ordersList.length > 0) {
        const userIds = [...new Set(ordersList.filter(o => o.user_id).map(o => o.user_id!))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, company_name").in("user_id", userIds);
          const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
          setRecentOrders(ordersList.map(o => ({
            ...o,
            profile: o.user_id ? profileMap.get(o.user_id) || undefined : undefined,
          })));
        } else {
          setRecentOrders(ordersList);
        }
      }

      setPendingRFQs(rfqRes.data || []);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: IndianRupee, color: "text-success", bgColor: "bg-success/10" },
    { title: "Total Orders", value: String(stats?.totalOrders || 0), icon: ShoppingCart, color: "text-accent", bgColor: "bg-accent/10" },
    { title: "Active Users", value: String(stats?.activeUsers || 0), icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Products", value: String(stats?.totalProducts || 0), icon: Package, color: "text-warning", bgColor: "bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
            <Card className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-shop flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-shop-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shop (Wholesale) Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.shopOrders || 0}</p>
                  <p className="text-sm text-shop">{formatCurrency(stats?.shopRevenue || 0)} revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-retail flex items-center justify-center">
                  <Store className="h-7 w-7 text-retail-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retailer Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.retailOrders || 0}</p>
                  <p className="text-sm text-retail">{formatCurrency(stats?.retailRevenue || 0)} revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Recent Orders</CardTitle>
              <CardDescription>Latest orders from your buyers</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", order.buyer_type === "shop" ? "bg-shop-light" : "bg-retail-light")}>
                          {order.buyer_type === "shop" ? <Building2 className="h-4 w-4 text-shop" /> : <Store className="h-4 w-4 text-retail" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{order.profile?.company_name || order.profile?.full_name || "Guest"}</p>
                          <p className="text-xs text-muted-foreground">{order.order_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(order.total)}</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full",
                          order.status === "completed" || order.status === "delivered" ? "bg-success/10 text-success" :
                          order.status === "processing" || order.status === "confirmed" ? "bg-warning/10 text-warning" :
                          "bg-muted text-muted-foreground"
                        )}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.7 }}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Pending RFQ Requests</CardTitle>
              <CardDescription>Quotes waiting for your response</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRFQs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No pending RFQs</p>
              ) : (
                <div className="space-y-4">
                  {pendingRFQs.map((rfq) => (
                    <div key={rfq.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-sm text-foreground">{rfq.full_name}</p>
                        <p className="text-xs text-muted-foreground">{rfq.product_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{rfq.quantity.toLocaleString()} units</p>
                        <span className="text-xs text-accent">{rfq.rfq_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
