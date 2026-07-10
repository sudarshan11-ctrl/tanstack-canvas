import type { MetricValue } from "@/types";
import type { MetricRunResponse } from "@/lib/api/replica-api.server";
import { getMetricMapping } from "@/lib/api/metricRegistry";
import { passiveValue, transformMetric } from "@/lib/api/transformMetric";
import snapshotRaw from "./metricsSnapshot.json";

// The dashboard renders metric values from src/data/metricsSnapshot.json,
// produced by `node scripts/fetchMetricsSnapshot.mjs` (one API call per
// person x mapped metric, raw responses stored verbatim). This module
// converts those raw responses into MetricValue rows with the same
// transform used by the live API path, so units, scaling and RAG match.

type ApiRole = "practice_head" | "partner" | "associate";

interface SnapshotEntry {
  personId: string;
  personName: string;
  lcmsUserId: number;
  apiRole: ApiRole;
  metricId: string;
  apiMetricId: string;
  params: Record<string, string | number>;
  ok: boolean;
  response: MetricRunResponse | null;
  error: string | null;
}

interface Snapshot {
  fetchedAt: string | null;
  period: string;
  fyStart: string;
  fyEnd: string;
  entries: SnapshotEntry[];
}

const snapshot = snapshotRaw as unknown as Snapshot;

const okEntries = snapshot.entries.filter((e) => e.ok);

export const snapshotInfo = {
  fetchedAt: snapshot.fetchedAt,
  period: snapshot.period,
  fyStart: snapshot.fyStart,
  fyEnd: snapshot.fyEnd,
  entryCount: snapshot.entries.length,
  okCount: okEntries.length,
  peopleCount: new Set(okEntries.map((e) => e.personId)).size,
};

export const snapshotMetricValues: MetricValue[] = snapshot.entries.map((entry) => {
  const mapping = getMetricMapping(entry.metricId, entry.apiRole);
  if (!mapping) {
    return passiveValue(entry.metricId, entry.personId, snapshot.period, "No API mapping configured");
  }
  if (!entry.ok || !entry.response) {
    return passiveValue(entry.metricId, entry.personId, snapshot.period, "Live source unavailable");
  }
  return transformMetric({
    metricId: entry.metricId,
    personId: entry.personId,
    period: snapshot.period,
    role: entry.apiRole,
    mapping,
    current: entry.response,
    priorYear: null,
  });
});
