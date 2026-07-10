import type { Person, PersonScore } from "@/types";
import { mockPeople } from "@/data/mockPeople";

export interface PomTag {
  id: string;
  label: string;
  metric: string;
  person?: Person;
  detail: string;
}

const personById = (id: string) => mockPeople.find((p) => p.id === id);

function topBy(metricId: string, scores: PersonScore[]): { person: Person; value: number } | null {
  let best: { person: Person; value: number } | null = null;
  for (const s of scores) {
    const mv = s.metricValues.find((m) => m.metricId === metricId);
    if (!mv || typeof mv.value !== "number") continue;
    if (!best || mv.value > best.value) {
      const p = personById(s.personId);
      if (p) best = { person: p, value: mv.value };
    }
  }
  return best;
}

function lowestBy(metricId: string, scores: PersonScore[]): { person: Person; value: number } | null {
  let best: { person: Person; value: number } | null = null;
  for (const s of scores) {
    const mv = s.metricValues.find((m) => m.metricId === metricId);
    if (!mv || typeof mv.value !== "number") continue;
    if (!best || mv.value < best.value) {
      const p = personById(s.personId);
      if (p) best = { person: p, value: mv.value };
    }
  }
  return best;
}

export function playerOfTheMatchTags(scores: PersonScore[]): PomTag[] {
  const tags: PomTag[] = [];

  // Highest run-rate (highest LPI)
  const lpiSorted = [...scores].sort((a, b) => b.lpi - a.lpi);
  const top = lpiSorted[0];
  if (top) {
    const p = personById(top.personId);
    if (p) tags.push({
      id: "run-rate",
      label: "Highest run-rate",
      metric: "Performance Index",
      person: p,
      detail: `Performance Index ${Math.round(top.lpi)} — leading the firm this period.`,
    });
  }

  const originator = topBy("FH-01", scores);
  if (originator) tags.push({
    id: "originator",
    label: "Top originator",
    metric: "FH-01",
    person: originator.person,
    detail: `Originated ₹${originator.value.toFixed(2)} Cr.`,
  });

  const supervisor = topBy("PO-05", scores);
  if (supervisor) tags.push({
    id: "supervisor",
    label: "Best supervisor",
    metric: "PO-05",
    person: supervisor.person,
    detail: `${supervisor.value.toFixed(1)} supervision hrs/wk/associate.`,
  });

  // Match-saving knock — biggest positive trend swing on any primary
  let bestSwing: { person: Person; metric: string; delta: number } | null = null;
  for (const s of scores) {
    for (const mv of s.metricValues) {
      if (mv.trend.length < 2) continue;
      const delta = mv.trend[mv.trend.length - 1] - mv.trend[0];
      if (delta <= 0) continue;
      if (!bestSwing || delta > bestSwing.delta) {
        const p = personById(s.personId);
        if (p) bestSwing = { person: p, metric: mv.metricId, delta };
      }
    }
  }
  if (bestSwing) tags.push({
    id: "knock",
    label: "Match-saving knock",
    metric: bestSwing.metric,
    person: bestSwing.person,
    detail: `Biggest in-period recovery on ${bestSwing.metric}.`,
  });

  const economy = lowestBy("FH-19", scores);
  if (economy) tags.push({
    id: "economy",
    label: "Economy bowler",
    metric: "FH-19",
    person: economy.person,
    detail: `Lockup at ${Math.round(economy.value)} days — tightest in the firm.`,
  });

  return tags;
}