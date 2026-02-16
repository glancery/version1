import { useState } from "react";

type VerifyResult = {
  success: boolean;
  message?: string;
  data?: any;
};

export default function useVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const API_BASE = (import.meta.env as any).VITE_API_URL || "http://localhost:3000";

  async function verifyOtp(email: string, otp: string): Promise<VerifyResult> {
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!email || !otp) {
      setLoading(false);
      setError("Email and OTP are required");
      return { success: false, message: "Email and OTP are required" };
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/user/verifyotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.message || "Failed to verify OTP";
        setError(msg);
        setLoading(false);
        return { success: false, message: msg };
      }
      // success: return backend payload to caller (caller may persist to store)

      setSuccess(true);
      setLoading(false);
      return { success: true, data: json };
    } catch (err: any) {
      setError(err?.message || "Network error");
      setLoading(false);
      return { success: false, message: err?.message };
    }
  }

  return { verifyOtp, loading, error, success } as const;
}
