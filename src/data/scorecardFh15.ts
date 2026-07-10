import type { MetricValue, RAGStatus, Role } from "@/types";
import scorecardRaw from "@/data/scorecardFh15.json";

interface ScorecardEntry {
  personId: string;
  name: string;
  role: Role;
  value: number;
  ewEqualsStd: boolean;
}

interface ScorecardPayload {
  metricId: string;
  period: string;
  targets: Record<Role, number>;
  entries: ScorecardEntry[];
}

const scorecard = scorecardRaw as unknown as ScorecardPayload;

function ragFor(value: number, target: number): RAGStatus {
  if (!target) return "na";
  const delta = (value - target) / target;
  if (delta >= -0.05) return "green";
  if (delta >= -0.2) return "amber";
  return "red";
}

export const scorecardFh15Values: MetricValue[] = scorecard.entries.map((entry) => {
  const target = scorecard.targets[entry.role] ?? scorecard.targets.partner;
  const deltaVsTarget = target
    ? Number((((entry.value - target) / target) * 100).toFixed(1))
    : null;

  return {
    metricId: scorecard.metricId,
    personId: entry.personId,
    period: scorecard.period,
    value: entry.value,
    unit: "₹/hr",
    target,
    priorYear: null,
    trend: [entry.value],
    rag: ragFor(entry.value, target),
    deltaVsTarget,
    deltaVsPriorYear: null,
    passive: false,
    remark: entry.ewEqualsStd
      ? "Standard hours basis (EW = Std)"
      : "Effective working hours basis (EW)",
    scorecardStar: entry.ewEqualsStd,
  };
});

export function hasScorecardFh15(): boolean {
  return scorecard.entries.length > 0;
}
