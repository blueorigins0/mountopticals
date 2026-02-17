import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { SiteLogo } from "@/components/SiteLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";

export default function Login() {
  const [searchParams] = useSearchParams();
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
      // Get user role and redirect accordingly
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
            description: "Redirecting to admin panel.",
          });
          navigate("/admin");
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/dashboard");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead title="Sign In" description="Sign in to your VendorHub B2B account to access wholesale and retail pricing." />
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-sm">
          {/* Back Link */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Logo - Clickable */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <SiteLogo className="w-10 h-10" />
            <span className="text-xl font-display font-bold text-foreground">
              B2B<span className="text-accent">Market</span>
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mb-6">
              Sign in to access your B2B account
            </p>

            {/* Login Form - No buyer type selector, role is determined from database */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>
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
                className="w-full bg-gradient-accent hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to B2BMarket?{" "}
              <Link to="/signup" className="text-accent font-medium hover:underline">Create an Account</Link>
            </p>

          </motion.div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center max-w-md"
        >
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-accent" />
            </div>
            <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
              B2B Portal
            </h2>
            <p className="text-primary-foreground/80">
              Access exclusive wholesale and retail pricing based on your assigned role. 
              Your pricing tier is automatically set by the admin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-primary-light/30 rounded-xl p-4">
              <p className="text-2xl font-bold text-accent mb-1">Wholesale</p>
              <p className="text-sm text-primary-foreground/70">
                Bulk pricing for shop owners
              </p>
            </div>
            <div className="bg-primary-light/30 rounded-xl p-4">
              <p className="text-2xl font-bold text-accent mb-1">Retail</p>
              <p className="text-sm text-primary-foreground/70">
                Competitive retail pricing
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
