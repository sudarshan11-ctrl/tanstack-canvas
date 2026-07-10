import type { PersonScore, RAGStatus, MetricArea } from "@/types";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { isLowerIsBetter } from "./metricDirection";
import { personById } from "./hierarchy";

export type AggregateLevel = "firm" | "practice_head" | "partner" | "associate";

export interface FirmMetricAggregate {
  id: string;
  name: string;
  area: MetricArea;
  isPrimaryAnywhere: boolean;
  avg: number | null;
  target: number | null;
  unit: string;
  deltaPct: number | null;       // signed, positive = better than target
  redCount: number;
  amberCount: number;
  greenCount: number;
  naCount: number;
  total: number;
  dominantRag: RAGStatus;
}

function dominant(red: number, amber: number, green: number, na: number): RAGStatus {
  const max = Math.max(red, amber, green, na);
  if (max === 0) return "na";
  if (red === max) return "red";
  if (amber === max) return "amber";
  if (green === max) return "green";
  return "na";
}

export function aggregateFirmMetrics(
  scores: PersonScore[],
  level: AggregateLevel = "firm",
): FirmMetricAggregate[] {
  const roleFilter =
    level === "practice_head" ? "practice_head" :
    level === "partner" ? "partner" :
    level === "associate" ? "associate" : null;
  const scoped = roleFilter
    ? scores.filter((s) => personById(s.personId)?.role === roleFilter)
    : scores;
  return mockMetricDefinitions.map((def) => {
    const lower = isLowerIsBetter(def.id);
    let sum = 0;
    let n = 0;
    let target: number | null = null;
    let unit = "";
    let red = 0, amber = 0, green = 0, na = 0;
    for (const s of scoped) {
      const mv = s.metricValues.find((v) => v.metricId === def.id);
      if (!mv) continue;
      if (typeof mv.value === "number") { sum += mv.value; n++; }
      if (target === null && typeof mv.target === "number") target = mv.target;
      if (!unit && mv.unit) unit = mv.unit;
      if (mv.rag === "red") red++;
      else if (mv.rag === "amber") amber++;
      else if (mv.rag === "green") green++;
      else na++;
    }
    const avg = n > 0 ? sum / n : null;
    const deltaPct =
      avg !== null && target !== null && target !== 0
        ? ((avg - target) / Math.abs(target)) * 100 * (lower ? -1 : 1)
        : null;
    const isPrimaryAnywhere =
      def.category.practice_head === "primary" ||
      def.category.partner === "primary" ||
      def.category.associate === "primary";
    return {
      id: def.id,
      name: def.name,
      area: def.area,
      isPrimaryAnywhere,
      avg,
      target,
      unit,
      deltaPct,
      redCount: red,
      amberCount: amber,
      greenCount: green,
      naCount: na,
      total: red + amber + green + na,
      dominantRag: dominant(red, amber, green, na),
    };
  });
}
