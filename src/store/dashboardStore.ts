import { create } from "zustand";
import type {
  MetricArea,
  MetricValue,
  PersonScore,
  PracticePillar,
  Role,
  WeightConfig,
} from "@/types";
import { mockPeople } from "@/data/mockPeople";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { mockMetricValues } from "@/data/mockMetricValues";
import { snapshotMetricValues } from "@/data/snapshotMetricValues";
import { scorecardFh15Values } from "@/data/scorecardFh15";
import { diversityMetricValues } from "@/data/diversityMetrics";
import { mockWeights } from "@/data/mockWeights";
import { causalLinks } from "@/data/mockCausalLinks";
import { calculateLPI, calculateAreaScore } from "@/utils/lpi";
import { lpiToRAG } from "@/utils/rag";
import { generateAlerts } from "@/utils/alerts";

const PERIOD = "FY2025-26";
const PRIOR_PERIOD = "FY2024-25";


const AREAS: MetricArea[] = [
  "financial_health",
  "client_matter",
  "people_ops",
  "growth_pipeline",
  "brand_discoverability",
];

function emptyAreaScores(): Record<MetricArea, number> {
  return AREAS.reduce(
    (acc, a) => ({ ...acc, [a]: 0 }),
    {} as Record<MetricArea, number>,
  );
}

// Merge snapshot values over mock scaffolding: for any (personId, metricId)
// present in src/data/metricsSnapshot.json, replace the mock entry. Metrics
// not covered by the snapshot keep their placeholder so structure/weights
// stay intact.
function mergeMetricValues(...overlays: MetricValue[][]): MetricValue[] {
  const apiIndex = new Map<string, MetricValue>();
  for (const batch of overlays) {
    for (const v of batch) apiIndex.set(`${v.personId}::${v.metricId}`, v);
  }
  if (apiIndex.size === 0) return mockMetricValues;
  return mockMetricValues.map((mv) => apiIndex.get(`${mv.personId}::${mv.metricId}`) ?? mv);
}

function valuesForPerson(values: MetricValue[], personId: string): MetricValue[] {
  return values.filter((v) => v.personId === personId);
}

function computePersonScores(weights: WeightConfig, values: MetricValue[]): PersonScore[] {
  const rows = mockPeople.map((p) => {
    const personValues = valuesForPerson(values, p.id);
    const lpi = calculateLPI(personValues, weights[p.role].weights, mockMetricDefinitions);
    const areaScores = emptyAreaScores();
    const areaScoresPriorYear = emptyAreaScores();
    for (const a of AREAS) {
      areaScores[a] = calculateAreaScore(personValues, a, p.role, mockMetricDefinitions);
      areaScoresPriorYear[a] = Math.max(
        0,
        Math.min(100, areaScores[a] * (0.85 + ((p.id.charCodeAt(p.id.length - 1) % 30) / 100))),
      );
    }
    const alerts = generateAlerts(personValues, causalLinks, p.role);
    return {
      personId: p.id,
      period: PERIOD,
      lpi,
      rag: lpiToRAG(lpi),
      areaScores,
      areaScoresPriorYear,
      metricValues: personValues,
      alerts,
      pillarRank: 0,
      pillarTotal: 0,
      firmRank: 0,
      firmTotal: mockPeople.length,
    } satisfies PersonScore;
  });

  const byPillar = new Map<PracticePillar, string[]>();
  for (const p of mockPeople) {
    const list = byPillar.get(p.pillar) ?? [];
    list.push(p.id);
    byPillar.set(p.pillar, list);
  }

  const lpiOf = (id: string) => rows.find((r) => r.personId === id)!.lpi;

  const firmOrder = [...mockPeople].map((p) => p.id).sort((a, b) => lpiOf(b) - lpiOf(a));
  const firmRankMap = new Map(firmOrder.map((id, i) => [id, i + 1]));

  const pillarRankMap = new Map<string, { rank: number; total: number }>();
  for (const [pillar, ids] of byPillar) {
    const sorted = [...ids].sort((a, b) => lpiOf(b) - lpiOf(a));
    sorted.forEach((id, i) => pillarRankMap.set(id, { rank: i + 1, total: ids.length }));
    void pillar;
  }

  for (const r of rows) {
    r.firmRank = firmRankMap.get(r.personId) ?? 0;
    const pr = pillarRankMap.get(r.personId);
    if (pr) {
      r.pillarRank = pr.rank;
      r.pillarTotal = pr.total;
    }
  }

  return rows;
}

// The dashboard renders from the JSON snapshot (fetched via API calls by
// scripts/fetchMetricsSnapshot.mjs). No network calls happen at runtime.
const seedValues: MetricValue[] = mergeMetricValues(
  snapshotMetricValues,
  scorecardFh15Values,
  diversityMetricValues,
);

interface DashboardStore {
  selectedPersonId: string | null;
  selectedRole: Role | "all";
  selectedPillar: PracticePillar | "all";
  selectedPeriod: string;

  weights: WeightConfig;
  metricValues: MetricValue[];
  personScores: PersonScore[];

  loading: boolean;
  loaded: boolean;
  error: string | null;
  dataSource: "snapshot" | "mock";

  setSelectedPerson: (id: string | null) => void;
  setRoleFilter: (role: Role | "all") => void;
  setPillarFilter: (pillar: PracticePillar | "all") => void;
  updateWeight: (role: Role, metricId: string, weight: number) => void;
  recalculateScores: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  selectedPersonId: null,
  selectedRole: "all",
  selectedPillar: "all",
  selectedPeriod: PERIOD,

  weights: mockWeights,
  metricValues: seedValues,
  personScores: computePersonScores(mockWeights, seedValues),

  loading: false,
  loaded: true,
  error: null,
  dataSource: snapshotMetricValues.length > 0 ? "snapshot" : "mock",

  setSelectedPerson: (id) => set({ selectedPersonId: id }),
  setRoleFilter: (role) => set({ selectedRole: role }),
  setPillarFilter: (pillar) => set({ selectedPillar: pillar }),

  updateWeight: (role, metricId, weight) => {
    const { weights, metricValues } = get();
    const next: WeightConfig = {
      ...weights,
      [role]: {
        ...weights[role],
        weights: { ...weights[role].weights, [metricId]: weight },
      },
    };
    set({ weights: next, personScores: computePersonScores(next, metricValues) });
  },

  recalculateScores: () => {
    const { weights, metricValues } = get();
    set({ personScores: computePersonScores(weights, metricValues) });
  },

}));

// Re-export for downstream consumers
export { mockMetricValues, PRIOR_PERIOD };
