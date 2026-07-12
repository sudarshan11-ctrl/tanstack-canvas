// Source-of-truth for which metrics actually have uploaded data.
// A metric is "active" if at least one person in the uploaded data set
// has a non-null value for it. Everything else is rendered as inactive
// (no data yet) across the app.
import { realPersonData } from "@/data/realPeopleData";
import { hasScorecardFh15 } from "@/data/scorecardFh15";
import { hasDiversityMetrics } from "@/data/diversityMetrics";

function computeActive(): Set<string> {
  const active = new Set<string>();
  for (const metrics of Object.values(realPersonData)) {
    for (const [id, entry] of Object.entries(metrics)) {
      if (entry && entry.value !== null && entry.value !== undefined) {
        active.add(id);
      }
    }
  }
  if (hasScorecardFh15()) active.add("FH-15");
  if (hasDiversityMetrics()) active.add("PO-03");
  return active;
}

export const activeMetricIds: ReadonlySet<string> = computeActive();

export function isMetricActive(metricId: string): boolean {
  return activeMetricIds.has(metricId);
}

export const INACTIVE_METRIC_REMARK =
  "Data not yet available for this metric in the FY2022-23 upload.";

/** Metrics whose score depends on a target that has not been set yet. */
export const AWAITING_TARGET_METRIC_IDS: ReadonlySet<string> = new Set([
  "FH-09", // Utilization rate
  "PO-02", // Time-to-productivity
]);

export const AWAITING_TARGET_REMARK =
  "Metric to be calculated when target will be entered.";

export function inactiveRemarkFor(metricId: string): string {
  if (AWAITING_TARGET_METRIC_IDS.has(metricId)) return AWAITING_TARGET_REMARK;
  return INACTIVE_METRIC_REMARK;
}
