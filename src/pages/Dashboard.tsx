import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  FileText, 
  Download, 
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Eye,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RFQTab } from "@/components/dashboard/RFQTab";
import { BuyerSidebar } from "@/components/dashboard/BuyerSidebar";
import { SEOHead } from "@/components/SEOHead";

type Order = Tables<"orders">;
type Invoice = Tables<"invoices">;
 
interface ExtendedProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  gst_number: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-accent/10 text-accent",
  shipped: "bg-info/10 text-info",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  const { user, profile, role, isLoading: authLoading, refreshProfile, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    gst_number: "",
  });

  // Cast profile to extended type with all fields
  const extendedProfile = profile as unknown as ExtendedProfile | null;

  useEffect(() => {
    if (extendedProfile) {
      setProfileForm({
        full_name: extendedProfile.full_name || "",
        company_name: extendedProfile.company_name || "",
        phone: extendedProfile.phone || "",
        address: extendedProfile.address || "",
        city: extendedProfile.city || "",
        state: extendedProfile.state || "",
        country: extendedProfile.country || "",
        postal_code: extendedProfile.postal_code || "",
        gst_number: extendedProfile.gst_number || "",
      });
    }
  }, [extendedProfile]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileForm)
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const { generateGSTInvoice } = await import("@/lib/generateInvoice");
      
      // Fetch order and items
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("id", invoice.order_id).single(),
        supabase.from("order_items").select("*").eq("order_id", invoice.order_id),
      ]);
      
      if (orderRes.error || !orderRes.data) throw new Error("Order not found");
      const order = orderRes.data;
      const items = itemsRes.data || [];

      const doc = generateGSTInvoice({
        invoice_number: invoice.invoice_number,
        order_number: order.order_number,
        date: new Date(invoice.created_at).toLocaleDateString("en-IN"),
        buyer_name: extendedProfile?.full_name || "Customer",
        buyer_email: extendedProfile?.email,
        buyer_phone: extendedProfile?.phone || undefined,
        company_name: extendedProfile?.company_name || undefined,
        gst_number: extendedProfile?.gst_number || undefined,
        shipping_address: order.shipping_address as any,
        items: items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          variation: item.variation_details || undefined,
        })),
        subtotal: Number(order.subtotal),
        tax: Number(order.tax || 0),
        shipping: Number(order.shipping || 0),
        total: Number(order.total),
      });
      
      doc.save(`${invoice.invoice_number}.pdf`);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded as PDF.`,
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Overview Tab Content
  const OverviewContent = () => (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Welcome back, <span className="text-accent">{profile?.full_name || "Buyer"}</span>
        </h1>
        <p className="text-muted-foreground">Manage your orders, invoices, and account settings</p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === "pending" || o.status === "processing").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === "delivered").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  ₹{orders.reduce((sum, o) => sum + Number(o.total), 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("orders")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.slice(0, 5).length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No orders yet</p>
              <Button asChild className="mt-3">
                <Link to="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const StatusIcon = statusIcons[order.status || "pending"];
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">₹{Number(order.total).toLocaleString("en-IN")}</p>
                      <Badge className={cn("text-xs", statusColors[order.status || "pending"])}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );


  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    setOrderItems(data || []);
    setLoadingItems(false);
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" as const } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: "cancelled" as const } : null);
      toast({ title: "Order Cancelled", description: "Your order has been cancelled." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
    }
  };

  const downloadOrderInvoice = async (order: Order) => {
    try {
      const { generateGSTInvoice } = await import("@/lib/generateInvoice");
      
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      const doc = generateGSTInvoice({
        invoice_number: `INV-${order.order_number}`,
        order_number: order.order_number,
        date: new Date(order.created_at).toLocaleDateString("en-IN"),
        buyer_name: extendedProfile?.full_name || "Customer",
        buyer_email: extendedProfile?.email,
        buyer_phone: extendedProfile?.phone || undefined,
        company_name: extendedProfile?.company_name || undefined,
        gst_number: extendedProfile?.gst_number || undefined,
        shipping_address: order.shipping_address as any,
        items: (items || []).map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          variation: item.variation_details || undefined,
        })),
        subtotal: Number(order.subtotal),
        tax: Number(order.tax || 0),
        shipping: Number(order.shipping || 0),
        total: Number(order.total),
      });
      
      doc.save(`Invoice-${order.order_number}.pdf`);
      toast({ title: "Invoice Downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to download invoice", variant: "destructive" });
    }
  };

  // Orders Tab Content
  const OrdersContent = () => {
    if (selectedOrder) {
      const StatusIcon = statusIcons[selectedOrder.status || "pending"];
      return (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
            ← Back to Orders
          </Button>
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>{selectedOrder.order_number}</CardTitle>
                  <CardDescription>
                    Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", statusColors[selectedOrder.status || "pending"])}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {selectedOrder.status}
                  </Badge>
                  {(selectedOrder.status === "pending" || selectedOrder.status === "confirmed") && (
                    <Button variant="destructive" size="sm" onClick={() => cancelOrder(selectedOrder.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Cancel Order
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => downloadOrderInvoice(selectedOrder)}>
                    <Download className="h-4 w-4 mr-1" /> Invoice PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">Order Items</h3>
                  <div className="divide-y">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString()}</p>
                        </div>
                        <p className="font-semibold">₹{Number(item.total_price).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(selectedOrder.subtotal).toLocaleString()}</span></div>
                    {selectedOrder.tax && <div className="flex justify-between"><span>Tax (GST)</span><span>₹{Number(selectedOrder.tax).toLocaleString()}</span></div>}
                    {selectedOrder.shipping && <div className="flex justify-between"><span>Shipping</span><span>₹{Number(selectedOrder.shipping).toLocaleString()}</span></div>}
                    <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>₹{Number(selectedOrder.total).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and track all your orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <Button asChild className="mt-4">
                <Link to="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = statusIcons[order.status || "pending"];
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{Number(order.total).toLocaleString()}</p>
                        <Badge className={cn("text-xs", statusColors[order.status || "pending"])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => viewOrder(order)} title="View Order">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => downloadOrderInvoice(order)} title="Download Invoice">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Invoices Tab Content
  const InvoicesContent = () => (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Download and manage your invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-foreground">₹{Number(invoice.total).toLocaleString("en-IN")}</p>
                    <Badge
                      className={cn(
                        "text-xs",
                        invoice.status === "paid"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      )}
                    >
                      {invoice.status || "unpaid"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownloadInvoice(invoice)}
                    title="Download Invoice"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Profile Tab Content
  const ProfileContent = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Profile Summary */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mb-4",
                role === "shop" ? "bg-gradient-shop" : role === "retail" ? "bg-gradient-retail" : "bg-gradient-primary"
              )}
            >
              <User className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {extendedProfile?.full_name || "User"}
            </h3>
            <p className="text-muted-foreground">{extendedProfile?.company_name || "No company"}</p>
            <Badge className={cn("mt-2", role === "shop" ? "bg-shop" : "bg-retail")}>
              {role === "shop" ? "Shop Buyer" : "Retail Buyer"}
            </Badge>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              {extendedProfile?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{extendedProfile.phone}</span>
                </div>
              )}
              {extendedProfile?.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {extendedProfile.city}, {extendedProfile.state}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={profileForm.company_name}
                onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                value={profileForm.gst_number}
                onChange={(e) => setProfileForm({ ...profileForm, gst_number: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={profileForm.postal_code}
                onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={profileForm.country}
                onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-gradient-accent">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return <OrdersContent />;
      case "rfq":
        return <RFQTab />;
      case "invoices":
        return <InvoicesContent />;
      case "profile":
        return <ProfileContent />;
      default:
        return <OverviewContent />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "orders":
        return "My Orders";
      case "rfq":
        return "RFQ Requests";
      case "invoices":
        return "My Invoices";
      case "profile":
        return "My Profile";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:block transition-all duration-300",
        sidebarCollapsed ? "w-[70px]" : "w-64"
      )}>
        <BuyerSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <BuyerSidebar
            collapsed={false}
            onToggle={() => {}}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setMobileOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300",
        !sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
      )}>
        {/* Fixed Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{getTabTitle()}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {activeTab === "overview" ? "Overview of your account" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {role && (
              <Badge className={role === "shop" ? "bg-shop" : "bg-retail"}>
                {role === "shop" ? <Building2 className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                {role === "shop" ? "Shop" : "Retail"}
              </Badge>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              role === "shop" ? "bg-gradient-shop" : role === "retail" ? "bg-gradient-retail" : "bg-gradient-primary"
            )}>
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
