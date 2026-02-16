import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const { sendOtp, loading } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Call API via hook
    const result = await sendOtp(email.trim());
    if (result.success) {
      toast({
        title: "OTP sent",
        description: "Check your email for the verification code.",
      });
      navigate(`/verify`, { state: { email } });
    } else {
      toast({
        title: "Failed to send OTP",
        description: result.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <span className="font-heading text-3xl font-bold text-primary">Glancery</span>
        </div>

        {/* Welcome text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email to continue
          </p>
        </div>

        {/* Email input */}
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 h-12 bg-card border-border text-base"
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            />
          </div>

          <Button
            onClick={handleContinue}
            disabled={loading}
            className="w-full h-12 text-base font-medium"
          >
            {loading ? "Sending code..." : "Continue"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          We'll send you a verification code to confirm your identity
        </p>
      </div>
    </div>
  );
};

export default Auth;
