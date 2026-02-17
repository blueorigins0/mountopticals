import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      // Verify user is actually an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        const userRoles = roles?.map(r => r.role) || [];
        
        if (userRoles.includes("admin")) {
          toast({
            title: "Welcome Admin!",
            description: "Admin login successful.",
          });
          navigate("/admin");
        } else {
          // Not an admin, redirect to buyer dashboard
          toast({
            title: "Access Denied",
            description: "You don't have admin access. Redirecting to buyer dashboard.",
            variant: "destructive",
          });
          navigate("/dashboard");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-xl p-8">
          {/* Back Link */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 hover:opacity-80 transition-opacity">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Login</h1>
            <p className="text-muted-foreground mt-2">Access your admin dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Admin accounts are created by system administrators only.
          </p>
        </div>
      </motion.div>
    </div>
  );
}