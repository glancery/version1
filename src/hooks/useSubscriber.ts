import { useCallback, useState } from "react";

type StatsPayload = {
	gcode: string;
	shares?: number;
	views?: number;
	clicks?: number;
	// array of emails or identifiers to set/replace subscribers for a glance
	subscribers?: string[];
	// single email to add to subscribers (backend accepts emailid)
	emailid?: string;
};

type SendResult = {
	ok: boolean;
	data?: any;
	error?: string;
};

/**
 * Hook to send glance stats (updateGlanceStats).
 * Only `gcode` is required by the hook; other fields are optional and passed through.
 * Defaults to POSTing JSON to `/api/v1/glance/stats` but you can override the path.
 */
export default function useSubscriber() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const sendStats = useCallback(
		async (
			payload: StatsPayload,
			path = "https://backend.glancery.com/api/v1/glance/stats"
		): Promise<SendResult> => {
			setError(null);
			setSuccess(false);

			if (!payload || !payload.gcode) {
				const msg = "gcode is required";
				setError(msg);
				return { ok: false, error: msg };
			}

			setLoading(true);
			try {
				const resp = await fetch(path, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				let data: any = null;
				try {
					data = await resp.json();
				} catch (e) {
					// not JSON
					data = null;
				}

				if (!resp.ok) {
					const message = (data && data.message) || resp.statusText || "Failed to send stats";
					setError(message);
					return { ok: false, error: message, data };
				}

				setSuccess(true);
				return { ok: true, data };
			} catch (err: any) {
				const msg = err?.message || String(err);
				setError(msg);
				return { ok: false, error: msg };
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	return { sendStats, loading, error, success } as const;
}
