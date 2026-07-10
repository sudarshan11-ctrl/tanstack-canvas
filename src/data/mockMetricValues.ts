import type { MetricValue, Person, Role, RAGStatus } from "@/types";
import { mockPeople } from "./mockPeople";
import { mockMetricDefinitions } from "./mockMetricDefinitions";
import { mockWeights } from "./mockWeights";
import { practiceHeadArchetypes } from "./practiceHeads";
import { isLowerIsBetter } from "@/utils/metricDirection";
import { realPartnerData } from "./realPartnerData";
import {
  activeMetricIds,
  inactiveRemarkFor,
} from "@/utils/metricActivity";

const PERIOD = "FY2022-23";

// Deterministic PRNG seeded by string so values are stable per build.
function seeded(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Spec {
  unit: string;
  base: [number, number]; // realistic value range
  target: number;
  greenDelta: number; // pct over/under target that is green
  amberDelta: number;
  higherIsBetter: boolean;
}

function specFor(metricId: string, role: Role): Spec {
  // Revenue-style metrics
  if (metricId === "FH-01" || metricId === "FH-02" || metricId === "GP-07") {
    const range: [number, number] = role === "practice_head" ? [0.5, 8] : role === "partner" ? [0.2, 3] : [0.05, 0.6];
    const target = role === "practice_head" ? 6 : role === "partner" ? 2 : 0.4;
    return { unit: "₹Cr", base: range, target, greenDelta: -0.05, amberDelta: -0.15, higherIsBetter: true };
  }
  if (metricId === "FH-08") return { unit: "%", base: [65, 92], target: 85, greenDelta: -0.03, amberDelta: -0.1, higherIsBetter: true };
  if (metricId === "FH-09") return { unit: "%", base: [55, 90], target: 78, greenDelta: -0.05, amberDelta: -0.12, higherIsBetter: true };
  if (metricId === "FH-10") return { unit: "₹Cr", base: [3, 12], target: 8, greenDelta: -0.05, amberDelta: -0.15, higherIsBetter: true };
  if (metricId === "FH-11" || metricId === "FH-12") return { unit: "%", base: [20, 55], target: 45, greenDelta: -0.05, amberDelta: -0.15, higherIsBetter: true };
  if (metricId === "FH-13") return { unit: "hrs", base: [1100, 1900], target: 1700, greenDelta: -0.05, amberDelta: -0.12, higherIsBetter: true };
  if (metricId === "FH-14") return { unit: "hrs", base: [200, 600], target: 400, greenDelta: 0.1, amberDelta: 0.25, higherIsBetter: false };
  if (metricId === "FH-19") return { unit: "days", base: [80, 180], target: 120, greenDelta: 0.05, amberDelta: 0.2, higherIsBetter: false };
  if (metricId === "FH-18") return { unit: "%", base: [2, 12], target: 5, greenDelta: 0.1, amberDelta: 0.5, higherIsBetter: false };
  if (metricId === "FH-05") return { unit: "days", base: [30, 100], target: 60, greenDelta: 0.05, amberDelta: 0.2, higherIsBetter: false };
  if (metricId === "FH-06") return { unit: "days", base: [45, 110], target: 75, greenDelta: 0.05, amberDelta: 0.2, higherIsBetter: false };
  if (metricId === "FH-16") return { unit: "%", base: [-5, 30], target: 12, greenDelta: -0.1, amberDelta: -0.3, higherIsBetter: true };
  if (metricId === "FH-17") return { unit: "%", base: [4, 22], target: 10, greenDelta: 0.1, amberDelta: 0.3, higherIsBetter: false };
  if (metricId === "CM-03") return { unit: "%", base: [70, 95], target: 85, greenDelta: -0.03, amberDelta: -0.1, higherIsBetter: true };
  if (metricId === "CM-09") return { unit: "score", base: [30, 75], target: 50, greenDelta: -0.05, amberDelta: -0.2, higherIsBetter: true };
  if (metricId === "CM-02") return { unit: "count", base: [4, 28], target: 16, greenDelta: -0.1, amberDelta: -0.25, higherIsBetter: true };
  if (metricId === "GP-01") return { unit: "₹Cr", base: [3, 30], target: 18, greenDelta: -0.1, amberDelta: -0.25, higherIsBetter: true };
  if (metricId === "GP-04") return { unit: "%", base: [3, 28], target: 15, greenDelta: -0.1, amberDelta: -0.3, higherIsBetter: true };
  if (metricId === "PO-01") return { unit: "%", base: [72, 95], target: 85, greenDelta: -0.03, amberDelta: -0.1, higherIsBetter: true };
  if (metricId === "PO-03") return { unit: "%", base: [20, 70], target: 40, greenDelta: -0.05, amberDelta: -0.2, higherIsBetter: true };
  if (metricId === "PO-05") return { unit: "hrs/wk", base: [1.5, 8], target: 4, greenDelta: -0.1, amberDelta: -0.3, higherIsBetter: true };
  if (metricId === "PO-06") return { unit: "score", base: [2.8, 4.8], target: 4.0, greenDelta: -0.05, amberDelta: -0.15, higherIsBetter: true };
  if (metricId === "BD-03") return { unit: "count", base: [0, 8], target: 4, greenDelta: -0.1, amberDelta: -0.4, higherIsBetter: true };
  if (metricId === "BD-06") return { unit: "count", base: [2, 18], target: 10, greenDelta: -0.1, amberDelta: -0.4, higherIsBetter: true };
  // Default secondary band
  return { unit: "score", base: [40, 95], target: 75, greenDelta: -0.05, amberDelta: -0.2, higherIsBetter: true };
}

function ragFromDelta(deltaPct: number, spec: Spec): RAGStatus {
  // deltaPct = (value - target) / target. Positive = over target.
  if (spec.higherIsBetter) {
    if (deltaPct >= spec.greenDelta) return "green";
    if (deltaPct >= spec.amberDelta) return "amber";
    return "red";
  } else {
    if (deltaPct <= spec.greenDelta) return "green";
    if (deltaPct <= spec.amberDelta) return "amber";
    return "red";
  }
}

function pickRagSlot(idx: number, count: number, redQuota: number, amberQuota: number): RAGStatus {
  if (idx < redQuota) return "red";
  if (idx < redQuota + amberQuota) return "amber";
  return "green";
}

function valueForRag(target: number, spec: Spec, rag: RAGStatus, rnd: () => number): number {
  // Construct a value whose computed delta lands in the desired RAG band.
  const sign = spec.higherIsBetter ? 1 : -1;
  let deltaPct: number;
  if (rag === "green") {
    deltaPct = sign * (0.0 + rnd() * 0.1); // 0–10% favourable
  } else if (rag === "amber") {
    const lo = sign > 0 ? spec.amberDelta : spec.greenDelta + 0.01;
    const hi = sign > 0 ? spec.greenDelta - 0.01 : spec.amberDelta;
    deltaPct = lo + rnd() * (hi - lo);
  } else {
    deltaPct = sign > 0 ? spec.amberDelta - 0.05 - rnd() * 0.15 : spec.amberDelta + 0.05 + rnd() * 0.2;
  }
  return Math.max(spec.base[0], Math.min(spec.base[1], target * (1 + deltaPct)));
}

function trendFor(end: number, rnd: () => number): number[] {
  const arr: number[] = [];
  let v = end * (0.8 + rnd() * 0.3);
  for (let i = 0; i < 6; i++) {
    arr.push(Number(v.toFixed(2)));
    v = v + (end - v) * (0.25 + rnd() * 0.2) + (rnd() - 0.5) * end * 0.05;
  }
  arr[5] = Number(end.toFixed(2));
  return arr;
}

function metricsForPerson(person: Person): string[] {
  const primary = Object.keys(mockWeights[person.role].weights);
  // Every person now gets a value for all 53 metric definitions.
  // Primaries are still surfaced first so RAG quotas weight them naturally.
  const secondary = mockMetricDefinitions
    .map((m) => m.id)
    .filter((id) => !primary.includes(id));
  return [...primary, ...secondary];
}

function buildPersonValues(person: Person): MetricValue[] {
  const rnd = seeded(person.id);
  const ids = metricsForPerson(person);
  const count = ids.length; // 18
  const redQuota = Math.max(2, Math.round(count * 0.25)); // ensure ≥2 reds
  const amberQuota = Math.round(count * 0.35);

  // Shuffle indices deterministically so RAG slots aren't lumped on primaries.
  // Use Fisher-Yates with the seeded PRNG (Array.sort with a random comparator
  // is implementation-defined and produces SSR/CSR mismatches).
  const order = ids.map((_, i) => i);
  for (let k = order.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [order[k], order[j]] = [order[j], order[k]];
  }

  const out: MetricValue[] = [];
  ids.forEach((metricId, i) => {
    const slot = order.indexOf(i);
    const rag = pickRagSlot(slot, count, redQuota, amberQuota);
    const spec = specFor(metricId, person.role);
    const target = spec.target;
    const value = Number(valueForRag(target, spec, rag, rnd).toFixed(2));
    const deltaVsTarget = Number((((value - target) / target) * 100).toFixed(1));
    const priorYear = Number((value * (0.85 + rnd() * 0.3)).toFixed(2));
    const deltaVsPriorYear = priorYear === 0 ? null : Number((((value - priorYear) / priorYear) * 100).toFixed(1));
    out.push({
      metricId,
      personId: person.id,
      period: PERIOD,
      value,
      unit: spec.unit,
      target,
      priorYear,
      trend: trendFor(value, rnd),
      rag,
      deltaVsTarget,
      deltaVsPriorYear,
    });
  });
  return out;
}

export const mockMetricValues: MetricValue[] = mockPeople.flatMap(buildPersonValues);

// Archetype boost: lift each practice head's leadsIn metrics so they rank firm-#1.
// Runs once at module load.
for (const arch of practiceHeadArchetypes) {
  for (const metricId of arch.leadsIn) {
    const mv = mockMetricValues.find(
      (v) => v.personId === arch.id && v.metricId === metricId,
    );
    if (!mv) continue;
    if (typeof mv.value !== "number" || typeof mv.target !== "number") continue;
    const lower = isLowerIsBetter(metricId);
    const lifted = lower ? mv.target * 0.65 : mv.target * 1.2;
    mv.value = Number(lifted.toFixed(2));
    mv.rag = "green";
    mv.deltaVsTarget = Number((((mv.value - mv.target) / mv.target) * 100).toFixed(1));
    const last = mv.value as number;
    mv.trend = mv.trend.map((v, i, arr) => {
      const t = (i + 1) / arr.length;
      return Number((v * (1 - t * 0.4) + last * (t * 0.4)).toFixed(2));
    });
    mv.trend[mv.trend.length - 1] = last;
  }
}

// Override the two real partners with values provided via the partner
// metrics template. Metrics flagged passive carry null values, no RAG, and
// the source-system remark for tooltip display.
for (const [personId, metrics] of Object.entries(realPartnerData)) {
  const rnd = seeded(personId + "-real");
  for (const mv of mockMetricValues) {
    if (mv.personId !== personId) continue;
    const real = metrics[mv.metricId];
    if (!real) continue;
    if (real.value === null) {
      mv.value = null;
      mv.target = null;
      mv.priorYear = null;
      mv.trend = [];
      mv.rag = "na";
      mv.deltaVsTarget = null;
      mv.deltaVsPriorYear = null;
      mv.passive = true;
      mv.remark = real.remark ?? null;
      continue;
    }
    const spec = specFor(mv.metricId, "partner");
    const v = real.value;
    const target = spec.target;
    const delta = (v - target) / target;
    const priorYear = Number((v * (0.7 + rnd() * 0.4)).toFixed(2));
    mv.value = v;
    mv.unit = real.unit ?? spec.unit;
    mv.target = target;
    mv.priorYear = priorYear;
    mv.rag = ragFromDelta(delta, spec);
    mv.deltaVsTarget = Number((delta * 100).toFixed(1));
    mv.deltaVsPriorYear = priorYear === 0
      ? null
      : Number((((v - priorYear) / priorYear) * 100).toFixed(1));
    mv.trend = trendFor(v, rnd);
    mv.passive = false;
    mv.remark = null;
  }
}

export function getMetricValuesForPerson(personId: string): MetricValue[] {
  return mockMetricValues.filter((v) => v.personId === personId);
}

// Firm-wide inactivation: any metric whose ID is NOT present in the uploaded
// data set is rendered as "no data yet" for every person. Runs LAST so it
// supersedes both archetype boosts and the real-data overlay above.
for (const mv of mockMetricValues) {
  if (activeMetricIds.has(mv.metricId)) continue;
  mv.value = null;
  mv.target = null;
  mv.priorYear = null;
  mv.trend = [];
  mv.rag = "na";
  mv.deltaVsTarget = null;
  mv.deltaVsPriorYear = null;
  mv.passive = true;
  mv.remark = inactiveRemarkFor(mv.metricId);
}

// Firm-wide: wipe all mock metric values so the dashboard surfaces only
// live FY2025-26 API data. Any metric not yet returned from replica-api
// renders as "Awaiting live API" until it lands. Inactive-metric remarks
// (metrics with no mapping/upload) are preserved.
for (const mv of mockMetricValues) {
  if (!activeMetricIds.has(mv.metricId)) continue;
  mv.value = null;
  mv.target = null;
  mv.priorYear = null;
  mv.trend = [];
  mv.rag = "na";
  mv.deltaVsTarget = null;
  mv.deltaVsPriorYear = null;
  mv.passive = true;
  mv.remark = "Awaiting live API";
}