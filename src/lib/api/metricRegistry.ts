import type { Role } from "@/types";
import apiMetricMapRaw from "@/data/apiMetricMap.json";

export type ParamKey = "ep_user_id" | "partner_user_id" | "associate_user_id";

export interface MetricMapping {
  apiMetricId: string;
  paramKey: ParamKey;
  valueColumn: string;
  altColumns: string[];
  combineColumns: string[];
  scale: number;
  unitHint: string;
  multiRow: boolean;
  needsPrevFy: boolean;
}

type RoleKey = "practice_head" | "partner" | "associate";
interface ApiMetricEntry {
  valueColumn?: string;
  altColumns?: string[];
  combineColumns?: string[];
  scale?: number;
  unitHint?: string;
  multiRow?: boolean;
  needs_prev_fy?: boolean;
  practice_head?: string;
  partner?: string;
  associate?: string;
}
type ApiMetricMap = Record<string, ApiMetricEntry>;

const apiMetricMap = apiMetricMapRaw as ApiMetricMap;

const roleToParamKey: Record<RoleKey, ParamKey> = {
  practice_head: "ep_user_id",
  partner: "partner_user_id",
  associate: "associate_user_id",
};

// Pick the API variant (equity-partner / partner / associate) for a person.
// Rule, per product:
//   - Group heads (role === "practice_head") -> equity-partner endpoints.
//   - Any other Partner-tier designation (Executive Partner, Senior Partner,
//     Partner, Associate Partner) -> partner endpoints.
//   - Every associate-tier designation (Associate, Senior Associate,
//     Principal Associate, Associate Director, Director, Consultant,
//     Of Counsel) -> associate endpoints.
export function resolveApiRole(
  role: Role | RoleKey | undefined | null,
  designation: string | undefined | null,
): RoleKey | null {
  if (role === "practice_head") return "practice_head";
  const d = (designation ?? "").trim().toLowerCase();
  if (
    d === "executive partner" ||
    d === "senior partner" ||
    d === "partner" ||
    d === "associate partner"
  ) {
    return "partner";
  }
  if (
    d === "principal associate" ||
    d === "senior associate" ||
    d === "associate" ||
    d === "associate director" ||
    d === "director" ||
    d === "consultant" ||
    d === "of counsel"
  ) {
    return "associate";
  }
  if (role === "partner" || role === "associate") return role;
  return null;
}

export function getMetricMapping(portalMetricId: string, role: Role | RoleKey): MetricMapping | null {
  if (role !== "practice_head" && role !== "partner" && role !== "associate") return null;
  const entry = apiMetricMap[portalMetricId];
  if (!entry) return null;
  const apiMetricId = entry[role];
  if (!apiMetricId) return null;
  return {
    apiMetricId,
    paramKey: roleToParamKey[role],
    valueColumn: entry.valueColumn ?? "",
    altColumns: entry.altColumns ?? [],
    combineColumns: entry.combineColumns ?? [],
    scale: typeof entry.scale === "number" ? entry.scale : 1,
    unitHint: entry.unitHint ?? "",
    multiRow: entry.multiRow === true,
    needsPrevFy: entry.needs_prev_fy === true,
  };
}

export function listMappedPortalMetricIds(role: Role | RoleKey): string[] {
  if (role !== "practice_head" && role !== "partner" && role !== "associate") return [];
  return Object.entries(apiMetricMap)
    .filter(([, entry]) => Boolean(entry[role]))
    .map(([portalId]) => portalId);
}
