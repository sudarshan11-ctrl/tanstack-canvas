import type { CausalAlert, MetricValue, Role } from "@/types";
import type { CausalLink } from "@/data/mockCausalLinks";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { isLowerIsBetter } from "./metricDirection";

const nameOf = (id: string): string =>
  mockMetricDefinitions.find((m) => m.id === id)?.name ?? id;

/** A metric is "degraded vs prior year" if movement is unfavourable. */
function isDegradedVsPriorYear(mv: MetricValue | undefined): boolean {
  if (!mv || mv.deltaVsPriorYear === null) return false;
  return isLowerIsBetter(mv.metricId)
    ? mv.deltaVsPriorYear > 0
    : mv.deltaVsPriorYear < 0;
}

/**
 * Surface the top 3 causal alerts where the primary metric is red AND the
 * upstream secondary metric is degrading vs prior year.
 */
export function generateAlerts(
  metricValues: MetricValue[],
  causalLinks: CausalLink[],
  role: Role,
): CausalAlert[] {
  const byId = new Map(metricValues.map((mv) => [mv.metricId, mv]));
  const alerts: CausalAlert[] = [];

  for (const link of causalLinks) {
    if (!link.applicableRoles.includes(role)) continue;

    const primary = byId.get(link.toId);
    const secondary = byId.get(link.fromId);
    if (!primary || primary.rag !== "red") continue;
    if (!isDegradedVsPriorYear(secondary)) continue;

    const targetDelta = primary.deltaVsTarget ?? 0;
    const severity: CausalAlert["severity"] = Math.abs(targetDelta) >= 20
      ? "high"
      : "medium";

    alerts.push({
      primaryId: link.toId,
      primaryName: nameOf(link.toId),
      secondaryId: link.fromId,
      secondaryName: nameOf(link.fromId),
      mechanism: link.mechanism,
      severity,
      description: `${nameOf(link.fromId)} is degrading vs prior year and ${link.mechanism.toLowerCase()}, pulling ${nameOf(link.toId)} into red.`,
    });
  }

  alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
  return alerts.slice(0, 3);
}