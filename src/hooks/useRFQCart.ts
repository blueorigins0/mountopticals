 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 
 // Generate a session ID for guest users
 const getSessionId = () => {
   let sessionId = localStorage.getItem("rfq_session_id");
   if (!sessionId) {
     sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
     localStorage.setItem("rfq_session_id", sessionId);
   }
   return sessionId;
 };
 
 interface RFQCartItem {
   id: string;
   product_id: string;
   variation_id: string | null;
   quantity: number;
   notes: string | null;
   product?: {
     id: string;
     name: string;
     images: string[] | null;
     shop_price: number;
     retail_price: number;
   };
   variation?: {
     id: string;
     size: string | null;
     color: string | null;
     shop_price: number;
     retail_price: number;
   };
 }
 
 export function useRFQCart() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [items, setItems] = useState<RFQCartItem[]>([]);
   const [isLoading, setIsLoading] = useState(false);
 
   const sessionId = getSessionId();
 
   const fetchCart = useCallback(async () => {
     setIsLoading(true);
     try {
       let query = supabase
         .from("rfq_cart_items")
         .select(`
           id,
           product_id,
           variation_id,
           quantity,
           notes,
           product:products(id, name, images, shop_price, retail_price),
           variation:product_variations(id, size, color, shop_price, retail_price)
         `);
 
       if (user) {
         query = query.eq("user_id", user.id);
       } else {
         query = query.eq("session_id", sessionId);
       }
 
       const { data, error } = await query;
 
       if (error) throw error;
       setItems((data as unknown as RFQCartItem[]) || []);
     } catch (error) {
       console.error("Error fetching RFQ cart:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user, sessionId]);
 
   useEffect(() => {
     fetchCart();
   }, [fetchCart]);
 
   const addToRFQCart = async (
     productId: string,
     quantity: number,
     variationId?: string | null,
     notes?: string
   ) => {
     try {
       // Check if item already exists
       const existingItem = items.find(
         (item) =>
           item.product_id === productId &&
           item.variation_id === (variationId || null)
       );
 
       if (existingItem) {
         const newQuantity = existingItem.quantity + quantity;
         return await updateQuantity(existingItem.id, newQuantity);
       }
 
       const insertData: any = {
         product_id: productId,
         variation_id: variationId || null,
         quantity,
         notes: notes || null,
       };
 
       if (user) {
         insertData.user_id = user.id;
       } else {
         insertData.session_id = sessionId;
       }
 
       const { error } = await supabase.from("rfq_cart_items").insert(insertData);
 
       if (error) throw error;
 
       toast({
         title: "Added to RFQ Cart",
         description: "Product added to your quotation request.",
       });
 
       await fetchCart();
       return true;
     } catch (error) {
       console.error("Error adding to RFQ cart:", error);
       toast({
         title: "Error",
         description: "Failed to add product to RFQ cart.",
         variant: "destructive",
       });
       return false;
     }
   };
 
   const updateQuantity = async (itemId: string, quantity: number) => {
     try {
       const { error } = await supabase
         .from("rfq_cart_items")
         .update({ quantity })
         .eq("id", itemId);
 
       if (error) throw error;
 
       await fetchCart();
       return true;
     } catch (error) {
       console.error("Error updating quantity:", error);
       toast({
         title: "Error",
         description: "Failed to update quantity.",
         variant: "destructive",
       });
       return false;
     }
   };
 
   const removeFromCart = async (itemId: string) => {
     try {
       const { error } = await supabase
         .from("rfq_cart_items")
         .delete()
         .eq("id", itemId);
 
       if (error) throw error;
 
       toast({
         title: "Removed",
         description: "Product removed from RFQ cart.",
       });
 
       await fetchCart();
       return true;
     } catch (error) {
       console.error("Error removing from RFQ cart:", error);
       toast({
         title: "Error",
         description: "Failed to remove product.",
         variant: "destructive",
       });
       return false;
     }
   };
 
   const clearCart = async () => {
     try {
       let query = supabase.from("rfq_cart_items").delete();
 
       if (user) {
         query = query.eq("user_id", user.id);
       } else {
         query = query.eq("session_id", sessionId);
       }
 
       const { error } = await query;
 
       if (error) throw error;
       setItems([]);
     } catch (error) {
       console.error("Error clearing RFQ cart:", error);
     }
   };
 
   const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
 
   return {
     items,
     isLoading,
     addToRFQCart,
     updateQuantity,
     removeFromCart,
     clearCart,
     itemCount,
     refresh: fetchCart,
   };
 }