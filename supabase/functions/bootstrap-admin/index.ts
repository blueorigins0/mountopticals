 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req: Request) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 
     const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
       auth: { autoRefreshToken: false, persistSession: false },
     });
 
     // Check if admin already exists
     const { data: existingAdmins } = await adminClient
       .from("user_roles")
       .select("id")
       .eq("role", "admin");
 
     if (existingAdmins && existingAdmins.length > 0) {
       return new Response(
         JSON.stringify({ error: "Admin already exists. Bootstrap not allowed." }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     const { email, password } = await req.json();
 
     if (!email || !password) {
       return new Response(
         JSON.stringify({ error: "Email and password are required" }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Create the admin user
     const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
       email,
       password,
       email_confirm: true,
       user_metadata: { full_name: "Administrator" },
     });
 
     if (createError) throw createError;
     if (!newUser.user) throw new Error("Failed to create user");
 
     const userId = newUser.user.id;
 
     // Assign admin role
     const { error: roleError } = await adminClient.from("user_roles").insert({
       user_id: userId,
       role: "admin",
     });
 
     if (roleError) throw roleError;
 
     console.log(`Admin user created: ${email}`);
 
     return new Response(
       JSON.stringify({
         success: true,
         message: `Admin user ${email} created successfully`,
       }),
       { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   } catch (error: any) {
     console.error("Bootstrap error:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   }
 });