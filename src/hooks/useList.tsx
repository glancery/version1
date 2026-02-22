import { useEffect, useState, useCallback } from "react";
import store from "@/redux/store";

type ListResult = {
  success: boolean;
  message?: string;
  data?: any;
};

export default function useList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glances, setGlances] = useState<any[] | null>(null);

  const API_BASE =
    (import.meta.env as any).VITE_API_URL || "https://open.glancery.com";

  const fetchList = useCallback(
    async (icodeArg?: string): Promise<ListResult> => {
      setLoading(true);
      setError(null);

      try {
        const icode = icodeArg || store.getState()?.auth?.icode;
        if (!icode) {
          setLoading(false);
          setError("Missing icode in store");
          return { success: false, message: "Missing icode in store" };
        }

        const res = await fetch(`${API_BASE}/api/v1/glance/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ icode }),
          credentials: "include",
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = json?.message || "Failed to fetch glances";
          setError(msg);
          setLoading(false);
          return { success: false, message: msg };
        }

        // API returns { glances }
        let items = Array.isArray(json?.glances)
          ? json.glances
          : json?.glances || [];

        // Ensure latest-first ordering (server already sorts but sort again defensively)
        items = items.slice().sort((a: any, b: any) => {
          const ta = new Date(a.createdAt).getTime();
          const tb = new Date(b.createdAt).getTime();
          return tb - ta;
        });

        setGlances(items);
        setLoading(false);
        return { success: true, data: items };
      } catch (err: any) {
        setError(err?.message || "Network error");
        setLoading(false);
        return { success: false, message: err?.message };
      }
    },
    [API_BASE]
  );

  return { glances, fetchList, loading, error } as const;
}
