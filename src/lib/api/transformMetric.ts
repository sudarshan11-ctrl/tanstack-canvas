import type { MetricValue, RAGStatus, Role } from "@/types";
import type { MetricRunResponse } from "./replica-api.server";
import type { MetricMapping } from "./metricRegistry";
import { isLowerIsBetter } from "@/utils/metricDirection";

interface Spec {
  unit: string;
  target: number;
  greenDelta: number;
  amberDelta: number;
  higherIsBetter: boolean;
}

function specFor(metricId: string, role: Role, unitHint: string): Spec {
  const lower = isLowerIsBetter(metricId);
  if (metricId === "FH-01" || metricId === "GP-07") {
    const target = role === "practice_head" ? 6 : role === "partner" ? 2 : 0.4;
    return { unit: "₹Cr", target, greenDelta: -0.05, amberDelta: -0.15, higherIsBetter: true };
  }
  if (metricId === "GP-01") return { unit: "%", target: 18, greenDelta: -0.1, amberDelta: -0.25, higherIsBetter: true };
  return {
    unit: unitHint || "score",
    target: 75,
    greenDelta: lower ? 0.05 : -0.05,
    amberDelta: lower ? 0.2 : -0.2,
    higherIsBetter: !lower,
  };
}

function ragFromDelta(deltaPct: number, spec: Spec): RAGStatus {
  if (spec.higherIsBetter) {
    if (deltaPct >= spec.greenDelta) return "green";
    if (deltaPct >= spec.amberDelta) return "amber";
    return "red";
  }
  if (deltaPct <= spec.greenDelta) return "green";
  if (deltaPct <= spec.amberDelta) return "amber";
  return "red";
}

function parseNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") {
    const n = Number(raw.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

interface PickResult {
  value: number | null;
  column: string | null;
}

// Pick the configured value column, falling back through altColumns, then the
// first numeric column. For combineColumns, sum across rows[0]. For multiRow,
// sum the value column across all rows (e.g. client-concentration buckets).
export function pickValue(mapping: MetricMapping, resp: MetricRunResponse): PickResult {
  if (resp.rows.length === 0 || resp.columns.length === 0) {
    return { value: null, column: null };
  }
  if (mapping.combineColumns.length > 0) {
    let sum = 0;
    let any = false;
    for (const c of mapping.combineColumns) {
      if (!resp.columns.includes(c)) continue;
      const n = parseNumber(resp.rows[0]?.[c]);
      if (n !== null) {
        sum += n;
        any = true;
      }
    }
    return { value: any ? sum : null, column: mapping.combineColumns.join("+") };
  }
  const candidates = [mapping.valueColumn, ...mapping.altColumns].filter(Boolean);
  const col = candidates.find((c) => resp.columns.includes(c));
  if (col) {
    if (mapping.multiRow) {
      let sum = 0;
      let any = false;
      for (const r of resp.rows) {
        const n = parseNumber(r[col]);
        if (n !== null) {
          sum += n;
          any = true;
        }
      }
      return { value: any ? sum : null, column: `Σ ${col}` };
    }
    return { value: parseNumber(resp.rows[0]?.[col]), column: col };
  }
  // Last-resort fallback: first column with a numeric value in row 0.
  for (const c of resp.columns) {
    const n = parseNumber(resp.rows[0]?.[c]);
    if (n !== null) return { value: n, column: c };
  }
  return { value: null, column: null };
}

interface TransformInput {
  metricId: string;
  personId: string;
  period: string;
  role: Role;
  mapping: MetricMapping;
  current: MetricRunResponse | null;
  priorYear?: MetricRunResponse | null;
}

export function passiveValue(metricId: string, personId: string, period: string, remark: string): MetricValue {
  return {
    metricId,
    personId,
    period,
    value: null,
    unit: "",
    target: null,
    priorYear: null,
    trend: [],
    rag: "na",
    deltaVsTarget: null,
    deltaVsPriorYear: null,
    passive: true,
    remark,
  };
}

export function transformMetric(input: TransformInput): MetricValue {
  const { metricId, personId, period, role, mapping, current, priorYear } = input;
  const spec = specFor(metricId, role, mapping.unitHint);

  if (!current) return passiveValue(metricId, personId, period, "No live data returned");

  const picked = pickValue(mapping, current);
  if (picked.value === null) {
    return passiveValue(metricId, personId, period, "No live data returned");
  }
  const scaled = picked.value * (mapping.scale || 1);
  const value = Number(scaled.toFixed(4));

  let priorYearValue: number | null = null;
  if (priorYear) {
    const py = pickValue(mapping, priorYear);
    if (py.value !== null) priorYearValue = Number((py.value * (mapping.scale || 1)).toFixed(4));
  }

  const target = spec.target;
  const deltaVsTarget = target === 0 ? null : Number((((value - target) / target) * 100).toFixed(1));
  const deltaVsPriorYear =
    priorYearValue === null || priorYearValue === 0
      ? null
      : Number((((value - priorYearValue) / priorYearValue) * 100).toFixed(1));
  const rag = ragFromDelta(target === 0 ? 0 : (value - target) / target, spec);
  const trend = priorYearValue !== null ? [priorYearValue, value] : [value];

  return {
    metricId,
    personId,
    period,
    value,
    unit: spec.unit,
    target,
    priorYear: priorYearValue,
    trend,
    rag,
    deltaVsTarget,
    deltaVsPriorYear,
    passive: false,
    remark: null,
  };
}
