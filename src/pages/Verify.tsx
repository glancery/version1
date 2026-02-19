import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useVerify from "@/hooks/useVerify";
import store from "@/redux/store";
import { setAuthUser, setEmail, setPublication, setUsername } from "@/redux/authSlice";

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const email = location.state?.email || "";

  const { verifyOtp: apiVerifyOtp, loading: isVerifying } = useVerify();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/auth");
    }
  }, [email, navigate]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (value && index === 5) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        verifyOtp(fullOtp);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus last filled input or verify
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pastedData.length === 6) {
      verifyOtp(pastedData);
    }
  };

  const verifyOtp = async (code: string) => {
    // call the hook which posts to the backend and accepts credentials
    const result = await apiVerifyOtp(email, code);
    if (result.success) {
      // persist icode/email/publication into redux store if present (dispatch via store to avoid requiring Provider)
      try {
        const json = result.data || result;
        if (json?.icode) store.dispatch(setAuthUser(json.icode));
        if (json?.user?.email) store.dispatch(setEmail(json.user.email));
        if (json?.user?.publication) store.dispatch(setPublication(json.user.publication));
        if (json?.user?.username) store.dispatch(setUsername(json.user.username));
      } catch (e) {
        // ignore any errors
      }
      // Show contextual toast depending on whether the user existed
      let exist = false;
      try {
        exist = !!store.getState()?.auth?.exist;
      } catch (e) {
        exist = false;
      }
      toast({
        title: "Verified!",
        description: exist
          ? "Welcome back — you're signed in."
          : "Let's set up your publication",
      });
      // route based on whether the user existed previously (stored in auth.exist)
      try {
        const exist = store.getState()?.auth?.exist;
        if (exist) {
          navigate("/");
        } else {
          navigate("/onboarding");
        }
      } catch (e) {
        // fallback
        navigate("/onboarding");
      }
    } else {
      toast({
        title: "Invalid code",
        description: result.message || "Please check the code and try again.",
        variant: "destructive",
      });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleVerify = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      toast({
        title: "Incomplete code",
        description: "Please enter all 6 digits.",
        variant: "destructive",
      });
      return;
    }
    verifyOtp(fullOtp);
  };

  const handleResend = () => {
    // call backend resend endpoint
    (async () => {
      try {
        const API_BASE =
          (import.meta.env as any).VITE_API_URL || "https://backend.glancery.com";
        const res = await fetch(`${API_BASE}/api/v1/user/resendotp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (res.ok) {
          toast({
            title: "Code resent!",
            description: `A new code has been sent to ${email}`,
          });
        } else {
          toast({
            title: "Unable to resend",
            description: json?.message || "Please try again later.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Network error",
          description: "Could not resend the code. Please try again.",
          variant: "destructive",
        });
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Logo */}
        <div className="flex justify-center">
          <span className="font-serif text-3xl font-bold italic text-primary">
            glancery
          </span>
        </div>

        {/* Verification text */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Check your email
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the 6-digit code sent to
          </p>
          <p className="text-foreground font-medium text-sm">{email}</p>
        </div>

        {/* OTP inputs */}
        <div
          className="flex justify-center gap-2 sm:gap-3"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-semibold bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Verify button */}
        <Button
          onClick={handleVerify}
          disabled={isVerifying || otp.join("").length !== 6}
          className="w-full h-12 text-base font-medium"
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>

        {/* Resend */}
        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button
            onClick={handleResend}
            className="text-primary hover:underline font-medium"
          >
            Resend
          </button>
        </p>

        {/* Magic link info */}
        <p className="text-center text-xs text-muted-foreground">
          You can also click the magic link in your inbox to verify instantly
        </p>
      </div>
    </div>
  );
};

export default Verify;
