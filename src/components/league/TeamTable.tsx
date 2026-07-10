import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  TriangleAlert,
  TrendingDown,
  TrendingUp,
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

export interface TeamTableProps {
  members: Person[];
  scores: PersonScore[];
  buildLink: (member: Person) => { to: string; params: Record<string, string> };
  memberLabel: "Partner" | "Associate";
}

export default function TeamTable({
  members,
  scores,
  buildLink,
  memberLabel,
}: TeamTableProps) {
  type SortKey = "name" | "teamLpi" | "wickets" | "band";
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("teamLpi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const allRows = members.map((m) => ({ m, r: rollupFor(m.id, scores) }));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? allRows.filter(({ m }) =>
        [m.name, m.subPractice ?? "", m.office ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : allRows;

  const dir = sortDir === "asc" ? 1 : -1;
  const rows = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "name":
        return a.m.name.localeCompare(b.m.name) * dir;
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

  const cols =
    "grid grid-cols-[36px_minmax(180px,1.2fr)_70px_minmax(160px,1fr)_minmax(160px,1fr)_60px_70px_70px_28px]";

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
        className="flex items-center justify-between gap-3 border-b px-3 py-2"
        style={{ borderColor: "var(--line)", backgroundColor: "var(--surface)" }}
      >
        <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
          Showing {rows.length} of {allRows.length} {memberLabel.toLowerCase()}s
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
            placeholder={`Search ${memberLabel.toLowerCase()}s...`}
            className="w-56 rounded-md border py-1 pl-7 pr-2 text-[12px] focus:outline-none"
            style={{
              backgroundColor: "var(--surface-2)",
              borderColor: "var(--line)",
              color: "var(--text-1)",
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div
        className={`${cols} items-center gap-3 border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wider`}
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
          {memberLabel} <SortIcon k="name" />
        </button>
        <button
          type="button"
          onClick={() => onSort("teamLpi")}
          className="flex items-center justify-end gap-1 transition-opacity hover:opacity-80"
        >
          PI <SortIcon k="teamLpi" />
        </button>
        <div>Best primaries</div>
        <div>Lagging primaries</div>
        <button
          type="button"
          onClick={() => onSort("wickets")}
          className="flex items-center justify-end gap-1 transition-opacity hover:opacity-80"
        >
          Wkts <SortIcon k="wickets" />
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

      {/* Empty */}
      {rows.length === 0 && (
        <div
          className="px-3 py-6 text-center text-[12px]"
          style={{ color: "var(--text-2)" }}
        >
          No {memberLabel.toLowerCase()}s match "{query}"
        </div>
      )}

      {/* Rows */}
      {rows.map((row, idx) => {
        const band = bandFor(row.r.teamLpi);
        const link = buildLink(row.m);
        return (
          <Link
            key={row.m.id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={link.to as any}
            params={link.params as never}
            className={`${cols} items-center gap-3 border-b px-3 py-2.5 transition-all`}
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
            <div
              className="font-metric-id text-[12px] font-semibold tabular"
              style={{ color: "var(--text-2)" }}
            >
              {String(idx + 1).padStart(2, "0")}
            </div>

            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: "color-mix(in srgb, var(--lks-accent) 12%, transparent)",
                  color: "var(--lks-accent)",
                }}
              >
                {row.m.initials}
              </div>
              <div className="min-w-0">
                <div
                  className="truncate text-[12px] font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  {row.m.name}
                </div>
                <div
                  className="truncate text-[10px]"
                  style={{ color: "var(--text-2)" }}
                >
                  {row.m.subPractice} · {row.m.office}
                </div>
              </div>
            </div>

            <div
              className="tabular text-right font-mono text-[14px] font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              {Math.round(row.r.teamLpi)}
            </div>

            <div className="flex flex-col gap-0.5">
              {row.r.topMetrics.map((m) => (
                <div
                  key={m.metricId}
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: "var(--rag-green)" }}
                >
                  <TrendingUp size={9} />
                  <span className="font-metric-id opacity-70">{m.metricId}</span>
                  <span className="truncate">{m.name}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-0.5">
              {row.r.bottomMetrics.map((m) => (
                <div
                  key={m.metricId}
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: "var(--rag-red)" }}
                >
                  <TrendingDown size={9} />
                  <span className="font-metric-id opacity-70">{m.metricId}</span>
                  <span className="truncate">{m.name}</span>
                </div>
              ))}
            </div>

            <div className="text-right">
              {row.r.wickets > 0 ? (
                <span
                  className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-mono text-[10px] font-semibold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--rag-red) 12%, transparent)",
                    color: "var(--rag-red)",
                  }}
                >
                  <TriangleAlert size={9} />
                  {row.r.wickets}
                </span>
              ) : (
                <span
                  className="font-mono text-[10px]"
                  style={{ color: "var(--text-2)" }}
                >
                  0
                </span>
              )}
            </div>

            <div>
              <Sparkline
                data={row.r.trend.length ? row.r.trend : [row.r.teamLpi]}
                color={BAND_COLOR[band]}
                height={20}
              />
            </div>

            <div className="text-right">
              <span
                className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: BAND_COLOR[band] }}
              >
                {BAND_LABEL[band]}
              </span>
            </div>

            <div className="flex justify-center">
              <ChevronRight size={12} style={{ color: "var(--text-2)" }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
