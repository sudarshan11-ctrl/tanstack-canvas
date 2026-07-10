import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/Card";
import LPIDial from "@/components/ui/LPIDial";
import DeltaBadge from "@/components/ui/DeltaBadge";
import { RAG_FG, RAG_BG } from "@/components/ui/rag-colors";
import { useDashboardStore } from "@/store/dashboardStore";
import { mockPeople } from "@/data/mockPeople";
import { lpiToRAG } from "@/utils/rag";
import { formatMetricValue, formatPeriod } from "@/utils/format";
import { snapshotInfo } from "@/data/snapshotMetricValues";
import { useRagColors, useThemeTokens } from "@/hooks/useThemeTokens";
import type { MetricArea, Person, PracticePillar, Role } from "@/types";

const ROLE_LABEL: Record<Role | "all", string> = {
  all: "All Roles",
  practice_head: "Practice Head",
  partner: "Partner",
  associate: "Associate",
};

const ROLE_TABS: (Role | "all")[] = ["all", "practice_head", "partner", "associate"];

const PILLAR_OPTIONS: (PracticePillar | "all")[] = [
  "all",
  "Corporate Law",
  "Direct Tax",
  "Disputes & Investigations",
  "Indirect Tax & GST",
  "Intellectual Property",
  "International Trade & Customs",
];

const PILLAR_LABEL: Record<string, string> = {
  all: "All Pillars",
  "Corporate Law": "Corporate Law",
  "Direct Tax": "Direct Tax",
  "Disputes & Investigations": "Disputes",
  "Indirect Tax & GST": "Indirect Tax",
  "Intellectual Property": "IP",
  "International Trade & Customs": "International Trade",
};

const AREAS: MetricArea[] = [
  "financial_health",
  "client_matter",
  "people_ops",
  "growth_pipeline",
  "brand_discoverability",
];

const AREA_SHORT: Record<MetricArea, string> = {
  financial_health: "Fin. Health",
  client_matter: "Client",
  people_ops: "People",
  growth_pipeline: "Growth",
  brand_discoverability: "Brand",
};

type SortKey = "lpi" | "revenue" | "realization" | "utilization" | "origination";

const SORT_LABEL: Record<SortKey, string> = {
  lpi: "Performance Index Score",
  revenue: "Revenue",
  realization: "Realization",
  utilization: "Utilization",
  origination: "Origination",
};

const SORT_METRIC: Record<Exclude<SortKey, "lpi">, string> = {
  revenue: "FH-01",
  realization: "FH-08",
  utilization: "FH-09",
  origination: "GP-06",
};

function parseRoleParam(raw: string | undefined): Role | "all" {
  if (raw === "practice_head" || raw === "partner" || raw === "associate") return raw;
  return "all";
}

const selectClass =
  "rounded-md border px-2 py-1 text-[12px] transition-colors";

const selectStyle = {
  backgroundColor: "var(--surface)",
  borderColor: "var(--line)",
  color: "var(--text-1)",
} as const;

export default function CohortView() {
  const { role: roleParam } = useParams({ from: "/_authenticated/cohort/$role" });
  const navigate = useNavigate();
  const routeRole = parseRoleParam(roleParam);
  const ragColors = useRagColors();
  const { getToken } = useThemeTokens();
  const chartMuted = getToken("--text-2") || "#6e7276";

  const personScores = useDashboardStore((s) => s.personScores);
  const selectedRole = useDashboardStore((s) => s.selectedRole);
  const selectedPillar = useDashboardStore((s) => s.selectedPillar);
  const setRoleFilter = useDashboardStore((s) => s.setRoleFilter);
  const setPillarFilter = useDashboardStore((s) => s.setPillarFilter);

  useEffect(() => {
    if (selectedRole !== routeRole) setRoleFilter(routeRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeRole]);

  const [sortBy, setSortBy] = useState<SortKey>("lpi");

  const peopleById = useMemo(() => {
    const m = new Map<string, Person>();
    for (const p of mockPeople) m.set(p.id, p);
    return m;
  }, []);

  const filtered = useMemo(() => {
    return personScores
      .map((s) => ({ score: s, person: peopleById.get(s.personId)! }))
      .filter(({ person }) => {
        if (selectedRole !== "all" && person.role !== selectedRole) return false;
        if (selectedPillar !== "all" && person.pillar !== selectedPillar) return false;
        return true;
      });
  }, [personScores, peopleById, selectedRole, selectedPillar]);

  const sorted = useMemo(() => {
    const getVal = ({ score }: (typeof filtered)[number]) => {
      if (sortBy === "lpi") return score.lpi;
      const id = SORT_METRIC[sortBy];
      const v = score.metricValues.find((m) => m.metricId === id);
      return typeof v?.value === "number" ? v.value : -Infinity;
    };
    return [...filtered].sort((a, b) => getVal(b) - getVal(a));
  }, [filtered, sortBy]);

  const avgLpi = filtered.length
    ? filtered.reduce((s, r) => s + r.score.lpi, 0) / filtered.length
    : 0;

  const areaAverages = useMemo(() => {
    const cur: Record<MetricArea, number> = {} as Record<MetricArea, number>;
    const prior: Record<MetricArea, number> = {} as Record<MetricArea, number>;
    for (const a of AREAS) {
      cur[a] = filtered.length
        ? filtered.reduce((s, r) => s + r.score.areaScores[a], 0) / filtered.length
        : 0;
      prior[a] = filtered.length
        ? filtered.reduce((s, r) => s + r.score.areaScoresPriorYear[a], 0) /
          filtered.length
        : 0;
    }
    return { cur, prior };
  }, [filtered]);

  const distribution = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      bucket: i,
      label: i === 9 ? "90–100" : `${i * 10}–${i * 10 + 9}`,
      count: 0,
    }));
    for (const { score } of filtered) {
      const idx = Math.min(9, Math.max(0, Math.floor(score.lpi / 10)));
      buckets[idx].count += 1;
    }
    return buckets;
  }, [filtered]);

  const onPickRole = (r: Role | "all") => {
    setRoleFilter(r);
    navigate({ to: "/cohort/$role", params: { role: r } });
  };

  return (
    <PageWrapper title="">
      <div className="mx-auto max-w-[1320px] space-y-5">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="font-display text-[26px] leading-tight"
              style={{ color: "var(--text-1)" }}
            >
              {ROLE_LABEL[routeRole]} Cohort
            </h2>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-2)" }}>
              {filtered.length} people · Period: {formatPeriod(snapshotInfo.period)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                Avg Performance Index
              </div>
              <div
                className="tabular font-mono text-lg font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                {Math.round(avgLpi)}
              </div>
            </div>
            <LPIDial score={avgLpi} status={lpiToRAG(avgLpi)} size="sm" />
          </div>
        </div>

        {/* Filter bar */}
        <Card padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1">
              {ROLE_TABS.map((r) => {
                const active = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onPickRole(r)}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
                    style={{
                      backgroundColor: active ? "var(--primary)" : "var(--surface-2)",
                      color: active ? "var(--primary-foreground)" : "var(--text-1)",
                    }}
                  >
                    {r === "all" ? "All" : ROLE_LABEL[r]}
                  </button>
                );
              })}
            </div>

            <div className="hidden h-6 w-px sm:block" style={{ backgroundColor: "var(--line)" }} />

            <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
              Pillar:
              <select
                value={selectedPillar}
                onChange={(e) =>
                  setPillarFilter(e.target.value as PracticePillar | "all")
                }
                className={selectClass}
                style={selectStyle}
              >
                {PILLAR_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PILLAR_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
              Sort by:
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className={selectClass}
                style={selectStyle}
              >
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        {/* Area averages */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {AREAS.map((a) => {
            const cur = areaAverages.cur[a];
            const pr = areaAverages.prior[a];
            const delta = pr === 0 ? null : ((cur - pr) / pr) * 100;
            const color = RAG_FG[lpiToRAG(cur)];
            return (
              <Card key={a} padding="sm">
                <div
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-2)" }}
                >
                  {AREA_SHORT[a]}
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span
                    className="tabular font-mono text-[22px] font-semibold leading-none"
                    style={{ color }}
                  >
                    {Math.round(cur)}
                  </span>
                  <DeltaBadge delta={delta} unit="%" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Leaderboard */}
        <Card padding="sm">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div
                className="flex items-center gap-2 border-b py-2 text-[12px] font-medium uppercase tracking-wider"
                style={{ borderColor: "var(--line)", color: "var(--text-2)" }}
              >
                <div className="w-8 shrink-0 px-2">#</div>
                <div className="w-48 shrink-0">Name</div>
                <div className="w-20 shrink-0">LPI</div>
                {AREAS.map((a) => (
                  <div key={a} className="w-12 shrink-0 text-center">
                    {AREA_SHORT[a]}
                  </div>
                ))}
                <div className="min-w-[220px] flex-1">3 Key Metrics</div>
                <div className="w-6 shrink-0" />
              </div>

              {sorted.map(({ score, person }, idx) => {
                const keys = ["FH-01", "FH-09", "FH-08"];
                return (
                  <Link
                    key={person.id}
                    to="/profile/$id"
                    params={{ id: person.id }}
                    className="flex items-center gap-2 border-b py-3 transition-colors"
                    style={{ borderColor: "var(--line)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "var(--surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    <div
                      className="w-8 shrink-0 px-2 font-mono text-[12px]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex w-48 shrink-0 items-center gap-2">
                      <div
                        className="flex shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor:
                            "color-mix(in srgb, var(--lks-accent) 15%, transparent)",
                          color: "var(--lks-accent)",
                        }}
                      >
                        {person.initials}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="truncate text-[13px] font-medium"
                          style={{ color: "var(--text-1)" }}
                        >
                          {person.name}
                        </div>
                        <div
                          className="truncate text-[11px]"
                          style={{ color: "var(--text-2)" }}
                        >
                          {person.subPractice} · {person.office}
                        </div>
                      </div>
                    </div>
                    <div className="flex w-20 shrink-0 items-center gap-1">
                      <LPIDial score={score.lpi} status={score.rag} size="sm" />
                    </div>
                    {AREAS.map((a) => {
                      const s = Math.round(score.areaScores[a]);
                      const rag = lpiToRAG(s);
                      return (
                        <div key={a} className="w-12 shrink-0 text-center">
                          <span
                            className="inline-block rounded px-1.5 py-0.5 font-mono text-[12px] font-medium"
                            style={{
                              color: RAG_FG[rag],
                              backgroundColor: RAG_BG[rag],
                            }}
                          >
                            {s}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex min-w-[220px] flex-1 items-center gap-2">
                      {keys.map((mid) => {
                        const v = score.metricValues.find((m) => m.metricId === mid);
                        if (!v) return null;
                        const color = RAG_FG[v.rag];
                        return (
                          <div
                            key={mid}
                            className="rounded border px-2 py-1 font-mono text-[12px]"
                            style={{
                              width: 72,
                              backgroundColor: "var(--surface)",
                              borderColor: "var(--line)",
                              borderTop: `2px solid ${color}`,
                              color,
                            }}
                          >
                            {v.value === null ? "—" : formatMetricValue(v.value, v.unit)}
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-6 shrink-0" style={{ color: "var(--text-2)" }}>
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                );
              })}

              {sorted.length === 0 && (
                <div
                  className="py-10 text-center text-[13px]"
                  style={{ color: "var(--text-2)" }}
                >
                  No people match the selected filters.
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Distribution chart */}
        <Card padding="md">
          <div
            className="mb-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-2)" }}
          >
            Performance Index distribution
          </div>
          <div style={{ width: "100%", height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribution}
                margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: chartMuted }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <ReferenceLine
                  x={
                    distribution[
                      Math.min(9, Math.max(0, Math.floor(avgLpi / 10)))
                    ]?.label
                  }
                  stroke={chartMuted}
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg ${Math.round(avgLpi)}`,
                    position: "top",
                    fill: chartMuted,
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {distribution.map((d) => {
                    const mid = d.bucket * 10 + 5;
                    const fill =
                      mid < 50 ? ragColors.red : mid < 75 ? ragColors.amber : ragColors.green;
                    return <Cell key={d.bucket} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
