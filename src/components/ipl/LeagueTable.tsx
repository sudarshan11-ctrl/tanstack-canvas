import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { TriangleAlert, ArrowUp, ArrowDown, ArrowUpDown, Search } from "lucide-react";
import type { SquadStanding } from "@/utils/squad";
import { bandFor, BAND_COLOR, BAND_LABEL } from "@/utils/bsc";
import Sparkline from "@/components/ui/Sparkline";

export interface LeagueTableProps {
  standings: SquadStanding[];
}

export default function LeagueTable({ standings }: LeagueTableProps) {
  type SortKey = "captain" | "squadLpi" | "crr" | "rrr" | "proj" | "wickets" | "band";
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("squadLpi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? standings.filter((row) =>
        [row.squad.captain.name, row.squad.archetype, ...(row.squad.leadsIn ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : standings;
  const dir = sortDir === "asc" ? 1 : -1;
  const rows = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "captain": return a.squad.captain.name.localeCompare(b.squad.captain.name) * dir;
      case "crr": return (a.crrAvg - b.crrAvg) * dir;
      case "rrr": return (a.rrrAvg - b.rrrAvg) * dir;
      case "proj": return (a.projectionLpi - b.projectionLpi) * dir;
      case "wickets": return (a.wickets - b.wickets) * dir;
      case "band":
      case "squadLpi":
      default: return (a.squadLpi - b.squadLpi) * dir;
    }
  });
  const onSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "captain" ? "asc" : "desc"); }
  };
  const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k
    ? <ArrowUpDown size={10} className="inline text-slate-400" />
    : sortDir === "asc" ? <ArrowUp size={10} className="inline" /> : <ArrowDown size={10} className="inline" />;

  return (
    <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "#e2e8f0" }}>
      <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2" style={{ borderColor: "#e2e8f0" }}>
        <div className="text-[11px] text-slate-500">Showing {rows.length} of {standings.length} squads</div>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by captain, archetype..."
            className="w-64 rounded-md border border-slate-200 bg-white py-1 pl-7 pr-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-[40px_minmax(220px,1.4fr)_70px_70px_70px_70px_70px_120px_90px] items-center gap-3 border-b bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500" style={{ borderColor: "#e2e8f0" }}>
        <div>#</div>
        <button type="button" onClick={() => onSort("captain")} className="flex items-center gap-1 text-left hover:text-slate-700">Captain · Squad <SortIcon k="captain" /></button>
        <button type="button" onClick={() => onSort("squadLpi")} className="flex items-center justify-end gap-1 hover:text-slate-700">Squad PI <SortIcon k="squadLpi" /></button>
        <button type="button" onClick={() => onSort("crr")} className="flex items-center justify-end gap-1 hover:text-slate-700">CRR % <SortIcon k="crr" /></button>
        <button type="button" onClick={() => onSort("rrr")} className="flex items-center justify-end gap-1 hover:text-slate-700">RRR % <SortIcon k="rrr" /></button>
        <button type="button" onClick={() => onSort("proj")} className="flex items-center justify-end gap-1 hover:text-slate-700">Proj. <SortIcon k="proj" /></button>
        <button type="button" onClick={() => onSort("wickets")} className="flex items-center justify-end gap-1 hover:text-slate-700">Wickets <SortIcon k="wickets" /></button>
        <div>Form</div>
        <button type="button" onClick={() => onSort("band")} className="flex items-center justify-end gap-1 hover:text-slate-700">Band <SortIcon k="band" /></button>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-center text-[12px] text-slate-400">No squads match "{query}"</div>
      ) : null}
      {rows.map((row, idx) => {
        const band = bandFor(row.squadLpi);
        const trend = row.squad.members
          .filter((m) => m.score)
          .slice(0, 6)
          .map((m) => m.score!.lpi);
        return (
          <Link
            key={row.squad.captain.id}
            to="/squad/$epId"
            params={{ epId: row.squad.captain.id }}
            className="grid grid-cols-[40px_minmax(220px,1.4fr)_70px_70px_70px_70px_70px_120px_90px] items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-slate-50"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div className="font-mono text-[14px] font-semibold text-slate-400">
              {String(idx + 1).padStart(2, "0")}
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex items-center justify-center rounded-full text-blue-700"
                style={{ width: 36, height: 36, backgroundColor: "#dbeafe", fontSize: 12, fontWeight: 600 }}
              >
                {row.squad.captain.initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-slate-900">
                  {row.squad.captain.name}
                </div>
                <div className="truncate text-[11px] text-slate-500">
                  {row.squad.archetype} · leads in {row.squad.leadsIn.join(", ")}
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-[16px] font-semibold text-slate-900">
              {Math.round(row.squadLpi)}
            </div>
            <div className="text-right font-mono text-[12px] text-green-700">
              {Math.round(row.crrAvg)}
            </div>
            <div className="text-right font-mono text-[12px] text-amber-700">
              {Math.round(row.rrrAvg)}
            </div>
            <div className="text-right font-mono text-[12px] text-slate-700">
              {Math.round(row.projectionLpi)}
            </div>
            <div className="text-right">
              {row.wickets > 0 ? (
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 font-mono text-[11px] text-red-700">
                  <TriangleAlert size={11} />
                  {row.wickets}
                </span>
              ) : (
                <span className="font-mono text-[11px] text-slate-400">0</span>
              )}
            </div>
            <div>
              <Sparkline data={trend} color={BAND_COLOR[band]} height={24} />
            </div>
            <div className="text-right">
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: BAND_COLOR[band] }}
              >
                {BAND_LABEL[band]}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}