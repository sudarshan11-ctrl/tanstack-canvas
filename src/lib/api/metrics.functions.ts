import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { MetricValue, Role } from "@/types";
import { mockPeople } from "@/data/mockPeople";
import { lcmsUserMap } from "@/data/lcmsUserMap";
import { getMetricMapping, listMappedPortalMetricIds, resolveApiRole } from "./metricRegistry";
import { passiveValue, transformMetric } from "./transformMetric";

const PERIOD = "FY2025-26";
const FY_START = "2025-04-01";
const FY_END = "2026-04-01";
const PRIOR_FY_START = "2024-04-01";
const PRIOR_FY_END = "2025-04-01";

const CONCURRENCY = 3;


async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

interface ResolvedPerson {
  personId: string;
  role: Role;
  lcmsUserId: number;
}

function resolvePerson(personId: string): ResolvedPerson | null {
  const person = mockPeople.find((p) => p.id === personId);
  if (!person) return null;
  const lcmsUserId = lcmsUserMap[personId];
  if (typeof lcmsUserId !== "number") return null;
  // Pick the API variant (equity-partner / partner / associate) from the
  // person's group-head status + designation rather than the dashboard's
  // three-tier role bucket alone.
  const apiRole = resolveApiRole(person.role, person.designation) ?? person.role;
  return { personId, role: apiRole, lcmsUserId };

}

// Headline metrics fetched per profile. Kept tiny because the replica-db-api
// rate-limits aggressively; expand once a batch/scorecard endpoint exists.
const HEADLINE_METRIC_IDS = ["FH-01", "FH-08", "CM-03"];

interface FetchOptions {
  metricIds?: string[];
  includePriorYear?: boolean;
}

async function fetchMetricsForPerson(
  person: ResolvedPerson,
  period: string,
  opts: FetchOptions = {},
): Promise<MetricValue[]> {
  // Server-only import — kept inside the handler so it never reaches the client bundle.
  const { runMetric } = await import("./replica-api.server");

  const allMapped = listMappedPortalMetricIds(person.role);
  const requested = opts.metricIds ?? allMapped;
  const portalMetricIds = requested.filter((id) => allMapped.includes(id));
  if (portalMetricIds.length === 0) return [];
  const includePriorYear = opts.includePriorYear ?? false;

  return mapWithConcurrency(portalMetricIds, CONCURRENCY, async (portalMetricId) => {
    const mapping = getMetricMapping(portalMetricId, person.role);
    if (!mapping) return passiveValue(portalMetricId, person.personId, period, "No API mapping configured");

    const baseParams: Record<string, string | number> = { [mapping.paramKey]: person.lcmsUserId };
    if (mapping.needsPrevFy) {
      baseParams.prev_fy_start = PRIOR_FY_START;
      baseParams.prev_fy_end = PRIOR_FY_END;
    }

    const calls: Array<Promise<unknown>> = [
      runMetric(mapping.apiMetricId, { ...baseParams, fy_start: FY_START, fy_end: FY_END }),
    ];
    if (includePriorYear) {
      calls.push(
        runMetric(mapping.apiMetricId, { ...baseParams, fy_start: PRIOR_FY_START, fy_end: PRIOR_FY_END }),
      );
    }

    const settled = await Promise.allSettled(calls);
    const current = settled[0];
    const prior = settled[1];

    if (current.status === "rejected") {
      return passiveValue(portalMetricId, person.personId, period, "Live source unavailable");
    }
    return transformMetric({
      metricId: portalMetricId,
      personId: person.personId,
      period,
      role: person.role,
      mapping,
      current: current.value as Awaited<ReturnType<typeof runMetric>>,
      priorYear:
        prior && prior.status === "fulfilled"
          ? (prior.value as Awaited<ReturnType<typeof runMetric>>)
          : null,
    });
  });
}

export const getPersonMetrics = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      personId: z.string().min(1),
      period: z.string().optional(),
      metricIds: z.array(z.string()).optional(),
      includePriorYear: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const period = data.period ?? PERIOD;
    const person = resolvePerson(data.personId);
    if (!person) return [] as MetricValue[];
    return fetchMetricsForPerson(person, period, {
      metricIds: data.metricIds ?? HEADLINE_METRIC_IDS,
      includePriorYear: data.includePriorYear ?? false,
    });
  });

export const getFirmMetrics = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      period: z.string().optional(),
      role: z.enum(["practice_head", "partner", "associate"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const period = data.period ?? PERIOD;
    const people = mockPeople
      .filter((p) => (data.role ? p.role === data.role : true))
      .map((p) => resolvePerson(p.id))
      .filter((p): p is ResolvedPerson => p !== null);

    const results = await mapWithConcurrency(people, CONCURRENCY, (person) =>
      fetchMetricsForPerson(person, period),
    );
    return results.flat();
  });

export const getTeamMetrics = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      rootPersonId: z.string().min(1),
      period: z.string().optional(),
      metricIds: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const period = data.period ?? PERIOD;

    // Walk the supervisor graph downward from rootPersonId to collect the
    // root plus every direct/indirect report.
    const childrenBySupervisor = new Map<string, string[]>();
    for (const p of mockPeople) {
      if (!p.supervisorId) continue;
      const arr = childrenBySupervisor.get(p.supervisorId) ?? [];
      arr.push(p.id);
      childrenBySupervisor.set(p.supervisorId, arr);
    }
    const teamIds: string[] = [];
    const visited = new Set<string>();
    const stack = [data.rootPersonId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      teamIds.push(id);
      for (const child of childrenBySupervisor.get(id) ?? []) stack.push(child);
    }

    const people = teamIds
      .map((id) => resolvePerson(id))
      .filter((p): p is ResolvedPerson => p !== null);

    const results = await mapWithConcurrency(people, CONCURRENCY, (person) =>
      fetchMetricsForPerson(person, period, {
        metricIds: data.metricIds ?? HEADLINE_METRIC_IDS,
      }),
    );
    return results.flat();
  });

export const getMetricCatalog = createServerFn({ method: "GET" })
  .handler(async () => {
  const { listPerformanceMetrics } = await import("./replica-api.server");
  return listPerformanceMetrics();
});

export interface VerifyMetricRow {
  metricId: string;
  apiMetricId: string | null;
  valueColumn: string | null;
  pickedColumn: string | null;
  scale: number;
  unitHint: string;
  parsedValue: number | string | null;
  unit: string;
  rag: string;
  passive: boolean;
  remark: string | null;
  rawColumns: string[];
  rawFirstRow: Record<string, string | number | null> | null;
  rawRowCount: number;
  error: string | null;
}

// One metric at a time. Keeps each Worker invocation well under the runtime
// timeout. The client fans out 23 of these in parallel so the UI fills in
// progressively even when individual calls hit replica-api rate limits.
export const verifyOnePersonMetric = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      personId: z.string().min(1),
      metricId: z.string().min(1),
      period: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<VerifyMetricRow> => {
    const period = data.period ?? PERIOD;
    const person = resolvePerson(data.personId);
    const portalMetricId = data.metricId;
    if (!person) {
      return {
        metricId: portalMetricId,
        apiMetricId: null,
        valueColumn: null,
        pickedColumn: null,
        scale: 1,
        unitHint: "",
        parsedValue: null,
        unit: "",
        rag: "na",
        passive: true,
        remark: "Person not resolved",
        rawColumns: [],
        rawFirstRow: null,
        rawRowCount: 0,
        error: null,
      };
    }
    const mapping = getMetricMapping(portalMetricId, person.role);
    if (!mapping) {
      return {
        metricId: portalMetricId,
        apiMetricId: null,
        valueColumn: null,
        pickedColumn: null,
        scale: 1,
        unitHint: "",
        parsedValue: null,
        unit: "",
        rag: "na",
        passive: true,
        remark: "No mapping",
        rawColumns: [],
        rawFirstRow: null,
        rawRowCount: 0,
        error: null,
      };
    }
    try {
      const { runMetric } = await import("./replica-api.server");
      const { pickValue } = await import("./transformMetric");
      const paramsDebug: Record<string, string | number> = {
        [mapping.paramKey]: person.lcmsUserId,
        fy_start: FY_START,
        fy_end: FY_END,
      };
      if (mapping.needsPrevFy) {
        paramsDebug.prev_fy_start = PRIOR_FY_START;
        paramsDebug.prev_fy_end = PRIOR_FY_END;
      }
      const resp = (await runMetric(mapping.apiMetricId, paramsDebug)) as Awaited<ReturnType<typeof runMetric>>;

      const transformed = transformMetric({
        metricId: portalMetricId,
        personId: person.personId,
        period,
        role: person.role,
        mapping,
        current: resp,
        priorYear: null,
      });
      const picked = pickValue(mapping, resp);
      return {
        metricId: portalMetricId,
        apiMetricId: mapping.apiMetricId,
        valueColumn: mapping.valueColumn || null,
        pickedColumn: picked.column,
        scale: mapping.scale,
        unitHint: mapping.unitHint,
        parsedValue: transformed.value,
        unit: transformed.unit,
        rag: transformed.rag,
        passive: transformed.passive ?? false,
        remark: transformed.remark ?? null,
        rawColumns: resp.columns,
        rawFirstRow: resp.rows[0] ?? null,
        rawRowCount: resp.rows.length,
        error: null,
      };
    } catch (err) {
      return {
        metricId: portalMetricId,
        apiMetricId: mapping.apiMetricId,
        valueColumn: mapping.valueColumn || null,
        pickedColumn: null,
        scale: mapping.scale,
        unitHint: mapping.unitHint,
        parsedValue: null,
        unit: "",
        rag: "na",
        passive: true,
        remark: null,
        rawColumns: [],
        rawFirstRow: null,
        rawRowCount: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

export const listVerifyMetricIds = createServerFn({ method: "POST" })
  .inputValidator(z.object({ personId: z.string().min(1) }))
  .handler(async ({ data }): Promise<string[]> => {
    const person = resolvePerson(data.personId);
    if (!person) return [];
    return listMappedPortalMetricIds(person.role);
  });



