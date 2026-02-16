import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useVerify from "@/hooks/useVerify";
import { useToast } from "@/hooks/use-toast";
import store from "@/redux/store";
import { setAuthUser, setEmail, setPublication, setUsername } from "@/redux/authSlice";

const Magic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = useParams();

  const rawEmail = params.email;
  const rawOtp = params.otp;
  const email = rawEmail ? decodeURIComponent(rawEmail) : "";
  const otp = rawOtp ? decodeURIComponent(rawOtp) : "";

  const { verifyOtp: apiVerifyOtp, loading } = useVerify();

  useEffect(() => {
    if (!email || !otp) {
      // missing params — send user back to auth
      navigate("/auth");
      return;
    }

    (async () => {
      try {
        const result = await apiVerifyOtp(email, otp);
        if (result.success) {
          try {
            const json = result.data || result;
            if (json?.icode) store.dispatch(setAuthUser(json.icode));
            if (json?.user?.email) store.dispatch(setEmail(json.user.email));
            if (json?.user?.publication)
              store.dispatch(setPublication(json.user.publication));
               if (json?.user?.username)
              store.dispatch(setUsername(json.user.username));
          } catch (e) {
            // ignore store errors
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

          // Navigate based on exist flag
          try {
            if (exist) navigate("/");
            else navigate("/onboarding");
          } catch (e) {
            navigate("/onboarding");
          }
        } else {
          toast({
            title: "Invalid code",
            description: result.message || "Please check the code and try again.",
            variant: "destructive",
          });
          navigate("/auth");
        }
      } catch (err) {
        toast({
          title: "Network error",
          description: "Could not verify the magic link. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    })();
  }, [email, otp, apiVerifyOtp, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold">Verifying...</h1>
        <p className="text-sm text-muted-foreground">Please wait while we verify your magic link.</p>
      </div>
    </div>
  );
};

export default Magic;
