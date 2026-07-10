import type { Person, Role } from "@/types";
import { mockPeople } from "@/data/mockPeople";

const byId = new Map<string, Person>(mockPeople.map((p) => [p.id, p]));
const childrenMap = new Map<string, string[]>();
for (const p of mockPeople) {
  if (p.supervisorId) {
    const list = childrenMap.get(p.supervisorId) ?? [];
    list.push(p.id);
    childrenMap.set(p.supervisorId, list);
  }
}

export function personById(id: string): Person | undefined {
  return byId.get(id);
}

export function directReports(id: string): Person[] {
  return (childrenMap.get(id) ?? []).map((cid) => byId.get(cid)!).filter(Boolean);
}

export function allDescendants(id: string): Person[] {
  const out: Person[] = [];
  const queue = [...(childrenMap.get(id) ?? [])];
  while (queue.length) {
    const cid = queue.shift()!;
    const p = byId.get(cid);
    if (p) out.push(p);
    queue.push(...(childrenMap.get(cid) ?? []));
  }
  return out;
}

export function partnersOfEp(epId: string): Person[] {
  return directReports(epId).filter((p) => p.role === "partner");
}

export function directAssociatesOfEp(epId: string): Person[] {
  return directReports(epId).filter((p) => p.role === "associate");
}

export function associatesOfPartner(partnerId: string): Person[] {
  return directReports(partnerId).filter((p) => p.role === "associate");
}

export function partnersOfPartner(partnerId: string): Person[] {
  return directReports(partnerId).filter((p) => p.role === "partner");
}

export function directAssociatesOfPartner(partnerId: string): Person[] {
  return directReports(partnerId).filter((p) => p.role === "associate");
}

export function epOfPartner(partnerId: string): Person | undefined {
  let current = byId.get(partnerId);
  const seen = new Set<string>();
  while (current?.supervisorId && !seen.has(current.supervisorId)) {
    seen.add(current.supervisorId);
    const sup = byId.get(current.supervisorId);
    if (!sup) break;
    if (sup.role === "practice_head") return sup;
    current = sup;
  }
  return undefined;
}

export function partnerOfAssociate(associateId: string): Person | undefined {
  let current = byId.get(associateId);
  const seen = new Set<string>();
  while (current?.supervisorId && !seen.has(current.supervisorId)) {
    seen.add(current.supervisorId);
    const sup = byId.get(current.supervisorId);
    if (!sup) break;
    if (sup.role === "partner") return sup;
    current = sup;
  }
  return undefined;
}

export function epsOfFirm(): Person[] {
  return mockPeople.filter((p) => p.role === "practice_head");
}

export function chainFor(personId: string): { ep?: Person; partner?: Person; associate?: Person } {
  const p = byId.get(personId);
  if (!p) return {};
  if (p.role === "practice_head") return { ep: p };
  if (p.role === "partner") return { ep: epOfPartner(p.id), partner: p };
  const partner = partnerOfAssociate(p.id);
  const ep = partner ? epOfPartner(partner.id) : undefined;
  return { ep, partner, associate: p };
}

export function roleOf(id: string): Role | undefined {
  return byId.get(id)?.role;
}
