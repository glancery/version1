import { useState } from "react";
import store from "@/redux/store";

type CreateResult = {
  success: boolean;
  message?: string;
  data?: any;
};

export default function useCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const API_BASE = (import.meta.env as any).VITE_API_URL || "https://backend.glancery.com";

  /**
   * createGlance
   * data: { headline, snippet, cta?, q1?, q2?, q3?, file?: File }
   */
  async function createGlance(data: any): Promise<CreateResult> {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const icode = store.getState()?.auth?.icode;
      if (!icode) {
        setLoading(false);
        setError("Missing icode in store");
        return { success: false, message: "Missing icode in store" };
      }

      const form = new FormData();
      form.append("icode", String(icode));

      // append simple fields
      if (data.headline) form.append("headline", String(data.headline));
      if (data.snippet) form.append("snippet", String(data.snippet));
      if (data.cta) form.append("cta", String(data.cta));
      if (data.link) form.append("link", String(data.link));
      // q1, q2, q3 are objects — stringify them if present
      if (data.q1) form.append("q1", JSON.stringify(data.q1));
      if (data.q2) form.append("q2", JSON.stringify(data.q2));
      if (data.q3) form.append("q3", JSON.stringify(data.q3));

      // file (image) - backend expects field name 'image'
      const file = data.file || data.image;
      if (file) {
        form.append("image", file, file.name || "image.jpg");
      }

      const res = await fetch(`${API_BASE}/api/v1/glance/create`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || "Failed to create glance";
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

  return { createGlance, loading, error, success } as const;
}
