import type { MetricValue, RAGStatus } from "@/types";
import diversityRaw from "@/data/diversityMetrics.json";

interface DiversityEntry {
  personId: string;
  name: string;
  role: string;
  directReports: number;
  teamMale: number;
  teamFemale: number;
  teamUnknown: number;
  pctFemale: number;
  value: number;
}

interface DiversityPayload {
  metricId: string;
  period: string;
  unit: string;
  targetPctFemale: number;
  entries: DiversityEntry[];
}

const diversity = diversityRaw as unknown as DiversityPayload;

function ragFor(value: number, target: number): RAGStatus {
  if (!target) return "na";
  const delta = (value - target) / target;
  if (delta >= -0.05) return "green";
  if (delta >= -0.2) return "amber";
  return "red";
}

function remarkFor(entry: DiversityEntry): string {
  const parts = [`${entry.teamMale}M / ${entry.teamFemale}F`];
  if (entry.teamUnknown > 0) parts.push(`${entry.teamUnknown} unknown`);
  return `Team gender mix: ${parts.join(", ")} (${entry.directReports} direct reports)`;
}

export const diversityMetricValues: MetricValue[] = diversity.entries.map((entry) => {
  const target = diversity.targetPctFemale;
  const deltaVsTarget = target
    ? Number((((entry.value - target) / target) * 100).toFixed(1))
    : null;

  return {
    metricId: diversity.metricId,
    personId: entry.personId,
    period: diversity.period,
    value: entry.value,
    unit: diversity.unit,
    target,
    priorYear: null,
    trend: [entry.value],
    rag: ragFor(entry.value, target),
    deltaVsTarget,
    deltaVsPriorYear: null,
    passive: false,
    remark: remarkFor(entry),
  };
});

export function hasDiversityMetrics(): boolean {
  return diversity.entries.length > 0;
}
