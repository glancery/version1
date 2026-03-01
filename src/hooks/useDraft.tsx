import { useState } from "react";
import store from "@/redux/store";

type EditResult = {
  success: boolean;
  message?: string;
  data?: any;
};

export default function useDraft() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const API_BASE = (import.meta.env as any).VITE_API_URL || "https://open.glancery.com";



  /**
   * deleteDraft
   * payload: { dcode, icode? }
   */
  async function deleteDraft(payload: { dcode: string; icode?: string }): Promise<EditResult> {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const icode = payload.icode || store.getState()?.auth?.icode;
      if (!icode) {
        setLoading(false);
        setError("Missing icode in store");
        return { success: false, message: "Missing icode in store" };
      }
      if (!payload.dcode) {
        setLoading(false);
        setError("Missing dcode");
        return { success: false, message: "Missing dcode" };
      }

      const res = await fetch(`${API_BASE}/api/v1/draft/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icode, dcode: payload.dcode }),
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || "Failed to delete draft";
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

  return { deleteDraft, loading, error, success } as const;
}
