import { useState } from "react";
import store from "@/redux/store";

type EditResult = {
  success: boolean;
  message?: string;
  data?: any;
};

export default function useEdit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const API_BASE = (import.meta.env as any).VITE_API_URL || "https://backend.glancery.com";

  /**
   * updateGlance
   * data: { gcode, headline?, snippet?, cta?, q1?, q2?, q3?, image?: File }
   */
  async function updateGlance(data: any): Promise<EditResult> {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const icode = data.icode || store.getState()?.auth?.icode;
      if (!icode) {
        setLoading(false);
        setError("Missing icode in store");
        return { success: false, message: "Missing icode in store" };
      }
      if (!data.gcode) {
        setLoading(false);
        setError("Missing gcode");
        return { success: false, message: "Missing gcode" };
      }

      const form = new FormData();
      form.append("icode", String(icode));
      form.append("gcode", String(data.gcode));

      if (data.headline) form.append("headline", String(data.headline));
      if (data.snippet) form.append("snippet", String(data.snippet));
      if (data.cta) form.append("cta", String(data.cta));
      if (data.cta) form.append("link", String(data.link));
      if (data.q1) form.append("q1", JSON.stringify(data.q1));
      if (data.q2) form.append("q2", JSON.stringify(data.q2));
      if (data.q3) form.append("q3", JSON.stringify(data.q3));

      const file = data.image || data.file;
      if (file) form.append("image", file, file.name || "image.jpg");

      const res = await fetch(`${API_BASE}/api/v1/glance/update`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || "Failed to update glance";
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

  /**
   * deleteGlance
   * payload: { gcode, icode? }
   */
  async function deleteGlance(payload: { gcode: string; icode?: string }): Promise<EditResult> {
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
      if (!payload.gcode) {
        setLoading(false);
        setError("Missing gcode");
        return { success: false, message: "Missing gcode" };
      }

      const res = await fetch(`${API_BASE}/api/v1/glance/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icode, gcode: payload.gcode }),
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || "Failed to delete glance";
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

  return { updateGlance, deleteGlance, loading, error, success } as const;
}
