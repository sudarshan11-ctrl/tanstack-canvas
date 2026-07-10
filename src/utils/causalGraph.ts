import type { Role } from "@/types";
import { causalLinks, type CausalLink } from "@/data/mockCausalLinks";

export function incomingFor(metricId: string, role?: Role): CausalLink[] {
  return causalLinks.filter(
    (l) => l.toId === metricId && (!role || l.applicableRoles.includes(role)),
  );
}

export function outgoingFor(metricId: string, role?: Role): CausalLink[] {
  return causalLinks.filter(
    (l) => l.fromId === metricId && (!role || l.applicableRoles.includes(role)),
  );
}

/** Outgoing-degree weight: secondaries that drive more primaries matter more. */
export function outDegree(metricId: string, role?: Role): number {
  return outgoingFor(metricId, role).length;
}

export interface SubGraph {
  centerId: string;
  incoming: CausalLink[];
  outgoing: CausalLink[];
}

export function subgraphFor(metricId: string, role?: Role): SubGraph {
  return {
    centerId: metricId,
    incoming: incomingFor(metricId, role),
    outgoing: outgoingFor(metricId, role),
  };
}