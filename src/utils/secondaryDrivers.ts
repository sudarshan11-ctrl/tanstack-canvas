import type { MetricValue, PersonScore, RAGStatus } from "@/types";
import { causalLinks } from "@/data/mockCausalLinks";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { personById } from "./hierarchy";
import { mockPeople } from "@/data/mockPeople";

const RAG_WEIGHT: Record<RAGStatus, number> = { red: 3, amber: 1.5, green: -1, na: 0 };

export interface DriverImpact {
  metricId: string;
  name: string;
  rag: RAGStatus;
  value: MetricValue | undefined;
  mechanism: string;
  impactScore: number;       // higher = bigger negative pull on the primary
}

export function driversFor(
  personId: string,
  primaryId: string,
  allScores: PersonScore[],
): DriverImpact[] {
  const p = personById(personId);
  if (!p) return [];
  const s = allScores.find((x) => x.personId === personId);
  if (!s) return [];
  const links = causalLinks.filter(
    (l) => l.toId === primaryId && l.applicableRoles.includes(p.role),
  );
  return links
    .map<DriverImpact>((l) => {
      const mv = s.metricValues.find((v) => v.metricId === l.fromId);
      const def = mockMetricDefinitions.find((d) => d.id === l.fromId);
      const rag = mv?.rag ?? "na";
      return {
        metricId: l.fromId,
        name: def?.name ?? l.fromId,
        rag,
        value: mv,
        mechanism: l.mechanism,
        impactScore: RAG_WEIGHT[rag],
      };
    })
    .sort((a, b) => b.impactScore - a.impactScore);
}

// Across all of a person's primary metrics, return the most-pulling and
// most-helpful secondaries.
export interface DriverOverview {
  worst: DriverImpact[];   // dragging multiple primaries down
  best: DriverImpact[];    // green secondaries with high outdegree
}

export function driverOverviewFor(
  personId: string,
  primaryIds: string[],
  allScores: PersonScore[],
): DriverOverview {
  const all = primaryIds.flatMap((pid) => driversFor(personId, pid, allScores));
  const worst = [...all]
    .filter((d) => d.rag === "red" || d.rag === "amber")
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 6);
  const best = [...all]
    .filter((d) => d.rag === "green")
    .sort((a, b) => a.impactScore - b.impactScore)
    .slice(0, 6);
  return { worst, best };
}

export interface FirmDriverAggregate {
  metricId: string;
  name: string;
  redCount: number;
  amberCount: number;
  affected: number;       // people primary on the target where this driver is red/amber
  totalPrimaryPeople: number;
  mechanism: string;
  byRole: {
    practice_head: { red: number; amber: number; total: number };
    partner: { red: number; amber: number; total: number };
    associate: { red: number; amber: number; total: number };
  };
}

/**
 * Across every person for whom `primaryId` is a primary metric (per their role),
 * find secondary drivers that are red/amber. Returns drivers ranked by how many
 * people are currently being dragged by them.
 */
export function firmLaggingDriversFor(
  primaryId: string,
  allScores: PersonScore[],
): FirmDriverAggregate[] {
  const links = causalLinks.filter((l) => l.toId === primaryId);
  if (links.length === 0) return [];

  const def = mockMetricDefinitions.find((d) => d.id === primaryId);
  const eligiblePeople = mockPeople.filter((p) => def?.category[p.role] === "primary");
  const totalPrimaryPeople = eligiblePeople.length;

  const agg = new Map<string, FirmDriverAggregate>();
  for (const p of eligiblePeople) {
    const applicable = links.filter((l) => l.applicableRoles.includes(p.role));
    const s = allScores.find((x) => x.personId === p.id);
    if (!s || applicable.length === 0) continue;
    for (const l of applicable) {
      const mv = s.metricValues.find((v) => v.metricId === l.fromId);
      if (!mv) continue;
      const defSec = mockMetricDefinitions.find((d) => d.id === l.fromId);
      const entry = agg.get(l.fromId) ?? {
        metricId: l.fromId,
        name: defSec?.name ?? l.fromId,
        redCount: 0,
        amberCount: 0,
        affected: 0,
        totalPrimaryPeople,
        mechanism: l.mechanism,
        byRole: {
          practice_head: { red: 0, amber: 0, total: 0 },
          partner: { red: 0, amber: 0, total: 0 },
          associate: { red: 0, amber: 0, total: 0 },
        },
      };
      entry.byRole[p.role].total++;
      if (mv.rag === "red") { entry.redCount++; entry.affected++; }
      else if (mv.rag === "amber") { entry.amberCount++; entry.affected++; }
      if (mv.rag === "red") entry.byRole[p.role].red++;
      else if (mv.rag === "amber") entry.byRole[p.role].amber++;
      agg.set(l.fromId, entry);
    }
  }
  return Array.from(agg.values())
    .filter((d) => d.affected > 0)
    .sort((a, b) => (b.redCount * 2 + b.amberCount) - (a.redCount * 2 + a.amberCount))
    .slice(0, 8);
}
