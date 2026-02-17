import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Truck, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import type { Database } from "@/integrations/supabase/types";

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, role } = useAuth();
  const { items, buyerType, getItemPrice, subtotal, allMoqValid, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 500 ? 0 : 25;
  const total = subtotal + tax + shipping;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !allMoqValid) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Create order
      const orderData: Omit<OrderInsert, "order_number"> = {
        user_id: user.id,
        buyer_type: (role === "shop" ? "shop" : "retail") as "admin" | "shop" | "retail",
        subtotal,
        tax,
        shipping,
        total,
        shipping_address: {
          full_name: formData.get("fullName") as string,
          company: formData.get("company") as string,
          address: formData.get("address") as string,
          city: formData.get("city") as string,
          state: formData.get("state") as string,
          postal_code: formData.get("postalCode") as string,
          country: formData.get("country") as string,
          phone: formData.get("phone") as string,
        } as unknown as Database["public"]["Tables"]["orders"]["Row"]["shipping_address"],
        billing_address: {
          gst_number: formData.get("gstNumber") as string,
          company_name: formData.get("billingCompany") as string,
        } as unknown as Database["public"]["Tables"]["orders"]["Row"]["billing_address"],
        notes: formData.get("notes") as string || null,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData as OrderInsert)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variation_id: item.variation_id,
        product_name: item.product?.name || "Unknown",
        variation_details: item.variation
          ? [item.variation.size, item.variation.color].filter(Boolean).join(" / ")
          : null,
        quantity: item.quantity,
        unit_price: getItemPrice(item),
        total_price: getItemPrice(item) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create invoice
      const invoiceData: Omit<InvoiceInsert, "invoice_number"> = {
        order_id: order.id,
        user_id: user.id,
        amount: subtotal,
        tax,
        total,
      };

      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert(invoiceData as InvoiceInsert);

      if (invoiceError) throw invoiceError;

      // Clear cart
      await clearCart();

      // Send order notification email
      try {
        await supabase.functions.invoke("send-order-notification", {
          body: {
            type: "new_order",
            to_email: user.email,
            buyer_name: formData.get("fullName") as string || profile?.full_name || "Customer",
            order_number: order.order_number,
            order_total: total,
            subtotal,
            tax,
            shipping,
            items_count: items.length,
            gst_number: formData.get("gstNumber") as string || undefined,
            company_name: formData.get("billingCompany") as string || undefined,
            shipping_address: {
              full_name: formData.get("fullName") as string,
              company: formData.get("company") as string,
              address: formData.get("address") as string,
              city: formData.get("city") as string,
              state: formData.get("state") as string,
              postal_code: formData.get("postalCode") as string,
              country: formData.get("country") as string,
              phone: formData.get("phone") as string,
            },
            items: items.map((item) => ({
              name: item.product?.name || "Product",
              quantity: item.quantity,
              unit_price: getItemPrice(item),
              total_price: getItemPrice(item) * item.quantity,
              image: (item.product as any)?.images?.[0] || undefined,
              variation: item.variation
                ? [item.variation.size, item.variation.color].filter(Boolean).join(" / ")
                : undefined,
            })),
          },
        });
      } catch (emailError) {
        console.error("Failed to send order notification email:", emailError);
      }

      setOrderNumber(order.order_number);
      setOrderPlaced(true);

      toast({
        title: "Order Placed!",
        description: `Your order ${order.order_number} has been placed successfully.`,
      });
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Login</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to checkout.</p>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-4">
                Order Placed Successfully!
              </h1>
              <p className="text-muted-foreground mb-2">
                Thank you for your order.
              </p>
              <p className="text-lg font-semibold text-foreground mb-8">
                Order Number: <span className="text-accent">{orderNumber}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate("/products")} variant="outline">
                  Continue Shopping
                </Button>
                <Button onClick={() => navigate("/dashboard")} className="bg-gradient-accent">
                  View Orders
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-6">Add some products to checkout.</p>
            <Button onClick={() => navigate("/products")}>Browse Products</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Checkout" description="Complete your order on VendorHub. Secure checkout with multiple payment options." noIndex />
      <Header />
      
      <main className="pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 pt-4"
          >
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              Checkout
            </h1>
            <p className="text-muted-foreground">
              Complete your order
              {buyerType === "shop" && (
                <span className="font-semibold text-shop"> with Wholesale pricing</span>
              )}
              {buyerType === "retail" && (
                <span className="font-semibold text-retail"> with Retail pricing</span>
              )}
            </p>
          </motion.div>

          {!allMoqValid && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive mb-6">
              <AlertTriangle className="h-5 w-5" />
              <span>Some items don't meet minimum order quantity. Please update your cart.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Shipping & Billing */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          defaultValue={profile?.full_name || ""}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input
                          id="company"
                          name="company"
                          defaultValue={profile?.company_name || ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input id="address" name="address" required />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" name="city" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input id="state" name="state" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code *</Label>
                        <Input id="postalCode" name="postalCode" required />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input id="country" name="country" defaultValue="India" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone || ""} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="billingCompany">Company Name (Optional)</Label>
                        <Input
                          id="billingCompany"
                          name="billingCompany"
                          placeholder="Your company name"
                          defaultValue={profile?.company_name || ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                        <Input
                          id="gstNumber"
                          name="gstNumber"
                          placeholder="For GST invoice"
                        />
                        <p className="text-xs text-muted-foreground">Enter GST number for a GST-compliant invoice</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Special delivery instructions, etc."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-36">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <p className="font-medium truncate">{item.product?.name}</p>
                            <p className="text-muted-foreground">
                              {item.quantity} x ₹{getItemPrice(item).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <p className="font-semibold">
                            ₹{(getItemPrice(item) * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (10%)</span>
                        <span>₹{tax.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-accent">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-accent hover:opacity-90"
                      size="lg"
                      disabled={isSubmitting || !allMoqValid}
                    >
                      {isSubmitting ? "Placing Order..." : "Place Order"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By placing an order, you agree to our Terms of Service.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}