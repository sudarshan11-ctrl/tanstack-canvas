// Fetches every mapped (person x metric) from the replica-db-api and writes
// the raw responses to src/data/metricsSnapshot.json. The dashboard then
// renders from that JSON file instead of calling the API at runtime.
//
// Usage:
//   node scripts/fetchMetricsSnapshot.mjs            # full fetch (resumes if snapshot exists)
//   node scripts/fetchMetricsSnapshot.mjs --limit 2  # pilot: only first N people
//   node scripts/fetchMetricsSnapshot.mjs --fresh    # ignore existing snapshot, refetch all

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(root, "src", "data", "metricsSnapshot.json");

// ---------------------------------------------------------------- env / args
function loadEnv() {
  const env = {};
  const raw = readFileSync(path.join(root, ".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const BASE_URL = (env.REPLICA_API_BASE_URL ?? "").replace(/\/$/, "");
const API_KEY = env.REPLICA_API_KEY;
const API_KEY_HEADER = env.REPLICA_API_KEY_HEADER ?? "X-API-Key";
if (!BASE_URL || !API_KEY) {
  console.error("REPLICA_API_BASE_URL / REPLICA_API_KEY missing in .env");
  process.exit(1);
}

const args = process.argv.slice(2);
const FRESH = args.includes("--fresh");
const limitIdx = args.indexOf("--limit");
const PERSON_LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

// Fiscal windows: keep in sync with src/lib/api/metrics.functions.ts.
const PERIOD = "FY2025-26";
const FY_START = "2025-04-01";
const FY_END = "2026-04-01";
const PRIOR_FY_START = "2024-04-01";
const PRIOR_FY_END = "2025-04-01";

const CONCURRENCY = 4;

// ------------------------------------------------------------------- inputs
const apiMetricMap = JSON.parse(readFileSync(path.join(root, "src", "data", "apiMetricMap.json"), "utf8"));
const lcmsUserMap = JSON.parse(readFileSync(path.join(root, "src", "data", "lcmsUserMap.json"), "utf8"));
const hierarchy = JSON.parse(readFileSync(path.join(root, "src", "data", "lksHierarchy.json"), "utf8"));

const personById = new Map(hierarchy.map((r) => [r.id, r]));

// Mirrors resolveApiRole in src/lib/api/metricRegistry.ts.
function resolveApiRole(role, designation) {
  if (role === "practice_head") return "practice_head";
  const d = (designation ?? "").trim().toLowerCase();
  if (["executive partner", "senior partner", "partner", "associate partner"].includes(d)) return "partner";
  if (
    ["principal associate", "senior associate", "associate", "associate director", "director", "consultant", "of counsel"].includes(d)
  ) {
    return "associate";
  }
  if (role === "partner" || role === "associate") return role;
  return null;
}

const roleToParamKey = {
  practice_head: "ep_user_id",
  partner: "partner_user_id",
  associate: "associate_user_id",
};

// Build the task list: one task per (person, mapped metric).
const tasks = [];
let peopleCount = 0;
for (const [personId, entry] of Object.entries(lcmsUserMap)) {
  if (peopleCount >= PERSON_LIMIT) break;
  const person = personById.get(personId);
  if (!person) continue;
  const apiRole = resolveApiRole(person.role, person.designation);
  if (!apiRole) continue;
  peopleCount += 1;
  for (const [metricId, mapping] of Object.entries(apiMetricMap)) {
    const apiMetricId = mapping[apiRole];
    if (!apiMetricId) continue;
    const params = {
      [roleToParamKey[apiRole]]: entry.lcmsUserId,
      fy_start: FY_START,
      fy_end: FY_END,
    };
    if (mapping.needs_prev_fy) {
      params.prev_fy_start = PRIOR_FY_START;
      params.prev_fy_end = PRIOR_FY_END;
    }
    tasks.push({
      personId,
      personName: person.name,
      lcmsUserId: entry.lcmsUserId,
      apiRole,
      metricId,
      apiMetricId,
      params,
    });
  }
}

// ------------------------------------------------------------------ fetching
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchMetric(task, attempts = 5) {
  const url = new URL(`${BASE_URL}/api/v1/performance-metrics/${encodeURIComponent(task.apiMetricId)}/`);
  for (const [k, v] of Object.entries(task.params)) url.searchParams.set(k, String(v));

  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { [API_KEY_HEADER]: API_KEY, Accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 10000)
          : Math.min(1000 * Math.pow(2, i), 10000);
        lastErr = `HTTP ${res.status}`;
        await sleep(waitMs);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
      }
      const json = await res.json();
      return { ok: true, response: { columns: json.columns ?? [], rows: json.rows ?? [], count: json.count ?? 0 } };
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      await sleep(Math.min(1000 * Math.pow(2, i), 10000));
    }
  }
  return { ok: false, error: lastErr ?? "exhausted retries" };
}

// ------------------------------------------------------------------ snapshot
let snapshot = {
  fetchedAt: null,
  period: PERIOD,
  fyStart: FY_START,
  fyEnd: FY_END,
  priorFyStart: PRIOR_FY_START,
  priorFyEnd: PRIOR_FY_END,
  entries: [],
};
if (!FRESH && existsSync(OUT_FILE)) {
  try {
    snapshot = JSON.parse(readFileSync(OUT_FILE, "utf8"));
    console.log(`Resuming: ${snapshot.entries.length} entries already in snapshot`);
  } catch {
    console.warn("Existing snapshot unreadable; starting fresh");
  }
}
const doneKeys = new Set(snapshot.entries.filter((e) => e.ok).map((e) => `${e.personId}::${e.metricId}`));
const pending = tasks.filter((t) => !doneKeys.has(`${t.personId}::${t.metricId}`));
// Drop stale failed rows for tasks we're about to retry.
const pendingKeys = new Set(pending.map((t) => `${t.personId}::${t.metricId}`));
snapshot.entries = snapshot.entries.filter((e) => !pendingKeys.has(`${e.personId}::${e.metricId}`));

console.log(`People: ${peopleCount}, total tasks: ${tasks.length}, pending: ${pending.length}`);

function save() {
  snapshot.fetchedAt = new Date().toISOString();
  writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 1));
}

let completed = 0;
let okCount = 0;
let failCount = 0;
let cursor = 0;

async function worker() {
  while (true) {
    const i = cursor++;
    if (i >= pending.length) return;
    const task = pending[i];
    const result = await fetchMetric(task);
    snapshot.entries.push({
      personId: task.personId,
      personName: task.personName,
      lcmsUserId: task.lcmsUserId,
      apiRole: task.apiRole,
      metricId: task.metricId,
      apiMetricId: task.apiMetricId,
      params: task.params,
      ok: result.ok,
      response: result.ok ? result.response : null,
      error: result.ok ? null : result.error,
    });
    completed += 1;
    if (result.ok) okCount += 1;
    else failCount += 1;
    if (completed % 25 === 0) {
      save();
      console.log(`progress ${completed}/${pending.length} (ok ${okCount}, failed ${failCount})`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
save();
console.log(`Done. ${completed} fetched this run (ok ${okCount}, failed ${failCount}).`);
console.log(`Snapshot: ${snapshot.entries.length} total entries -> ${path.relative(root, OUT_FILE)}`);
