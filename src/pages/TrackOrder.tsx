import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Package, Clock, CheckCircle, XCircle, Search, Loader2, ShoppingCart, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";

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

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);

    // Try exact match first, then case-insensitive
    let { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.trim())
      .maybeSingle();

    if (!data) {
      // Try ilike for case-insensitive match
      const { data: ilikeData } = await supabase
        .from("orders")
        .select("*")
        .ilike("order_number", orderNumber.trim())
        .maybeSingle();
      data = ilikeData;
    }

    if (data) {
      setOrder(data);
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", data.id);
      setOrderItems(items || []);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const currentStepIndex = order ? statusSteps.indexOf(order.status || "pending") : -1;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Track Order" description="Track your VendorHub order status in real-time. Enter your order number to get updates." />
      <Header />
      <main className="pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-8 mt-6">Track Your Order</h1>

          {/* Search */}
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Enter Order Number (e.g., ORD-001)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="h-11"
            />
            <Button onClick={handleTrack} disabled={loading} className="h-11 px-6 bg-accent hover:bg-accent-hover">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Premium Animation Below Input */}
          <AnimatePresence>
            {!order && !notFound && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 border border-border p-8">
                  <div className="flex flex-col items-center text-center">
                    {/* Animated truck */}
                    <motion.div
                      animate={{
                        x: [0, 10, 0, -10, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="mb-4"
                    >
                      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                        <Truck className="h-10 w-10 text-accent" />
                      </div>
                    </motion.div>
                    
                    {/* Animated dots path */}
                    <div className="flex items-center gap-2 mb-4">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-2 h-2 rounded-full bg-accent"
                        />
                      ))}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-1">Where's My Order?</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Enter your order number above to track your shipment in real-time. Get instant updates on your delivery status.
                    </p>

                    {/* Feature cards */}
                    <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-sm">
                      {[
                        { icon: ShoppingCart, label: "Order Placed", color: "text-primary" },
                        { icon: Box, label: "In Transit", color: "text-accent" },
                        { icon: CheckCircle, label: "Delivered", color: "text-success" },
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + idx * 0.15 }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-background/80 border border-border/50"
                        >
                          <item.icon className={cn("h-5 w-5", item.color)} />
                          <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {notFound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card>
                  <CardContent className="py-8 text-center">
                    <XCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
                    <p className="text-foreground font-medium">Order not found</p>
                    <p className="text-sm text-muted-foreground mt-1">Please check your order number and try again.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {order && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{order.order_number}</CardTitle>
                      <Badge className={cn("text-xs", statusColors[order.status || "pending"])}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Steps */}
                    {order.status !== "cancelled" && (
                      <div className="flex items-center justify-between mb-6">
                        {statusSteps.map((step, idx) => {
                          const isComplete = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          const StepIcon = statusIcons[step];
                          return (
                            <motion.div
                              key={step}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex flex-col items-center flex-1 relative"
                            >
                              {idx > 0 && (
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: idx * 0.15, duration: 0.3 }}
                                  className={cn(
                                    "absolute top-4 right-1/2 w-full h-0.5 -z-10 origin-right",
                                    idx <= currentStepIndex ? "bg-success" : "bg-border"
                                  )}
                                />
                              )}
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                                isComplete ? "bg-success border-success text-white" : "bg-card border-border text-muted-foreground",
                                isCurrent && "ring-2 ring-success/30"
                              )}>
                                <StepIcon className="h-4 w-4" />
                              </div>
                              <span className={cn(
                                "text-[9px] mt-1 capitalize",
                                isComplete ? "text-foreground font-medium" : "text-muted-foreground"
                              )}>
                                {step}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Items</h3>
                      {orderItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex justify-between py-2 border-b last:border-0 text-sm"
                        >
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">₹{Number(item.total_price).toLocaleString("en-IN")}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between pt-3 border-t mt-3 font-bold">
                      <span>Total</span>
                      <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
