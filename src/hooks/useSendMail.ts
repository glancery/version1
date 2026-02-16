import { useState } from "react";

type SendResult = {
  success: boolean;
  message?: string;
  data?: any;
};

/**
 * useSendMail
 * Sends a JSON body to a mail/send endpoint. Default path is /api/v1/glance/unlock
 * Caller may pass full body (you said you'll send whole info in body).
 */
export default function useSendMail(defaultPath = "/api/v1/glance/unlock") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const API_BASE = (import.meta.env as any).VITE_API_URL || "http://localhost:3000";

  async function sendMail(body: any, path?: string): Promise<SendResult> {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}${path || defaultPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || "Failed to send mail";
        setError(msg);
        setLoading(false);
        return { success: false, message: msg };
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

  return { sendMail, loading, error, success } as const;
}
