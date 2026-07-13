import { createServerFn } from "@tanstack/react-start";

// Pings the replica-db-api list endpoint to verify base URL + API key reach
// the server. Returns only safe, non-secret diagnostics — the key itself is
// never serialised.

export interface ConnectivityResult {
  ok: boolean;
  status: number | null;
  baseUrlHost: string | null;
  metricCount: number | null;
  durationMs: number;
  message: string;
}

export const testReplicaConnectivity = createServerFn({ method: "GET" })
  .handler(
  async (): Promise<ConnectivityResult> => {
    const { getReplicaApiConfig } = await import("@/lib/config.server");
    const started = Date.now();

    let cfg;
    try {
      cfg = getReplicaApiConfig();
    } catch (err) {
      return {
        ok: false,
        status: null,
        baseUrlHost: null,
        metricCount: null,
        durationMs: Date.now() - started,
        message: err instanceof Error ? err.message : "Config error",
      };
    }

    const host = (() => {
      try {
        return new URL(cfg.baseUrl).host;
      } catch {
        return null;
      }
    })();

    try {
      const res = await fetch(`${cfg.baseUrl}/api/v1/performance-metrics/`, {
        method: "GET",
        headers: { [cfg.apiKeyHeader]: cfg.apiKey, Accept: "application/json" },
        cache: "no-store",
      });
      const durationMs = Date.now() - started;
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          baseUrlHost: host,
          metricCount: null,
          durationMs,
          message: `API responded ${res.status} ${res.statusText}`,
        };
      }
      const body = (await res.json()) as unknown;
      const metricCount = Array.isArray(body) ? body.length : null;
      return {
        ok: true,
        status: res.status,
        baseUrlHost: host,
        metricCount,
        durationMs,
        message: "Reachable",
      };
    } catch (err) {
      return {
        ok: false,
        status: null,
        baseUrlHost: host,
        metricCount: null,
        durationMs: Date.now() - started,
        message: err instanceof Error ? err.message : "Network error",
      };
    }
  },
);
