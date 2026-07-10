import type { MetricValue } from "@/types";
import { isLowerIsBetter } from "./metricDirection";

// Phase 1 cricket overlay: treat the current period as a 90-day innings,
// 60 days bowled (Q in-progress). Real time-series ingestion comes in Phase 2.
export const PERIOD_DAYS = 90;
export const DAYS_ELAPSED = 60;
export const DAYS_REMAINING = PERIOD_DAYS - DAYS_ELAPSED;
export const ELAPSED_PCT = DAYS_ELAPSED / PERIOD_DAYS;

export type ChaseStatus = "on-track" | "needs-acceleration" | "out-of-reach";

export interface RunRate {
  metricId: string;
  unit: string;
  actualToDate: number;
  expectedToDate: number;
  target: number;
  crr: number;          // per-day pace today
  rrr: number;          // per-day pace needed to hit target
  projection: number;   // where we land if CRR holds
  status: ChaseStatus;
  lowerIsBetter: boolean;
}

const num = (v: number | string | null): number =>
  typeof v === "number" && Number.isFinite(v) ? v : NaN;

export function runRateFor(mv: MetricValue): RunRate | null {
  const actual = num(mv.value);
  const target = num(mv.target);
  if (!Number.isFinite(actual) || !Number.isFinite(target) || target === 0) return null;
  const lower = isLowerIsBetter(mv.metricId);
  const expectedToDate = target * ELAPSED_PCT;
  const crr = actual / DAYS_ELAPSED;
  // For lower-is-better metrics, RRR is the *budget* of remaining units per day.
  const remainingBudget = lower ? target - actual : target - actual;
  const rrr = remainingBudget / DAYS_REMAINING;
  const projection = lower ? actual + crr * DAYS_REMAINING : actual + crr * DAYS_REMAINING;

  let status: ChaseStatus;
  if (lower) {
    const projectedFinal = projection;
    if (projectedFinal <= target) status = "on-track";
    else if (projectedFinal <= target * 1.15) status = "needs-acceleration";
    else status = "out-of-reach";
  } else {
    if (projection >= target) status = "on-track";
    else if (projection >= target * 0.85) status = "needs-acceleration";
    else status = "out-of-reach";
  }

  return {
    metricId: mv.metricId,
    unit: mv.unit,
    actualToDate: actual,
    expectedToDate,
    target,
    crr,
    rrr,
    projection,
    status,
    lowerIsBetter: lower,
  };
}

export const STATUS_COLOR: Record<ChaseStatus, string> = {
  "on-track": "#16a34a",
  "needs-acceleration": "#d97706",
  "out-of-reach": "#dc2626",
};

export const STATUS_LABEL: Record<ChaseStatus, string> = {
  "on-track": "On pace",
  "needs-acceleration": "Needs acceleration",
  "out-of-reach": "Out of reach",
};