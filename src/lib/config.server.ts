import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling this
// file into the client. Read env inside the function so each request resolves
// the latest values (Cloudflare Workers bind env per-request).

export interface ReplicaApiConfig {
  baseUrl: string;
  apiKey: string;
  apiKeyHeader: string;
  defaultFyStart: string;
  defaultFyEnd: string;
}

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
  };
}

export function getReplicaApiConfig(): ReplicaApiConfig {
  const baseUrl = process.env.REPLICA_API_BASE_URL;
  const apiKey = process.env.REPLICA_API_KEY;
  const apiKeyHeader = process.env.REPLICA_API_KEY_HEADER ?? "X-API-Key";
  const defaultFyStart = process.env.DEFAULT_FY_START ?? "2022-04-01";
  const defaultFyEnd = process.env.DEFAULT_FY_END ?? "2023-04-01";

  if (!baseUrl) throw new Error("REPLICA_API_BASE_URL not set");
  if (!apiKey) throw new Error("REPLICA_API_KEY not set");

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    apiKeyHeader,
    defaultFyStart,
    defaultFyEnd,
  };
}
