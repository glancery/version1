import { useCallback, useState } from "react";

type Follower = {
  email: string;
  followedAt: string | null; // ISO timestamp
};

type Result = {
  followers: Follower[] | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  fetchFollowers: (icode: string, path?: string) => Promise<Follower[] | null>;
};

export default function useFollowers(): Result {
  const [followers, setFollowers] = useState<Follower[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchFollowers = useCallback(async (icode: string, path = "http://localhost:3000/api/v1/user/followers") => {
    setError(null);
    setSuccess(false);
    if (!icode) {
      const msg = "icode is required";
      setError(msg);
      return null;
    }
    setLoading(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data && data.message) || res.statusText || "Failed to fetch followers";
        setError(msg);
        return null;
      }
      const list = (data && data.followers) || [];
      setFollowers(list);
      setSuccess(true);
      return list;
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { followers, loading, error, success, fetchFollowers };
}
