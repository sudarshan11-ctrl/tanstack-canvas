import { Link } from "@tanstack/react-router";
import type { CausalLink } from "@/data/mockCausalLinks";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";

export interface CausalSubgraphProps {
  centerId: string;
  incoming: CausalLink[];
  outgoing: CausalLink[];
}

const nameOf = (id: string) =>
  mockMetricDefinitions.find((m) => m.id === id)?.name ?? id;

function Pill({ id, side }: { id: string; side: "in" | "out" | "center" }) {
  const tone =
    side === "in" ? "bg-blue-50 text-blue-700 border-blue-200" :
    side === "out" ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-slate-900 text-white border-slate-900";
  return (
    <Link
      to="/metric/$id"
      params={{ id }}
      className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[12px] transition-colors hover:opacity-80 ${tone}`}
    >
      <span className="font-mono text-[10px] opacity-70">{id}</span>
      <span className="truncate max-w-[10rem]">{nameOf(id)}</span>
    </Link>
  );
}

export default function CausalSubgraph({ centerId, incoming, outgoing }: CausalSubgraphProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="flex flex-col items-end gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          Driven by ({incoming.length})
        </div>
        {incoming.length === 0 ? (
          <div className="text-[11px] italic text-slate-400">No incoming drivers (root primary).</div>
        ) : (
          incoming.map((l) => (
            <div key={l.fromId + l.toId} className="flex flex-col items-end gap-1">
              <Pill id={l.fromId} side="in" />
              <div className="text-[10px] text-slate-500 italic max-w-[13.75rem] text-right">
                {l.mechanism}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <Pill id={centerId} side="center" />
        <div className="text-[10px] text-slate-400">this metric</div>
      </div>

      <div className="flex flex-col items-start gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          Drives ({outgoing.length})
        </div>
        {outgoing.length === 0 ? (
          <div className="text-[11px] italic text-slate-400">No downstream primaries.</div>
        ) : (
          outgoing.map((l) => (
            <div key={l.fromId + l.toId} className="flex flex-col items-start gap-1">
              <Pill id={l.toId} side="out" />
              <div className="text-[10px] text-slate-500 italic max-w-[13.75rem]">
                {l.mechanism}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}