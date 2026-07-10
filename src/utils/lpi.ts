import type {
  MetricArea,
  MetricDefinition,
  MetricValue,
  Role,
} from "@/types";
import { isLowerIsBetter } from "./metricDirection";

const toNum = (v: number | string | null): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * Normalise a raw metric value to a 0–100 score against its target.
 * higher-is-better: 100 means at-or-above target, scales linearly to 0 at zero.
 * lower-is-better : 100 at-or-below target, decays to 0 at 2× target.
 */
export function normaliseMetric(
  value: number,
  target: number,
  lowerIsBetter = false,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target === 0) {
    return 0;
  }
  if (lowerIsBetter) {
    if (value <= target) return 100;
    const overrun = (value - target) / target; // 0..∞
    return Math.max(0, Math.min(100, 100 * (1 - overrun)));
  }
  const ratio = value / target;
  return Math.max(0, Math.min(100, ratio * 100));
}

function valueMap(metricValues: MetricValue[]): Map<string, MetricValue> {
  const m = new Map<string, MetricValue>();
  for (const mv of metricValues) m.set(mv.metricId, mv);
  return m;
}

/**
 * Composite LPI 0–100. Weighted average of normalised primary metrics.
 * Weights for missing values are dropped and the remainder re-normalised.
 */
export function calculateLPI(
  metricValues: MetricValue[],
  weights: Record<string, number>,
  _metricDefs: MetricDefinition[],
): number {
  const lookup = valueMap(metricValues);
  let weighted = 0;
  let weightSum = 0;
  for (const [metricId, weight] of Object.entries(weights)) {
    const mv = lookup.get(metricId);
    const v = mv ? toNum(mv.value) : null;
    const t = mv ? toNum(mv.target) : null;
    if (v === null || t === null) continue;
    const score = normaliseMetric(v, t, isLowerIsBetter(metricId));
    weighted += score * weight;
    weightSum += weight;
  }
  return weightSum === 0 ? 0 : Math.round((weighted / weightSum) * 10) / 10;
}

/**
 * Average normalised score across all of a role's applicable metrics in `area`.
 */
export function calculateAreaScore(
  metricValues: MetricValue[],
  area: MetricArea,
  role: Role,
  metricDefs: MetricDefinition[],
): number {
  const inArea = new Map(
    metricDefs
      .filter((d) => d.area === area && d.category[role] !== "na")
      .map((d) => [d.id, d]),
  );
  if (inArea.size === 0) return 0;

  let sum = 0;
  let count = 0;
  for (const mv of metricValues) {
    if (!inArea.has(mv.metricId)) continue;
    const v = toNum(mv.value);
    const t = toNum(mv.target);
    if (v === null || t === null) continue;
    sum += normaliseMetric(v, t, isLowerIsBetter(mv.metricId));
    count++;
  }
  return count === 0 ? 0 : Math.round((sum / count) * 10) / 10;
}