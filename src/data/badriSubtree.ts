import hierarchy from "./lksHierarchy.json";

interface HierRow {
  id: string;
  supervisorId?: string | null;
}

const ROOT_ID = "lks-1130";

function computeSubtree(rootId: string): Set<string> {
  const rows = hierarchy as HierRow[];
  const childrenBySupervisor = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.supervisorId) continue;
    const list = childrenBySupervisor.get(r.supervisorId) ?? [];
    list.push(r.id);
    childrenBySupervisor.set(r.supervisorId, list);
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    for (const child of childrenBySupervisor.get(id) ?? []) stack.push(child);
  }
  return out;
}

// L Badrinarayanan (lks-1130) + every direct/indirect report.
// This subset is the only group fetched live; the rest of the hierarchy
// keeps mock values for now.
export const badriSubtreeIds: ReadonlySet<string> = computeSubtree(ROOT_ID);

export function isInBadriSubtree(personId: string): boolean {
  return badriSubtreeIds.has(personId);
}
