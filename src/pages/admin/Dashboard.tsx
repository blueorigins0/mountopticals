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
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "Total Revenue",
    value: "₹12,45,920",
    change: "+12.5%",
    trend: "up",
    icon: IndianRupee,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    title: "Total Orders",
    value: "1,429",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Active Users",
    value: "892",
    change: "+15.3%",
    trend: "up",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Products",
    value: "245",
    change: "-2.1%",
    trend: "down",
    icon: Package,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

const recentOrders = [
  { id: "#1234", buyer: "ABC Store", type: "shop", amount: "₹1,29,900", status: "completed" },
  { id: "#1233", buyer: "Retail Plus", type: "retail", amount: "₹24,900", status: "processing" },
  { id: "#1232", buyer: "Metro Mart", type: "shop", amount: "₹3,45,000", status: "completed" },
  { id: "#1231", buyer: "Quick Shop", type: "retail", amount: "₹18,900", status: "pending" },
  { id: "#1230", buyer: "Mega Store", type: "shop", amount: "₹5,20,000", status: "completed" },
];

const pendingRFQs = [
  { id: "RFQ-001", buyer: "Big Box Store", product: "Cotton T-Shirts", quantity: 5000 },
  { id: "RFQ-002", buyer: "Fashion Outlet", product: "Denim Jeans", quantity: 2000 },
  { id: "RFQ-003", buyer: "Sports Direct", product: "Running Shoes", quantity: 1500 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-2 text-sm",
                      stat.trend === "up" ? "text-success" : "text-destructive"
                    )}>
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      <span>{stat.change}</span>
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-shop flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-shop-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shop (Wholesale) Orders</p>
                  <p className="text-2xl font-bold text-foreground">847</p>
                  <p className="text-sm text-shop">₹98,42,000 revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-retail flex items-center justify-center">
                  <Store className="h-7 w-7 text-retail-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retailer Orders</p>
                  <p className="text-2xl font-bold text-foreground">582</p>
                  <p className="text-sm text-retail">₹26,17,200 revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
              <CardDescription>Latest orders from your buyers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        order.type === "shop" ? "bg-shop-light" : "bg-retail-light"
                      )}>
                        {order.type === "shop" ? (
                          <Building2 className="h-4 w-4 text-shop" />
                        ) : (
                          <Store className="h-4 w-4 text-retail" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{order.buyer}</p>
                        <p className="text-xs text-muted-foreground">{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{order.amount}</p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        order.status === "completed" && "bg-success/10 text-success",
                        order.status === "processing" && "bg-warning/10 text-warning",
                        order.status === "pending" && "bg-muted text-muted-foreground"
                      )}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pending RFQ Requests
              </CardTitle>
              <CardDescription>Quotes waiting for your response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRFQs.map((rfq) => (
                  <div key={rfq.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm text-foreground">{rfq.buyer}</p>
                      <p className="text-xs text-muted-foreground">{rfq.product}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{rfq.quantity.toLocaleString()} units</p>
                      <span className="text-xs text-accent">{rfq.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
