import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import type { Squad } from "@/utils/squad";
import { bandFor, BAND_COLOR } from "@/utils/bsc";
import LPIDial from "@/components/ui/LPIDial";

export interface SquadRosterProps {
  squad: Squad;
}

export default function SquadRoster({ squad }: SquadRosterProps) {
  const [open, setOpen] = useState<Set<string>>(new Set(squad.partners.map((p) => p.person.id)));
  const [query, setQuery] = useState("");
  const toggle = (id: string) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  // Map associates by supervisor
  const associatesBySupervisor = new Map<string, typeof squad.associates>();
  for (const a of squad.associates) {
    const sup = a.person.supervisorId ?? squad.captain.id;
    const list = associatesBySupervisor.get(sup) ?? [];
    list.push(a);
    associatesBySupervisor.set(sup, list);
  }
  // Associates with the practice head as direct supervisor
  const directAssociates = associatesBySupervisor.get(squad.captain.id) ?? [];

  const q = query.trim().toLowerCase();
  const matches = (p: import("@/types").Person) =>
    !q ||
    [p.name, p.subPractice ?? "", p.office ?? ""].join(" ").toLowerCase().includes(q);
  const showCaptain = matches(squad.captain);
  const filteredPartners = squad.partners.filter((p) => {
    if (matches(p.person)) return true;
    const kids = associatesBySupervisor.get(p.person.id) ?? [];
    return kids.some((k) => matches(k.person));
  });
  const filteredDirect = directAssociates.filter((a) => matches(a.person));

  return (
    <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "#e2e8f0" }}>
      <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2" style={{ borderColor: "#e2e8f0" }}>
        <div className="text-[11px] text-slate-500">{squad.members.length} on roster</div>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roster..."
            className="w-56 rounded-md border border-slate-200 bg-white py-1 pl-7 pr-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-[24px_minmax(180px,1.5fr)_80px_80px_70px_100px] items-center gap-3 border-b bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500" style={{ borderColor: "#e2e8f0" }}>
        <div />
        <div>Member</div>
        <div className="text-right">Performance Index</div>
        <div className="text-right">CRR %</div>
        <div className="text-right">RRR %</div>
        <div className="text-right">Strongest</div>
      </div>

      {/* Captain row */}
      {showCaptain ? (
        <Row entry={{ person: squad.captain, score: squad.members[0].score }} roleLabel="Practice Head" depth={0} />
      ) : null}

      {filteredPartners.map((p) => {
        const isOpen = open.has(p.person.id);
        const allKids = associatesBySupervisor.get(p.person.id) ?? [];
        const kids = q ? allKids.filter((k) => matches(k.person)) : allKids;
        return (
          <div key={p.person.id}>
            <Row
              entry={p}
              roleLabel="Partner"
              depth={1}
              expandable={allKids.length > 0}
              isOpen={q ? true : isOpen}
              onToggle={() => toggle(p.person.id)}
            />
            {(q || isOpen) && kids.map((k) => (
              <Row key={k.person.id} entry={k} roleLabel="Associate" depth={2} />
            ))}
          </div>
        );
      })}

      {filteredDirect.map((a) => (
        <Row key={a.person.id} entry={a} roleLabel="Associate" depth={1} />
      ))}

      {q && !showCaptain && filteredPartners.length === 0 && filteredDirect.length === 0 ? (
        <div className="px-4 py-6 text-center text-[12px] text-slate-400">No members match "{query}"</div>
      ) : null}
    </div>
  );
}

function Row({
  entry,
  roleLabel,
  depth,
  expandable,
  isOpen,
  onToggle,
}: {
  entry: { person: import("@/types").Person; score?: import("@/types").PersonScore };
  roleLabel: string;
  depth: number;
  expandable?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const score = entry.score;
  const lpi = score?.lpi ?? 0;
  const band = bandFor(lpi);
  const reds = score?.metricValues.filter((mv) => mv.rag === "red").length ?? 0;
  const greens = score?.metricValues.filter((mv) => mv.rag === "green").length ?? 0;
  const total = score?.metricValues.length ?? 1;
  const crr = Math.round((greens / total) * 100);
  const rrr = Math.round((reds / total) * 100);
  const strongest = score?.metricValues
    .filter((mv) => mv.rag === "green")
    .sort((a, b) => (b.deltaVsTarget ?? 0) - (a.deltaVsTarget ?? 0))[0];

  return (
    <Link
      to="/profile/$id"
      params={{ id: entry.person.id }}
      className="grid grid-cols-[24px_minmax(180px,1.5fr)_80px_80px_70px_100px] items-center gap-3 border-b px-4 py-2.5 transition-colors hover:bg-slate-50"
      style={{ borderColor: "#f1f5f9", paddingLeft: 16 + depth * 16 }}
    >
      <button
        type="button"
        onClick={(e) => {
          if (!onToggle) return;
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className={"text-slate-400 " + (expandable ? "cursor-pointer hover:text-slate-700" : "invisible")}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="flex items-center justify-center rounded-full text-blue-700"
          style={{ width: 30, height: 30, backgroundColor: "#dbeafe", fontSize: 11, fontWeight: 600 }}
        >
          {entry.person.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-slate-900">{entry.person.name}</div>
          <div className="truncate text-[11px] text-slate-500">{roleLabel} · {entry.person.subPractice}</div>
        </div>
      </div>
      <div className="flex justify-end">
        <LPIDial score={lpi} status={score?.rag ?? "na"} size="sm" />
      </div>
      <div className="text-right font-mono text-[12px] text-green-700">{crr}</div>
      <div className="text-right font-mono text-[12px] text-amber-700">{rrr}</div>
      <div className="text-right">
        {strongest ? (
          <span
            className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
            style={{ backgroundColor: BAND_COLOR[band] }}
          >
            {strongest.metricId}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">—</span>
        )}
      </div>
    </Link>
  );
}