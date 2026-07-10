import type { Person, PracticePillar, PracticeArea, Role } from "@/types";
import hierarchy from "./lksHierarchy.json";

// People are sourced from LKS_Firm_Hierarchy (19 June 2026 export). Each
// row is mapped to the dashboard's three-tier role model:
//   - 10 named group heads from the Summary sheet -> practice_head
//   - Executive Partner / Senior Partner / Partner -> partner
//   - everyone else (Associate Partner, Principal/Senior/Associate,
//     Director, Of Counsel, ...) -> associate
// Live LCMS metric ids are attached per person where the hierarchy name
// matches an LCMS user; unmatched people fall through to passive values.

interface HierRow {
  id: string;
  employeeCode: number;
  name: string;
  designation: string;
  role: Role;
  office: string;
  division: string;
  subDivision: string;
  teamMapping: string;
  reportingAuthority: string;
  reportingPartner: string;
  practiceHeadName: string;
  pillar: string;
  subPractice: string;
  supervisorId?: string | null;
  lcmsUserId?: number;
  isSubHead?: boolean;
  subHeadFor?: string;
}

const rows = hierarchy as HierRow[];

function initialsOf(name: string): string {
  const parts = name.replace(/\([^)]*\)/g, "").trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tenureFor(role: Role, designation: string): number {
  if (role === "practice_head") return 22;
  if (role === "partner") return 12;
  if (/Principal|Senior/i.test(designation)) return 6;
  return 3;
}

export const mockPeople: Person[] = rows.map((r) => ({
  id: r.id,
  name: r.name,
  initials: initialsOf(r.name),
  role: r.role,
  designation: r.designation,
  pillar: r.pillar as PracticePillar,
  subPractice: (r.isSubHead
    ? `${r.subPractice} · Sub-Head / Lead`
    : r.subPractice) as PracticeArea,
  office: r.office || "New Delhi",
  tenureYears: tenureFor(r.role, r.designation),
  supervisorId: r.supervisorId ?? undefined,
  lcmsUserId: r.lcmsUserId,
  isSubHead: r.isSubHead,
  subHeadFor: r.subHeadFor,
}));

// Back-compat exports for downstream code that imported the old maps.
export const promotedPartnerIdToPracticeHeadId = new Map<string, string>();
export const associateIdToReassignedPartnerId: Record<string, string> = {};
