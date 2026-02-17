import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const { error } = await signUp(email, password, { full_name: fullName });

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      navigate("/login");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead title="Create Account" description="Create your VendorHub account to start shopping industrial products at competitive prices." />
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
              <span className="text-xl font-bold text-accent-foreground">B</span>
            </div>
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
              Create Account
            </h1>
            <p className="text-muted-foreground mb-6">
              Sign up to start shopping
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    className="pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
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
                    placeholder="Min 6 characters"
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-accent font-medium hover:underline">Sign In</Link>
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
              <ShoppingBag className="h-12 w-12 text-accent" />
            </div>
            <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
              Shop with Us
            </h2>
            <p className="text-primary-foreground/80">
              Create a free account to browse products, place orders, and get the best prices.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
