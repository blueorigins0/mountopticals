 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
interface RFQNotificationRequest {
  type?: "new_rfq" | "rfq_quoted" | "rfq_accepted" | "rfq_rejected";
  to_email?: string;
  recipient_name?: string;
  rfq_number?: string;
  product_name?: string;
  quantity?: number;
  quoted_price?: number;
  buyer_name?: string;
  company_name?: string;
  // Frontend submission format
  rfqNumber?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  productName?: string;
  message?: string;
  buyerType?: string;
  itemCount?: number;
}
 
const getEmailContent = (data: {
  type: string;
  rfq_number: string;
  product_name: string;
  quantity: number;
  buyer_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  message?: string;
  item_count?: number;
  quoted_price?: number;
  recipient_name?: string;
}) => {
   const baseStyles = `
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
     max-width: 600px;
     margin: 0 auto;
     padding: 40px 20px;
     background-color: #f8f9fa;
   `;
   
   const cardStyles = `
     background: white;
     border-radius: 12px;
     padding: 32px;
     box-shadow: 0 2px 8px rgba(0,0,0,0.08);
   `;
 
  switch (data.type) {
     case "new_rfq":
       // Email to admin about new RFQ
       return {
        subject: `New RFQ Request - ${data.rfq_number}`,
         html: `
           <div style="${baseStyles}">
             <div style="${cardStyles}">
              <h1 style="color: #1a1a1a; margin-bottom: 24px;">New RFQ Request 📋</h1>
               <p style="color: #666; font-size: 16px; line-height: 1.6;">
                 A new quote request has been submitted:
               </p>
               <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                 <p style="margin: 0 0 8px 0; color: #92400e;">
                  <strong>RFQ Number:</strong> ${data.rfq_number}
                </p>
                <p style="margin: 0 0 8px 0; color: #92400e;">
                  <strong>Products:</strong> ${data.item_count ? `${data.item_count} products` : data.product_name}
                 </p>
                 <p style="margin: 0 0 8px 0; color: #92400e;">
                  <strong>Total Quantity:</strong> ${data.quantity?.toLocaleString() || 0} units
                 </p>
                 <p style="margin: 0 0 8px 0; color: #92400e;">
                  <strong>Buyer:</strong> ${data.buyer_name || 'N/A'} (${data.company_name || 'N/A'})
                 </p>
                 <p style="margin: 0 0 8px 0; color: #92400e;">
                  <strong>Email:</strong> ${data.email || 'N/A'}
                </p>
                <p style="margin: 0; color: #92400e;">
                  <strong>Phone:</strong> ${data.phone || 'N/A'}
                 </p>
               </div>
              ${data.message ? `
                <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="margin: 0 0 8px 0; color: #374151;">
                    <strong>Message:</strong>
                  </p>
                  <p style="margin: 0; color: #6b7280;">${data.message}</p>
                </div>
              ` : ''}
               <p style="color: #666; font-size: 14px;">
                 Please log in to the admin panel to respond.
               </p>
             </div>
           </div>
         `,
       };
 
     case "rfq_quoted":
       // Email to buyer that their RFQ has been quoted
       return {
        subject: `Quote Ready - ${data.rfq_number}`,
         html: `
           <div style="${baseStyles}">
             <div style="${cardStyles}">
               <h1 style="color: #1a1a1a; margin-bottom: 24px;">Your Quote is Ready! 💰</h1>
               <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Hi ${data.recipient_name || 'there'},<br><br>
                We've prepared a quote for your request <strong>${data.rfq_number}</strong>.
               </p>
               <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 24px 0;">
                 <p style="margin: 0 0 8px 0; color: #166534;">
                  <strong>Product:</strong> ${data.product_name}
                 </p>
                 <p style="margin: 0 0 8px 0; color: #166534;">
                  <strong>Quantity:</strong> ${data.quantity?.toLocaleString() || 0} units
                 </p>
                 <p style="margin: 0; color: #166534; font-size: 18px;">
                  <strong>Quoted Price:</strong> $${data.quoted_price?.toLocaleString() || 'TBD'} per unit
                 </p>
               </div>
               <p style="color: #666; font-size: 14px;">
                 Log in to your dashboard to accept or discuss this quote.
               </p>
             </div>
           </div>
         `,
       };
 
     case "rfq_accepted":
       return {
        subject: `RFQ Accepted - ${data.rfq_number}`,
         html: `
           <div style="${baseStyles}">
             <div style="${cardStyles}">
               <h1 style="color: #1a1a1a; margin-bottom: 24px;">Quote Accepted! ✓</h1>
               <p style="color: #666; font-size: 16px; line-height: 1.6;">
                The quote for RFQ <strong>${data.rfq_number}</strong> has been accepted.
               </p>
             </div>
           </div>
         `,
       };
 
     default:
       return {
        subject: `RFQ Update - ${data.rfq_number}`,
        html: `<p>Your RFQ ${data.rfq_number} has been updated.</p>`,
       };
   }
 };
 
 serve(async (req: Request) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const body: RFQNotificationRequest = await req.json();
 
    // Normalize the data from different formats
    const normalizedData = {
      type: body.type || "new_rfq",
      rfq_number: body.rfq_number || body.rfqNumber || "",
      product_name: body.product_name || body.productName || "",
      quantity: body.quantity || 0,
      buyer_name: body.buyer_name || body.fullName || "",
      company_name: body.company_name || body.companyName || "",
      email: body.email || body.to_email || "",
      phone: body.phone || "",
      message: body.message || "",
      item_count: body.itemCount,
      quoted_price: body.quoted_price,
      recipient_name: body.recipient_name || body.fullName || "",
    };
 
    if (!normalizedData.rfq_number) {
      throw new Error("Missing required field: rfq_number");
    }

    const { subject, html } = getEmailContent(normalizedData);

    // Get admin email from SMTP_FROM or use default
    const adminEmail = Deno.env.get("SMTP_FROM") || Deno.env.get("SMTP_USER") || "";
    const toEmail = body.to_email || adminEmail; // Send to buyer if specified, otherwise to admin

    // Create SMTP client with Hostinger credentials
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST") || "smtp.hostinger.com",
        port: parseInt(Deno.env.get("SMTP_PORT") || "465"),
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER") || "",
          password: Deno.env.get("SMTP_PASS") || "",
        },
        },
    });
 
    await client.send({
      from: adminEmail,
      to: toEmail,
      subject,
      content: "auto",
      html,
    });
 
    await client.close();

    console.log("RFQ notification sent successfully to:", toEmail);

    return new Response(JSON.stringify({ success: true }), {
       status: 200,
       headers: { "Content-Type": "application/json", ...corsHeaders },
     });
   } catch (error: any) {
     console.error("Error sending RFQ notification:", error);
     return new Response(JSON.stringify({ error: error.message }), {
       status: 500,
       headers: { "Content-Type": "application/json", ...corsHeaders },
     });
   }
 });