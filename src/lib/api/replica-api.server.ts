import { getReplicaApiConfig } from "../config.server";

// Server-only client for the replica-db-api Django service. The X-API-Key
// header is injected here and never reaches the browser bundle.

export interface MetricRow {
  [column: string]: string | number | null;
}

export interface MetricRunResponse {
  metric_id: string;
  area?: string;
  metric?: string;
  audience?: string;
  parameters?: Record<string, unknown>;
  columns: string[];
  rows: MetricRow[];
  count: number;
}

export interface MetricCatalogEntry {
  metric_id: string;
  area?: string;
  metric?: string;
  audience?: string;
}

// In-memory cache for replica-db-api responses. Lives for the Worker instance's
// lifetime, evicted after TTL_MS. Keyed by full URL (path + query). The replica
// service rate-limits aggressively (429s under load), so caching cuts repeated
// fan-out from the dashboard down to one network call per (metric, person, FY).
const TTL_MS = 5 * 60 * 1000;
const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, { value: unknown; expires: number }>();

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// NOTE: We deliberately do NOT maintain a module-level concurrency limiter here.
// In the Cloudflare Workers runtime, awaiting a promise created in one request
// context and resolved from another triggers the "cross-request promise
// resolution" warning and cancels continuations. Per-request concurrency is
// already capped by the caller (see CONCURRENCY in metrics.functions.ts) and
// duplicate calls are collapsed by `inflight` below. 429s are handled by
// `fetchWithRetry` with Retry-After + exponential backoff.


async function fetchWithRetry(url: string, init: RequestInit, attempts = 4): Promise<Response> {
  let lastRes: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    lastRes = res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 5000)
      : Math.min(800 * Math.pow(2, i), 5000);
    await sleep(waitMs);
  }
  return lastRes!;
}

async function request<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const cfg = getReplicaApiConfig();
  const url = new URL(`${cfg.baseUrl}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  const key = url.toString();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) return cached.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const res = await fetchWithRetry(key, {
      method: "GET",
      headers: {
        [cfg.apiKeyHeader]: cfg.apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`replica-db-api ${res.status} ${res.statusText} for ${path}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as unknown;
    cache.set(key, { value: json, expires: Date.now() + TTL_MS });
    return json as T;
  })().finally(() => {

    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

export function listPerformanceMetrics(filters?: Record<string, string>): Promise<MetricCatalogEntry[]> {
  return request<MetricCatalogEntry[]>("/api/v1/performance-metrics/", filters);
}

export function runMetric(
  apiMetricId: string,
  params: Record<string, string | number | undefined>,
): Promise<MetricRunResponse> {
  return request<MetricRunResponse>(`/api/v1/performance-metrics/${encodeURIComponent(apiMetricId)}/`, params);
}

export function getMetricInfo(apiMetricId: string): Promise<unknown> {
  return request(`/api/v1/performance-metrics/${encodeURIComponent(apiMetricId)}/info/`);
}
