
import { useState } from "react";
import store from "@/redux/store";
import { setPublication as setPublicationAction } from "@/redux/authSlice";

// Helper to read icode from the store without requiring a React-Redux Provider
export function getIcodeFromStore(): string | null {
	try {
		return store?.getState?.()?.auth?.icode ?? null;
	} catch (e) {
		return null;
	}
}

type OnboardResult = {
	success: boolean;
	message?: string;
	data?: any;
};

export default function useOnboard() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<boolean>(false);

	const API_BASE = (import.meta.env as any).VITE_API_URL || "https://backend.glancery.com";

	async function setPublication(name: string, icode?: string): Promise<OnboardResult> {
		setLoading(true);
		setError(null);
		setSuccess(false);

		if (!name || !name.trim()) {
			setLoading(false);
			setError("Publication name is required");
			return { success: false, message: "Publication name is required" };
		}

			try {
				// if icode not provided, try to read from store
				const effectiveIcode = icode || store?.getState?.()?.auth?.icode;

				const body: any = { name: name.trim() };
				if (effectiveIcode) body.icode = effectiveIcode;

				const res = await fetch(`${API_BASE}/api/v1/user/publication`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
					// if we have an explicit icode we don't need cookies; otherwise include credentials to use cookie icode
					credentials: effectiveIcode ? "omit" : "include",
				});

				const json = await res.json();
				if (!res.ok) {
					const msg = json?.message || "Failed to update publication";
					setError(msg);
					setLoading(false);
					return { success: false, message: msg };
				}

				// update store publication if available
				try {
					if (json?.user?.publication) store.dispatch(setPublicationAction(json.user.publication));
				} catch (e) {
					// ignore if store not initialized
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

	return { setPublication, loading, error, success } as const;
}
