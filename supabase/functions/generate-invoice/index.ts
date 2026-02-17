 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface InvoiceRequest {
   order_id: string;
 }
 
 serve(async (req: Request) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { order_id }: InvoiceRequest = await req.json();
 
     if (!order_id) {
       throw new Error("Missing order_id");
     }
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 
     const supabase = createClient(supabaseUrl, supabaseServiceKey, {
       auth: { autoRefreshToken: false, persistSession: false },
     });
 
     // Fetch order details
     const { data: order, error: orderError } = await supabase
       .from("orders")
       .select("*")
       .eq("id", order_id)
       .single();
 
     if (orderError || !order) {
       throw new Error("Order not found");
     }
 
     // Fetch order items
     const { data: items, error: itemsError } = await supabase
       .from("order_items")
       .select("*")
       .eq("order_id", order_id);
 
     if (itemsError) {
       throw new Error("Failed to fetch order items");
     }
 
     // Fetch buyer profile
     const { data: profile } = await supabase
       .from("profiles")
       .select("*")
       .eq("user_id", order.user_id)
       .single();
 
     // Check if invoice already exists
     const { data: existingInvoice } = await supabase
       .from("invoices")
       .select("*")
       .eq("order_id", order_id)
       .single();
 
     if (existingInvoice) {
       return new Response(JSON.stringify({ 
         success: true, 
         invoice: existingInvoice,
         message: "Invoice already exists"
       }), {
         status: 200,
         headers: { "Content-Type": "application/json", ...corsHeaders },
       });
     }
 
     // Create invoice record
     const { data: invoice, error: invoiceError } = await supabase
       .from("invoices")
       .insert({
         order_id: order_id,
         user_id: order.user_id,
         amount: order.subtotal,
         tax: order.tax || 0,
         total: order.total,
         status: "unpaid",
         due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
       })
       .select()
       .single();
 
     if (invoiceError) {
       console.error("Invoice creation error:", invoiceError);
       throw new Error("Failed to create invoice");
     }
 
     // Generate HTML invoice content for download
     const invoiceHtml = generateInvoiceHtml({
       invoice,
       order,
       items: items || [],
       profile,
     });
 
     console.log("Invoice created successfully:", invoice.invoice_number);
 
     return new Response(JSON.stringify({ 
       success: true, 
       invoice,
       html: invoiceHtml,
     }), {
       status: 200,
       headers: { "Content-Type": "application/json", ...corsHeaders },
     });
   } catch (error: any) {
     console.error("Error generating invoice:", error);
     return new Response(JSON.stringify({ error: error.message }), {
       status: 500,
       headers: { "Content-Type": "application/json", ...corsHeaders },
     });
   }
 });
 
 function generateInvoiceHtml(data: {
   invoice: any;
   order: any;
   items: any[];
   profile: any;
 }) {
   const { invoice, order, items, profile } = data;
   
   const itemsHtml = items.map(item => `
     <tr>
       <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
       <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
       <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${Number(item.unit_price).toFixed(2)}</td>
       <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${Number(item.total_price).toFixed(2)}</td>
     </tr>
   `).join('');
 
   return `
     <!DOCTYPE html>
     <html>
     <head>
       <meta charset="utf-8">
       <title>Invoice ${invoice.invoice_number}</title>
       <style>
         body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; }
         .invoice { max-width: 800px; margin: 0 auto; }
         .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
         .company { font-size: 24px; font-weight: bold; color: #1a1a1a; }
         .invoice-title { font-size: 32px; color: #f97316; font-weight: bold; }
         .invoice-number { color: #6b7280; margin-top: 8px; }
         .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
         .address-block { width: 45%; }
         .address-label { font-weight: 600; color: #374151; margin-bottom: 8px; }
         table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
         th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
         .totals { text-align: right; }
         .total-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
         .total-label { width: 150px; color: #6b7280; }
         .total-value { width: 120px; text-align: right; }
         .grand-total { font-size: 18px; font-weight: bold; color: #1a1a1a; border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 12px; }
         .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
       </style>
     </head>
     <body>
       <div class="invoice">
         <div class="header">
           <div>
             <div class="company">B2BMarket</div>
             <div style="color: #6b7280; margin-top: 8px;">
               Wholesale & Retail B2B Platform<br>
               contact@b2bmarket.com
             </div>
           </div>
           <div style="text-align: right;">
             <div class="invoice-title">INVOICE</div>
             <div class="invoice-number">${invoice.invoice_number}</div>
             <div style="color: #6b7280; margin-top: 8px;">
               Date: ${new Date(invoice.created_at).toLocaleDateString()}<br>
               Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
             </div>
           </div>
         </div>
 
         <div class="addresses">
           <div class="address-block">
             <div class="address-label">Bill To:</div>
             <div>
               ${profile?.full_name || 'Customer'}<br>
               ${profile?.company_name ? profile.company_name + '<br>' : ''}
               ${profile?.address || ''}<br>
               ${profile?.city ? profile.city + ', ' : ''}${profile?.state || ''} ${profile?.postal_code || ''}<br>
               ${profile?.email || ''}
             </div>
           </div>
           <div class="address-block">
             <div class="address-label">Order Details:</div>
             <div>
               Order #: ${order.order_number}<br>
               Buyer Type: ${order.buyer_type}<br>
               Status: ${order.status}
             </div>
           </div>
         </div>
 
         <table>
           <thead>
             <tr>
               <th>Product</th>
               <th style="text-align: center;">Qty</th>
               <th style="text-align: right;">Unit Price</th>
               <th style="text-align: right;">Total</th>
             </tr>
           </thead>
           <tbody>
             ${itemsHtml}
           </tbody>
         </table>
 
         <div class="totals">
           <div class="total-row">
             <span class="total-label">Subtotal:</span>
             <span class="total-value">$${Number(order.subtotal).toFixed(2)}</span>
           </div>
           <div class="total-row">
             <span class="total-label">Tax:</span>
             <span class="total-value">$${Number(order.tax || 0).toFixed(2)}</span>
           </div>
           <div class="total-row">
             <span class="total-label">Shipping:</span>
             <span class="total-value">$${Number(order.shipping || 0).toFixed(2)}</span>
           </div>
           <div class="total-row grand-total">
             <span class="total-label">Total:</span>
             <span class="total-value">$${Number(order.total).toFixed(2)}</span>
           </div>
         </div>
 
         <div class="footer">
           <p>Thank you for your business!</p>
           <p>Payment is due within 30 days of invoice date. Please include invoice number with your payment.</p>
         </div>
       </div>
     </body>
     </html>
   `;
 }