import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  ChevronRight,
} from "lucide-react";
import Sparkline from "@/components/ui/Sparkline";
import { bandFor, BAND_COLOR, BAND_LABEL } from "@/utils/bsc";
import { rollupFor } from "@/utils/rollup";
import type { Person, PersonScore } from "@/types";

export interface PracticeHeadLeagueTableProps {
  eps: Person[];
  scores: PersonScore[];
}

export default function PracticeHeadLeagueTable({
  eps,
  scores,
}: PracticeHeadLeagueTableProps) {
  type SortKey = "name" | "teamLpi" | "personLpi" | "wickets" | "band";
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("teamLpi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const allRows = eps.map((ep) => {
    const r = rollupFor(ep.id, scores);
    const teamSize = r.memberCount;
    return { ep, r, teamSize };
  });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allRows.filter(({ ep }) =>
        [ep.name, ep.subPractice ?? "", ep.office ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : allRows;

  const dir = sortDir === "asc" ? 1 : -1;
  const rows = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "name":
        return a.ep.name.localeCompare(b.ep.name) * dir;
      case "personLpi":
        return (a.r.personLpi - b.r.personLpi) * dir;
      case "wickets":
        return (a.r.wickets - b.r.wickets) * dir;
      case "band":
      case "teamLpi":
      default:
        return (a.r.teamLpi - b.r.teamLpi) * dir;
    }
  });

  const onSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <ArrowUpDown size={10} className="inline" style={{ color: "var(--text-2)" }} />
    ) : sortDir === "asc" ? (
      <ArrowUp size={10} className="inline" style={{ color: "var(--lks-accent)" }} />
    ) : (
      <ArrowDown size={10} className="inline" style={{ color: "var(--lks-accent)" }} />
    );

  const colGrid =
    "grid grid-cols-[40px_minmax(200px,1.3fr)_80px_80px_minmax(160px,1fr)_minmax(160px,1fr)_70px_90px_90px_32px]";

  return (
    <div
      className="overflow-hidden rounded-[var(--radius)] border"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--line)",
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-3 border-b px-4 py-2"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--line)",
        }}
      >
        <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
          Showing {rows.length} of {allRows.length} practice heads
        </div>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-2)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, practice, office..."
            className="w-64 rounded-md border py-1 pl-7 pr-2 text-[12px] focus:outline-none"
            style={{
              backgroundColor: "var(--surface-2)",
              borderColor: "var(--line)",
              color: "var(--text-1)",
            }}
          />
        </div>
      </div>

      {/* Header row */}
      <div
        className={`${colGrid} items-center gap-3 border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider`}
        style={{
          backgroundColor: "var(--surface-2)",
          borderColor: "var(--line)",
          color: "var(--text-2)",
        }}
      >
        <div>#</div>
        <button
          type="button"
          onClick={() => onSort("name")}
          className="flex items-center gap-1 text-left transition-opacity hover:opacity-80"
        >
          Practice Head <SortIcon k="name" />
        </button>
        <button
          type="button"
          onClick={() => onSort("teamLpi")}
          className="flex items-center justify-end gap-1 transition-opacity hover:opacity-80"
        >
          Team PI <SortIcon k="teamLpi" />
        </button>
        <button
          type="button"
          onClick={() => onSort("personLpi")}
          className="flex items-center justify-end gap-1 transition-opacity hover:opacity-80"
        >
          Self PI <SortIcon k="personLpi" />
        </button>
        <div>Best primaries</div>
        <div>Lagging primaries</div>
        <button
          type="button"
          onClick={() => onSort("wickets")}
          className="flex items-center justify-end gap-1 transition-opacity hover:opacity-80"
        >
          Wickets <SortIcon k="wickets" />
        </button>
        <div>Form</div>
        <button
          type="button"
          onClick={() => onSort("band")}
          className="flex items-center justify-end gap-1 transition-opacity hover:opacity-80"
        >
          Band <SortIcon k="band" />
        </button>
        <div />
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div
          className="px-4 py-6 text-center text-[12px]"
          style={{ color: "var(--text-2)" }}
        >
          No practice heads match "{query}"
        </div>
      )}

      {/* Data rows */}
      {rows.map((row, idx) => {
        const band = bandFor(row.r.teamLpi);
        return (
          <Link
            key={row.ep.id}
            to="/ep/$epId"
            params={{ epId: row.ep.id }}
            className={`${colGrid} group items-center gap-3 border-b px-4 py-3 transition-all`}
            style={{
              borderColor: "var(--line)",
              backgroundColor: "var(--surface)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "var(--surface-2)";
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "var(--surface)";
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(0)";
            }}
          >
            {/* Rank */}
            <div
              className="font-metric-id text-[13px] font-semibold tabular"
              style={{ color: "var(--text-2)" }}
            >
              {String(idx + 1).padStart(2, "0")}
            </div>

            {/* Identity */}
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "color-mix(in srgb, var(--lks-accent) 15%, transparent)",
                  color: "var(--lks-accent)",
                }}
              >
                {row.ep.initials}
              </div>
              <div className="min-w-0">
                <div
                  className="truncate text-[13px] font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  {row.ep.name}
                </div>
                <div
                  className="truncate text-[11px]"
                  style={{ color: "var(--text-2)" }}
                >
                  {row.ep.subPractice} · {row.teamSize} on roster
                </div>
              </div>
            </div>

            {/* Team LPI */}
            <div
              className="tabular text-right font-mono text-[16px] font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              {Math.round(row.r.teamLpi)}
            </div>

            {/* Self LPI */}
            <div
              className="tabular text-right font-mono text-[12px]"
              style={{ color: "var(--text-2)" }}
            >
              {Math.round(row.r.personLpi)}
            </div>

            {/* Best primaries */}
            <div className="flex flex-col gap-0.5">
              {row.r.topMetrics.map((m) => (
                <div
                  key={m.metricId}
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--rag-green)" }}
                >
                  <TrendingUp size={10} />
                  <span className="font-metric-id opacity-70">{m.metricId}</span>
                  <span className="truncate">{m.name}</span>
                </div>
              ))}
            </div>

            {/* Lagging primaries */}
            <div className="flex flex-col gap-0.5">
              {row.r.bottomMetrics.map((m) => (
                <div
                  key={m.metricId}
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--rag-red)" }}
                >
                  <TrendingDown size={10} />
                  <span className="font-metric-id opacity-70">{m.metricId}</span>
                  <span className="truncate">{m.name}</span>
                </div>
              ))}
            </div>

            {/* Wickets */}
            <div className="text-right">
              {row.r.wickets > 0 ? (
                <span
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--rag-red) 12%, transparent)",
                    color: "var(--rag-red)",
                  }}
                >
                  <TriangleAlert size={11} />
                  {row.r.wickets}
                </span>
              ) : (
                <span
                  className="font-mono text-[11px]"
                  style={{ color: "var(--text-2)" }}
                >
                  0
                </span>
              )}
            </div>

            {/* Sparkline */}
            <div>
              <Sparkline
                data={row.r.trend.length ? row.r.trend : [row.r.teamLpi]}
                color={BAND_COLOR[band]}
                height={24}
              />
            </div>

            {/* Band chip */}
            <div className="text-right">
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: BAND_COLOR[band] }}
              >
                {BAND_LABEL[band]}
              </span>
            </div>

            {/* Chevron (appears on hover via group) */}
            <div className="flex justify-center">
              <ChevronRight size={14} style={{ color: "var(--text-2)" }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
