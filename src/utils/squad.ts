import type { Person, PersonScore } from "@/types";
import { mockPeople } from "@/data/mockPeople";
import { practiceHeadArchetypes } from "@/data/practiceHeads";

export interface SquadMember {
  person: Person;
  score?: PersonScore;
}

export interface Squad {
  captain: Person;
  archetype: string;
  leadsIn: string[];
  tagline: string;
  partners: SquadMember[];
  associates: SquadMember[];
  members: SquadMember[]; // captain + partners + associates
}

function subordinatesOf(personId: string): Person[] {
  const directs = mockPeople.filter((p) => p.supervisorId === personId);
  const all: Person[] = [...directs];
  for (const d of directs) all.push(...subordinatesOf(d.id));
  return all;
}

export function buildSquads(personScores: PersonScore[]): Squad[] {
  const scoreOf = (id: string) => personScores.find((s) => s.personId === id);
  return practiceHeadArchetypes.map((arch) => {
    const captain = mockPeople.find((p) => p.id === arch.id)!;
    const subs = subordinatesOf(arch.id);
    const partners = subs
      .filter((p) => p.role === "partner")
      .map((person) => ({ person, score: scoreOf(person.id) }));
    const associates = subs
      .filter((p) => p.role === "associate")
      .map((person) => ({ person, score: scoreOf(person.id) }));
    const members: SquadMember[] = [
      { person: captain, score: scoreOf(captain.id) },
      ...partners,
      ...associates,
    ];
    return {
      captain,
      archetype: arch.archetype,
      leadsIn: arch.leadsIn,
      tagline: arch.tagline,
      partners,
      associates,
      members,
    };
  });
}

export interface SquadStanding {
  squad: Squad;
  squadLpi: number;
  crrAvg: number;  // % of expected pace achieved across primaries
  rrrAvg: number;  // % pace needed for remaining
  projectionLpi: number;
  wickets: number; // count of red primaries across squad
}

export function buildStandings(personScores: PersonScore[]): SquadStanding[] {
  const squads = buildSquads(personScores);
  return squads.map((squad) => {
    const scored = squad.members.filter((m) => m.score);
    const lpiList = scored.map((m) => m.score!.lpi);
    const squadLpi = lpiList.length ? lpiList.reduce((a, b) => a + b, 0) / lpiList.length : 0;

    let primaryHits = 0;
    let primaryTotal = 0;
    let wickets = 0;
    for (const m of scored) {
      for (const mv of m.score!.metricValues) {
        // Only count primary metrics for the person's role
        // (cheap heuristic: weight presence in primary set)
        primaryTotal += 1;
        if (mv.rag === "green") primaryHits += 1;
        if (mv.rag === "red") wickets += 1;
      }
    }
    const completion = primaryTotal ? primaryHits / primaryTotal : 0;
    // CRR vs RRR proxy from the share of primaries on track
    const crrAvg = completion * 100;
    const rrrAvg = Math.max(0, 100 - completion * 100);
    const projectionLpi = squadLpi; // Phase 1 proxy
    return { squad, squadLpi, crrAvg, rrrAvg, projectionLpi, wickets };
  }).sort((a, b) => b.squadLpi - a.squadLpi);
}

export function squadForPerson(personId: string, personScores: PersonScore[]): Squad | undefined {
  const squads = buildSquads(personScores);
  return squads.find((sq) => sq.members.some((m) => m.person.id === personId));
}