import type { Person } from "@/types";
import { mockPeople } from "./mockPeople";

export interface PracticeHeadArchetype {
  id: string;            // Person.id
  archetype: string;
  leadsIn: string[];     // metric IDs this practice head is engineered to lead the firm on
  tagline: string;
}

function archetypeForPerson(ph: Person): PracticeHeadArchetype {
  const pillar = ph.pillar ?? "Practice";
  const sub = ph.subPractice ?? pillar;
  return {
    id: ph.id,
    archetype: sub,
    leadsIn: [],
    tagline: `${pillar} · ${sub}`,
  };
}

// One squad per practice head from the live hierarchy export.
export const practiceHeadArchetypes: PracticeHeadArchetype[] = mockPeople
  .filter((p) => p.role === "practice_head")
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(archetypeForPerson);

export function practiceHeads(): Person[] {
  return mockPeople.filter((p) => p.role === "practice_head");
}

export function archetypeFor(personId: string): PracticeHeadArchetype | undefined {
  return practiceHeadArchetypes.find((a) => a.id === personId);
}
