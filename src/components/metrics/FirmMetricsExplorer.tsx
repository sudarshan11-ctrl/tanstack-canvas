import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import Card from "@/components/ui/card";
import { RAG_FG } from "@/components/ui/rag-colors";
import { formatMetricValue } from "@/utils/format";
import {
  aggregateFirmMetrics,
  type FirmMetricAggregate,
  type AggregateLevel,
} from "@/utils/firmMetricAggregates";
import { isMetricActive, metricInactiveReason } from "@/utils/metricActivity";
import type { PersonScore, RAGStatus } from "@/types";

type StatusFilter = "all" | "red" | "amber" | "green";
type TypeFilter = "all" | "primary" | "secondary";
type SortKey = "lagging" | "delta" | "name";

export interface FirmMetricsExplorerProps {
  scores: PersonScore[];
  initialStatus?: StatusFilter;
}

const AREA_LABEL: Record<string, string> = {
  financial_health: "Financial Health",
  client_matter: "Client & Matter",
  growth_pipeline: "Growth & Pipeline",
  brand_development: "Brand & BD",
  people_org: "People & Org",
};

function RagBar({ row }: { row: FirmMetricAggregate }) {
  const total = Math.max(1, row.total);
  const r = (row.redCount / total) * 100;
  const a = (row.amberCount / total) * 100;
  const g = (row.greenCount / total) * 100;
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-sm"
      style={{ backgroundColor: "var(--surface-2)" }}
    >
      <div style={{ width: `${r}%`, backgroundColor: "var(--rag-red)" }} />
      <div style={{ width: `${a}%`, backgroundColor: "var(--rag-amber)" }} />
      <div style={{ width: `${g}%`, backgroundColor: "var(--rag-green)" }} />
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
  isFirst,
  isLast,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 text-[11px] font-medium transition-colors"
      style={{
        backgroundColor: active ? "var(--lks-accent)" : "transparent",
        color: active ? "#ffffff" : "var(--text-2)",
        borderRadius: isFirst
          ? "var(--radius) 0 0 var(--radius)"
          : isLast
            ? "0 var(--radius) var(--radius) 0"
            : undefined,
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}

export default function FirmMetricsExplorer({
  scores,
  initialStatus = "all",
}: FirmMetricsExplorerProps) {
  const [level, setLevel] = useState<AggregateLevel>("firm");
  const rows = useMemo(() => aggregateFirmMetrics(scores, level), [scores, level]);

  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [type, setType] = useState<TypeFilter>("all");
  const [area, setArea] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("lagging");
  const [hideInactive, setHideInactive] = useState(false);

  const areas = useMemo(() => Array.from(new Set(rows.map((r) => r.area))), [rows]);

  const filtered = useMemo(() => {
    const lc = q.trim().toLowerCase();
    const f = rows.filter((r) => {
      if (hideInactive && !isMetricActive(r.id)) return false;
      if (status !== "all" && r.dominantRag !== status) return false;
      if (type === "primary" && !r.isPrimaryAnywhere) return false;
      if (type === "secondary" && r.isPrimaryAnywhere) return false;
      if (area !== "all" && r.area !== area) return false;
      if (lc && !r.id.toLowerCase().includes(lc) && !r.name.toLowerCase().includes(lc))
        return false;
      return true;
    });
    f.sort((a, b) => {
      const aActive = isMetricActive(a.id);
      const bActive = isMetricActive(b.id);
      if (aActive !== bActive) return aActive ? -1 : 1;
      if (sort === "lagging")
        return b.redCount - a.redCount || b.amberCount - a.amberCount;
      if (sort === "delta") return (a.deltaPct ?? 0) - (b.deltaPct ?? 0);
      return a.name.localeCompare(b.name);
    });
    return f;
  }, [rows, status, type, area, q, sort, hideInactive]);

  const totals = useMemo(() => {
    const lagging = rows.filter((r) => r.dominantRag === "red").length;
    const watch = rows.filter((r) => r.dominantRag === "amber").length;
    const strong = rows.filter((r) => r.dominantRag === "green").length;
    return { lagging, watch, strong };
  }, [rows]);

  const LEVEL_OPTS: { id: AggregateLevel; label: string }[] = [
    { id: "firm", label: "Firm" },
    { id: "practice_head", label: "Practice Heads" },
    { id: "partner", label: "Partners" },
    { id: "associate", label: "Associates" },
  ];

  const STATUS_OPTS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All status" },
    { id: "red", label: "Lagging" },
    { id: "amber", label: "Watch" },
    { id: "green", label: "On-track" },
  ];

  const TYPE_OPTS: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "All types" },
    { id: "primary", label: "Primary" },
    { id: "secondary", label: "Secondary" },
  ];

  return (
    <Card padding="md">
      {/* Summary pills */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(
          [
            { rag: "red" as RAGStatus, count: totals.lagging, label: "lagging" },
            { rag: "amber" as RAGStatus, count: totals.watch, label: "on watch" },
            { rag: "green" as RAGStatus, count: totals.strong, label: "on-track" },
          ] as const
        ).map(({ rag, count, label }) => (
          <button
            key={rag}
            type="button"
            onClick={() => setStatus(rag as StatusFilter)}
            className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
            style={{
              color: RAG_FG[rag],
              borderColor: `color-mix(in srgb, ${RAG_FG[rag]} 30%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${RAG_FG[rag]} 8%, transparent)`,
            }}
          >
            {count} {label} firm-wide
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Level */}
        <div
          className="flex overflow-hidden rounded-md border"
          style={{ borderColor: "var(--line)" }}
        >
          {LEVEL_OPTS.map((opt, i) => (
            <SegmentButton
              key={opt.id}
              active={level === opt.id}
              onClick={() => setLevel(opt.id)}
              isFirst={i === 0}
              isLast={i === LEVEL_OPTS.length - 1}
            >
              {opt.label}
            </SegmentButton>
          ))}
        </div>

        {/* Status */}
        <div
          className="flex overflow-hidden rounded-md border"
          style={{ borderColor: "var(--line)" }}
        >
          {STATUS_OPTS.map((opt, i) => (
            <SegmentButton
              key={opt.id}
              active={status === opt.id}
              onClick={() => setStatus(opt.id)}
              isFirst={i === 0}
              isLast={i === STATUS_OPTS.length - 1}
            >
              {opt.label}
            </SegmentButton>
          ))}
        </div>

        {/* Type */}
        <div
          className="flex overflow-hidden rounded-md border"
          style={{ borderColor: "var(--line)" }}
        >
          {TYPE_OPTS.map((opt, i) => (
            <SegmentButton
              key={opt.id}
              active={type === opt.id}
              onClick={() => setType(opt.id)}
              isFirst={i === 0}
              isLast={i === TYPE_OPTS.length - 1}
            >
              {opt.label}
            </SegmentButton>
          ))}
        </div>

        {/* Area */}
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded-md border px-2 py-1 text-[11px]"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--line)",
            color: "var(--text-1)",
          }}
        >
          <option value="all">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {AREA_LABEL[a] ?? a}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border px-2 py-1 text-[11px]"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--line)",
            color: "var(--text-1)",
          }}
        >
          <option value="lagging">Sort: most lagging</option>
          <option value="delta">Sort: worst Δ vs target</option>
          <option value="name">Sort: name</option>
        </select>

        {/* Hide inactive */}
        <label
          className="flex cursor-pointer items-center gap-1.5 text-[11px]"
          style={{ color: "var(--text-2)" }}
        >
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer"
            style={{ accentColor: "var(--lks-accent)" }}
          />
          Hide metrics without data
        </label>

        {/* Search */}
        <div
          className="ml-auto flex items-center gap-1 rounded-md border px-2 py-1"
          style={{ borderColor: "var(--line)" }}
        >
          <Search size={12} style={{ color: "var(--text-2)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search metric…"
            className="w-40 bg-transparent text-[12px] outline-none"
            style={{ color: "var(--text-1)" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-[12px]">
          <thead>
            <tr
              className="border-b text-left text-[10px] font-semibold uppercase tracking-wider"
              style={{ borderColor: "var(--line)", color: "var(--text-2)" }}
            >
              <th className="px-2 py-2">Metric</th>
              <th className="px-2 py-2">Area</th>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2 text-right">Firm avg</th>
              <th className="px-2 py-2 text-right">Target</th>
              <th className="px-2 py-2 text-right">Δ vs target</th>
              <th className="w-40 px-2 py-2">RAG spread</th>
              <th className="px-2 py-2 text-right">Lagging</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-2 py-6 text-center italic"
                  style={{ color: "var(--text-2)" }}
                >
                  No metrics match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const deltaColor =
                  r.deltaPct === null
                    ? "var(--text-2)"
                    : r.deltaPct >= 0
                      ? "var(--rag-green)"
                      : r.deltaPct <= -10
                        ? "var(--rag-red)"
                        : "var(--rag-amber)";
                const active = isMetricActive(r.id);
                const reason = metricInactiveReason(r.id);
                const awaitingTarget = reason === "awaiting-target";
                return (
                  <tr
                    key={r.id}
                    className="border-b transition-colors"
                    style={{
                      borderColor: "var(--line)",
                      opacity: active ? 1 : awaitingTarget ? 0.85 : 0.55,
                      borderLeft: awaitingTarget
                        ? "3px dashed var(--rag-amber)"
                        : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (active)
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "transparent";
                    }}
                    title={
                      active
                        ? undefined
                        : awaitingTarget
                          ? "Metric will be calculated once the target is entered."
                          : "Data not yet available for this metric."
                    }
                  >
                    <td className="px-2 py-2.5">
                      <div className="flex min-w-[13.75rem] flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-metric-id shrink-0 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--lks-accent)" }}
                          >
                            {r.id}
                          </span>
                          {!active && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                              style={
                                awaitingTarget
                                  ? {
                                      backgroundColor:
                                        "color-mix(in srgb, var(--rag-amber) 18%, transparent)",
                                      color: "var(--rag-amber)",
                                      border:
                                        "1px solid color-mix(in srgb, var(--rag-amber) 40%, transparent)",
                                    }
                                  : {
                                      backgroundColor: "var(--surface-2)",
                                      color: "var(--text-2)",
                                    }
                              }
                            >
                              {awaitingTarget ? "Awaiting target" : "No data · Request upload"}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[13px] font-semibold leading-snug"
                          style={{ color: "var(--text-1)" }}
                        >
                          {r.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-2 py-2" style={{ color: "var(--text-2)" }}>
                      {AREA_LABEL[r.area] ?? r.area}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={
                          r.isPrimaryAnywhere
                            ? {
                                color: "var(--lks-accent)",
                                backgroundColor:
                                  "color-mix(in srgb, var(--lks-accent) 10%, transparent)",
                              }
                            : {
                                color: "var(--text-2)",
                                backgroundColor: "var(--surface-2)",
                              }
                        }
                      >
                        {r.isPrimaryAnywhere ? "Primary" : "Secondary"}
                      </span>
                    </td>
                    <td
                      className="tabular px-2 py-2 text-right font-mono"
                      style={{ color: "var(--text-1)" }}
                    >
                      {r.avg !== null ? formatMetricValue(r.avg, r.unit) : "—"}
                    </td>
                    <td
                      className="tabular px-2 py-2 text-right font-mono"
                      style={{ color: "var(--text-2)" }}
                    >
                      {r.target !== null ? formatMetricValue(r.target, r.unit) : "—"}
                    </td>
                    <td
                      className="tabular px-2 py-2 text-right font-mono font-semibold"
                      style={{ color: deltaColor }}
                    >
                      {r.deltaPct === null
                        ? "—"
                        : `${r.deltaPct >= 0 ? "+" : ""}${r.deltaPct.toFixed(0)}%`}
                    </td>
                    <td className="px-2 py-2">
                      <RagBar row={r} />
                      <div
                        className="mt-0.5 flex justify-between text-[9px]"
                        style={{ color: "var(--text-2)" }}
                      >
                        <span>{r.redCount}R</span>
                        <span>{r.amberCount}A</span>
                        <span>{r.greenCount}G</span>
                      </div>
                    </td>
                    <td
                      className="tabular px-2 py-2 text-right font-mono font-semibold"
                      style={{
                        color: r.redCount > 0 ? "var(--rag-red)" : "var(--text-2)",
                      }}
                    >
                      {r.redCount}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {active ? (
                        <Link
                          to="/metric/$id"
                          params={{ id: r.id }}
                          className="rounded-md border px-2 py-1 text-[11px] font-medium transition-all"
                          style={{
                            borderColor: "var(--lks-accent)",
                            color: "var(--lks-accent)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                              "var(--lks-accent)";
                            (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                              "transparent";
                            (e.currentTarget as HTMLAnchorElement).style.color =
                              "var(--lks-accent)";
                          }}
                        >
                          Drill in →
                        </Link>
                      ) : (
                        <span
                          className="text-[10px] italic"
                          style={{ color: "var(--text-2)" }}
                        >
                          No data
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
