import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation?: string;
  image?: string;
}

interface ShippingAddress {
  full_name?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

interface OrderNotificationRequest {
  type: "new_order" | "order_confirmed" | "order_shipped" | "order_delivered" | "payment_received";
  to_email: string;
  buyer_name: string;
  order_number: string;
  order_total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  items?: OrderItem[];
  items_count?: number;
  tracking_number?: string;
  gst_number?: string;
  company_name?: string;
  invoice_number?: string;
  shipping_address?: ShippingAddress;
  billing_address?: { gst_number?: string; company_name?: string };
}

const getEmailContent = (req: OrderNotificationRequest) => {
  const itemRows = req.items?.map(item => {
    const imgHtml = item.image ? `<img src="${item.image}" alt="${item.name}" width="50" height="50" style="width:50px;height:50px;object-fit:contain;border-radius:4px;border:1px solid #eee;" />` : '';
    const varHtml = item.variation ? `<br><span style="color:#888;font-size:12px;">${item.variation}</span>` : '';
    return `<tr>
<td style="padding:12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${imgHtml} <strong>${item.name}</strong>${varHtml}</td>
<td style="padding:12px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#333;">${item.quantity}</td>
<td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;color:#333;">&#x20B9;${item.unit_price.toLocaleString()}</td>
<td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;color:#333;">&#x20B9;${item.total_price.toLocaleString()}</td>
</tr>`;
  }).join('') || '';

  const addr = req.shipping_address;
  const addressHtml = addr ? `<div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0;">
<h3 style="margin:0 0 8px;font-size:14px;color:#333;font-weight:600;">Shipping Address</h3>
<p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${addr.full_name || ''}${addr.company ? '<br>' + addr.company : ''}${addr.address ? '<br>' + addr.address : ''}${addr.city ? '<br>' + addr.city : ''}${addr.state ? ', ' + addr.state : ''} ${addr.postal_code || ''}${addr.country ? '<br>' + addr.country : ''}${addr.phone ? '<br>Phone: ' + addr.phone : ''}</p>
</div>` : '';

  const gstInfo = req.gst_number ? `<div style="background:#f0fdf4;border-radius:8px;padding:12px 16px;margin:16px 0;border-left:4px solid #16a34a;">
<p style="margin:0;font-size:13px;color:#166534;"><strong>GST Invoice</strong> | GSTIN: ${req.gst_number}</p>
${req.company_name ? '<p style="margin:4px 0 0;font-size:13px;color:#166534;">Company: ' + req.company_name + '</p>' : ''}
</div>` : '';

  switch (req.type) {
    case "new_order":
      return {
        subject: `Order Confirmed - ${req.order_number} | VendorHub`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;background:#f8f9fa;">
<div style="background:linear-gradient(135deg,#1a365d,#2d4a7c);padding:24px;text-align:center;">
<table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:36px;height:36px;background:#e8590c;border-radius:8px;text-align:center;vertical-align:middle;"><span style="color:#fff;font-weight:bold;font-size:18px;">V</span></td><td style="padding-left:8px;"><span style="color:#fff;font-size:22px;font-weight:700;">VendorHub</span></td></tr></table>
<h1 style="color:#fff;margin:16px 0 4px;font-size:22px;">Order Confirmed</h1>
<p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">Thank you for your purchase!</p>
</div>
<div style="padding:24px;">
<div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<p style="color:#333;font-size:15px;margin:0 0 4px;">Hi <strong>${req.buyer_name}</strong>,</p>
<p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px;">Your order <strong style="color:#e8590c;">${req.order_number}</strong> has been received and is being processed.</p>
${gstInfo}
${req.items && req.items.length > 0 ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead><tr style="background:#f5f5f5;">
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;">Item</th>
<th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;">Price</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;">Total</th>
</tr></thead>
<tbody>${itemRows}</tbody>
</table>` : ''}
<div style="border-top:2px solid #eee;padding-top:16px;margin-top:8px;">
${req.subtotal != null ? `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:14px;color:#666;padding:3px 0;">Subtotal</td><td style="font-size:14px;color:#333;text-align:right;padding:3px 0;">&#x20B9;${req.subtotal.toLocaleString()}</td></tr></table>` : ''}
${req.tax != null ? `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:14px;color:#666;padding:3px 0;">Tax (GST)</td><td style="font-size:14px;color:#333;text-align:right;padding:3px 0;">&#x20B9;${req.tax.toLocaleString()}</td></tr></table>` : ''}
${req.shipping != null ? `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:14px;color:#666;padding:3px 0;">Shipping</td><td style="font-size:14px;color:#333;text-align:right;padding:3px 0;">${req.shipping === 0 ? 'Free' : '&#x20B9;' + req.shipping.toLocaleString()}</td></tr></table>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #eee;margin-top:8px;"><tr><td style="font-size:18px;font-weight:700;color:#333;padding:12px 0 0;">Total</td><td style="font-size:18px;font-weight:700;color:#e8590c;text-align:right;padding:12px 0 0;">&#x20B9;${req.order_total.toLocaleString()}</td></tr></table>
</div>
${addressHtml}
</div>
<p style="text-align:center;color:#888;font-size:12px;margin-top:20px;">We'll send you another email when your order ships.</p>
<div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
<p style="color:#999;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} VendorHub. All rights reserved.</p>
</div>
</div>
</div>`,
      };

    case "order_shipped":
      return {
        subject: `Your Order is on its way! - ${req.order_number} | VendorHub`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;background:#f8f9fa;">
<div style="background:linear-gradient(135deg,#1a365d,#2d4a7c);padding:24px;text-align:center;">
<h1 style="color:#fff;margin:16px 0 0;font-size:22px;">Your order has shipped!</h1>
</div>
<div style="padding:24px;">
<div style="background:#fff;border-radius:12px;padding:24px;">
<p style="color:#666;font-size:15px;line-height:1.6;">Hi ${req.buyer_name},<br><br>Your order <strong>${req.order_number}</strong> is on its way.</p>
${req.tracking_number ? `<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;color:#166534;"><strong>Tracking Number:</strong> ${req.tracking_number}</p></div>` : ''}
</div></div></div>`,
      };

    default:
      return {
        subject: `Order Update - ${req.order_number} | VendorHub`,
        html: `<p>Your order ${req.order_number} has been updated.</p>`,
      };
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: OrderNotificationRequest = await req.json();
    
    if (!body.to_email || !body.order_number || !body.buyer_name) {
      throw new Error("Missing required fields: to_email, order_number, buyer_name");
    }

    const { subject, html } = getEmailContent(body);

    // Use fetch-based email sending to avoid denomailer encoding issues
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.hostinger.com";
    const smtpPort = Deno.env.get("SMTP_PORT") || "465";
    const smtpUser = Deno.env.get("SMTP_USER") || "";
    const smtpPass = Deno.env.get("SMTP_PASS") || "";
    const fromEmail = Deno.env.get("SMTP_FROM") || smtpUser;

    // Use denomailer but with proper encoding settings
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
    
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: parseInt(smtpPort),
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    await client.send({
      from: fromEmail,
      to: body.to_email,
      subject,
      html,
      content: "auto",
      encoding: "8bit",
    });

    await client.close();

    console.log("Order notification sent successfully to:", body.to_email);

    // Create admin notification
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");

        if (admins && admins.length > 0) {
          const notifications = admins.map((admin: { user_id: string }) => ({
            user_id: admin.user_id,
            title: "New Order Received",
            message: `Order ${body.order_number} placed by ${body.buyer_name} - ₹${body.order_total.toLocaleString()}`,
            type: "order",
            data: { order_number: body.order_number },
          }));
          await supabase.from("notifications").insert(notifications);
        }
      }
    } catch (notifError) {
      console.error("Failed to create admin notification:", notifError);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
