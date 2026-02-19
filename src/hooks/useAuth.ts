import { useState } from "react";
import { useDispatch } from "react-redux";
import { setExist } from "../redux/authSlice";

type SendOtpResult = {
  success: boolean;
  message?: string;
  data?: any;
};

export default function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const dispatch = useDispatch();

  const API_BASE = (import.meta.env as any).VITE_API_URL || "https://backend.glancery.com";

  async function sendOtp(email: string): Promise<SendOtpResult> {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // basic email validation
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setLoading(false);
      setError("Please provide a valid email address.");
      return { success: false, message: "Invalid email" };
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/user/sendotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message || "Failed to send OTP";
        setError(msg);
        setLoading(false);
        return { success: false, message: msg };
      }
      // If API indicates the user already exists, update the store using exact message match
      const message: string | undefined = json?.message;
      if (message === "User exists. OTP sent successfully.") {
        dispatch(setExist(true));
      } else {
        dispatch(setExist(false));
      }
      setSuccess(true);
      setLoading(false);
      return { success: true, data: json };
    } catch (err: any) {
      setError(err?.message || "Network error");
      setLoading(false);
      return { success: false, message: err?.message };
    }
  }

  return { sendOtp, loading, error, success } as const;
}
