import type { PersonScore, RAGStatus } from "@/types";
import { allDescendants, personById } from "./hierarchy";
import { mockWeights } from "@/data/mockWeights";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { normaliseMetric } from "./lpi";
import { isLowerIsBetter } from "./metricDirection";

export interface PrimaryScore {
  metricId: string;
  name: string;
  score: number;        // 0–100 vs target
  value: number | null;
  target: number | null;
  unit: string;
  rag: RAGStatus;
  trend: number[];
}

export function primariesFor(personId: string, allScores: PersonScore[]): PrimaryScore[] {
  const p = personById(personId);
  if (!p) return [];
  const s = allScores.find((x) => x.personId === personId);
  if (!s) return [];
  const primaryIds = Object.keys(mockWeights[p.role].weights);
  return primaryIds.map((metricId) => {
    const mv = s.metricValues.find((v) => v.metricId === metricId);
    const def = mockMetricDefinitions.find((d) => d.id === metricId);
    const val = typeof mv?.value === "number" ? mv.value : null;
    const tgt = typeof mv?.target === "number" ? mv.target : null;
    const score = val !== null && tgt !== null
      ? normaliseMetric(val, tgt, isLowerIsBetter(metricId))
      : 0;
    return {
      metricId,
      name: def?.name ?? metricId,
      score: Math.round(score),
      value: val,
      target: tgt,
      unit: mv?.unit ?? "",
      rag: mv?.rag ?? "na",
      trend: mv?.trend ?? [],
    };
  });
}

export interface RollupSummary {
  personLpi: number;
  teamLpi: number;
  wickets: number;
  greenCount: number;
  topMetrics: PrimaryScore[];
  bottomMetrics: PrimaryScore[];
  trend: number[];
  memberCount: number;
}

export function rollupFor(personId: string, allScores: PersonScore[]): RollupSummary {
  const self = allScores.find((s) => s.personId === personId);
  const personLpi = self?.lpi ?? 0;
  const desc = allDescendants(personId);
  const memberIds = new Set<string>([personId, ...desc.map((d) => d.id)]);
  const memberScores = allScores.filter((s) => memberIds.has(s.personId));
  const teamLpi = memberScores.length
    ? memberScores.reduce((s, m) => s + m.lpi, 0) / memberScores.length
    : personLpi;
  let wickets = 0;
  let greenCount = 0;
  for (const s of memberScores) {
    for (const mv of s.metricValues) {
      if (mv.rag === "red") wickets++;
      if (mv.rag === "green") greenCount++;
    }
  }
  const prims = primariesFor(personId, allScores);
  const sorted = [...prims].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, 2);
  const bot = sorted.slice(-2).reverse();
  const trend = memberScores.slice(0, 6).map((m) => m.lpi);
  return {
    personLpi,
    teamLpi,
    wickets,
    greenCount,
    topMetrics: top,
    bottomMetrics: bot,
    trend,
    memberCount: memberScores.length,
  };
}
