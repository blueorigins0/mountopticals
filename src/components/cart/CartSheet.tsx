import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, AlertTriangle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

export function CartSheet() {
  const {
    items,
    isLoading,
    buyerType,
    updateQuantity,
    removeFromCart,
    getItemPrice,
    getItemMoq,
    validateMoq,
    subtotal,
    itemCount,
    allMoqValid,
  } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative flex flex-col items-center justify-center hover:bg-secondary/50 rounded-md transition-colors">
          <div className="relative">
            <div className="w-6 h-6 rounded-full border-2 border-foreground flex items-center justify-center">
              <ShoppingCart className="h-3.5 w-3.5 text-foreground" />
            </div>
            {itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[9px] bg-accent">
                {itemCount}
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-foreground font-medium mt-0.5 hidden sm:block">Cart</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
            <Badge variant="secondary" className="ml-2">
              {buyerType === "shop" ? "Wholesale" : "Retail"} Pricing
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Link to="/products" className="mt-4">
                <Button variant="outline">Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const price = getItemPrice(item);
                const moq = getItemMoq(item);
                const isValidMoq = validateMoq(item);
                const productImage = item.product?.images?.[0];

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex gap-4 p-3 rounded-lg border",
                      !isValidMoq ? "border-destructive bg-destructive/5" : "border-border"
                    )}
                  >
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.product?.name || "Unknown Product"}
                      </h4>
                      {item.variation && (
                        <p className="text-xs text-muted-foreground">
                          {[item.variation.size, item.variation.color]
                            .filter(Boolean)
                            .join(" / ")}
                        </p>
                      )}
                      <p className={cn(
                        "text-sm font-bold mt-1",
                        buyerType === "shop" ? "text-shop" : "text-retail"
                      )}>
                        ₹{price.toLocaleString("en-IN")} each
                      </p>

                      {/* MOQ Warning */}
                      {!isValidMoq && (
                        <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          Min. {moq} units required
                        </div>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-secondary"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-secondary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        ₹{(price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="flex-col gap-4 border-t pt-4">
            {!allMoqValid && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Some items don't meet the minimum order quantity.</span>
              </div>
            )}

            <div className="flex items-center justify-between w-full">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            <Link to="/checkout" className="w-full">
              <Button
                className="w-full bg-gradient-accent hover:opacity-90"
                disabled={!allMoqValid}
              >
                Proceed to Checkout
              </Button>
            </Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}