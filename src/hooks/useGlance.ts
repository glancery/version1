
import { useState, useCallback, useEffect } from "react";

type GetResult = {
	success: boolean;
	message?: string;
	data?: any;
};

export default function useGlance(initialGcode?: string) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [glance, setGlance] = useState<any | null>(null);

	const API_BASE =
		(import.meta.env as any).VITE_API_URL || "https://open.glancery.com";

	const fetchGlance = useCallback(
		async (gcodeArg?: string): Promise<GetResult> => {
			setLoading(true);
			setError(null);
			try {
				const gcode = gcodeArg || initialGcode;
				if (!gcode) {
					setLoading(false);
					setError("Missing gcode");
					return { success: false, message: "Missing gcode" };
				}

				const res = await fetch(`${API_BASE}/api/v1/glance/get`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ gcode }),
					credentials: "include",
				});

				const json = await res.json().catch(() => null);
				if (!res.ok) {
					const msg = json?.message || "Failed to fetch glance";
					setError(msg);
					setLoading(false);
					return { success: false, message: msg };
				}

				const item = json?.glance || null;
				setGlance(item);
				setLoading(false);
				return { success: true, data: item };
			} catch (err: any) {
				setError(err?.message || "Network error");
				setLoading(false);
				return { success: false, message: err?.message };
			}
		},
		[API_BASE, initialGcode]
	);

	// Auto-fetch if initialGcode provided
	useEffect(() => {
		if (initialGcode) {
			// fire-and-forget
			fetchGlance(initialGcode).catch(() => {
				/* ignore */
			});
		}
	}, [initialGcode, fetchGlance]);

	return { glance, fetchGlance, loading, error } as const;
}

