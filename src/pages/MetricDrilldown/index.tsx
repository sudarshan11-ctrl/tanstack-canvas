import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/SectionLabel";
import CausalSubgraph from "@/components/metrics/CausalSubgraph";
import SecondaryDriverList from "@/components/metrics/SecondaryDriverList";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { useDashboardStore } from "@/store/dashboardStore";
import { buildStandings } from "@/utils/squad";
import { subgraphFor } from "@/utils/causalGraph";
import { formatMetricValue } from "@/utils/format";
import { RAG_FG } from "@/components/ui/rag-colors";
import ScorecardStar from "@/components/ui/ScorecardStar";
import { Route as MetricRoute } from "@/routes/_authenticated/metric.$id";
import { personById } from "@/utils/hierarchy";
import { driversFor, firmLaggingDriversFor } from "@/utils/secondaryDrivers";
import { useThemeTokens } from "@/hooks/useThemeTokens";
import { mockPeople } from "@/data/mockPeople";

type DrillTab = "overview" | "drivers" | "by-squad" | "leaders" | "causality";

const TABS: { id: DrillTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "drivers", label: "Drivers" },
  { id: "by-squad", label: "By squad" },
  { id: "leaders", label: "Leaders / Laggards" },
  { id: "causality", label: "Causality" },
];

export default function MetricDrilldown() {
  const { id } = useParams({ from: "/_authenticated/metric/$id" });
  const { from } = MetricRoute.useSearch();
  const personScores = useDashboardStore((s) => s.personScores);
  const def = mockMetricDefinitions.find((m) => m.id === id);
  const [tab, setTab] = useState<DrillTab>("overview");
  const { getToken } = useThemeTokens();

  if (!def) {
    return (
      <PageWrapper>
        <Link to="/" className="text-sm" style={{ color: "var(--lks-accent)" }}>
          ← Back to firm
        </Link>
        <div className="mt-4" style={{ color: "var(--text-2)" }}>
          Metric not found.
        </div>
      </PageWrapper>
    );
  }

  const isPrimaryAnywhere =
    def.category.practice_head === "primary" ||
    def.category.partner === "primary" ||
    def.category.associate === "primary";

  const standings = buildStandings(personScores);
  const sub = subgraphFor(def.id);

  const contextPerson = from ? personById(from) : undefined;
  const isPrimaryForContext =
    contextPerson ? def.category[contextPerson.role] === "primary" : false;
  const contextDrivers =
    contextPerson && isPrimaryForContext
      ? driversFor(contextPerson.id, def.id, personScores)
      : [];
  const ctxLagging = contextDrivers.filter((d) => d.rag === "red" || d.rag === "amber");
  const ctxHealthy = contextDrivers.filter((d) => d.rag === "green");
  const firmLagging = !contextPerson ? firmLaggingDriversFor(def.id, personScores) : [];

  const squadData = standings.map((row) => {
    const values = row.squad.members
      .map((m) => m.score?.metricValues.find((mv) => mv.metricId === def.id))
      .filter((mv): mv is NonNullable<typeof mv> => Boolean(mv));
    const total = values.reduce(
      (s, v) => s + (typeof v.value === "number" ? v.value : 0),
      0,
    );
    const avg = values.length ? total / values.length : 0;
    return {
      captain: row.squad.captain.name.split(" ")[0],
      captainId: row.squad.captain.id,
      avg: Number(avg.toFixed(2)),
    };
  });

  const allValues = personScores
    .flatMap((s) =>
      s.metricValues.filter((mv) => mv.metricId === def.id).map((mv) => ({ mv, s })),
    )
    .filter(({ mv }) => typeof mv.value === "number");
  const top3 = [...allValues]
    .sort((a, b) => (b.mv.value as number) - (a.mv.value as number))
    .slice(0, 3);
  const bot3 = [...allValues]
    .sort((a, b) => (a.mv.value as number) - (b.mv.value as number))
    .slice(0, 3);

  const chartFill = getToken("--lks-accent") || "#2f3fb6";
  const axisColor = getToken("--text-2") || "#6e7276";

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-7xl space-y-4 p-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[12px] transition-opacity hover:opacity-70"
          style={{ color: "var(--text-2)" }}
        >
          <ArrowLeft size={14} /> Firm Landing
        </Link>

        {/* Persistent header card */}
        <Card padding="lg">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="font-metric-id rounded px-2 py-0.5 text-[11px]"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-2)" }}
                >
                  {def.id}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{
                    backgroundColor: isPrimaryAnywhere
                      ? "var(--lks-accent)"
                      : "var(--text-2)",
                  }}
                >
                  {isPrimaryAnywhere ? "Primary outcome" : "Secondary lever"}
                </span>
                <span
                  className="rounded px-2 py-0.5 text-[11px]"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-2)" }}
                >
                  {def.area.replace(/_/g, " ")}
                </span>
              </div>
              <h2
                className="mt-2 text-[22px] font-semibold leading-tight"
                style={{ color: "var(--text-1)" }}
              >
                {def.name}
              </h2>
              <p className="mt-1 max-w-[640px] text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {def.description}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
                {[
                  { label: "Target lens", value: def.targetDescription },
                  { label: "Data tier", value: def.dataTier },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-2)" }}
                    >
                      {label}
                    </div>
                    <div className="mt-1" style={{ color: "var(--text-1)" }}>
                      {value}
                    </div>
                  </div>
                ))}
                <div>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-2)" }}
                  >
                    Role categories
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <RoleChip label="PH" value={def.category.practice_head} />
                    <RoleChip label="P" value={def.category.partner} />
                    <RoleChip label="A" value={def.category.associate} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar — inside header card */}
          <div
            className="mt-5 flex gap-0 border-b"
            style={{ borderColor: "var(--line)" }}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="-mb-px border-b-2 px-4 py-2 text-[13px] font-medium transition-colors"
                  style={{
                    borderColor: active ? "var(--lks-accent)" : "transparent",
                    color: active ? "var(--lks-accent)" : "var(--text-2)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tab: Overview */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  { role: "practice_head", label: "Practice Heads" },
                  { role: "partner", label: "Partners" },
                  { role: "associate", label: "Associates" },
                ] as const
              ).map(({ role, label }) => {
                const people = mockPeople.filter((p) => p.role === role);
                const vals = allValues.filter(({ s }) =>
                  people.some((p) => p.id === s.personId),
                );
                const reds = vals.filter(({ mv }) => mv.rag === "red").length;
                const greens = vals.filter(({ mv }) => mv.rag === "green").length;
                return (
                  <Card key={role} padding="md">
                    <div
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-2)" }}
                    >
                      {label}
                    </div>
                    <div
                      className="mt-2 tabular font-mono text-[28px] font-bold"
                      style={{ color: "var(--text-1)" }}
                    >
                      {vals.length}
                    </div>
                    <div className="mt-1 flex gap-3 text-[11px]">
                      <span style={{ color: "var(--rag-green)" }}>{greens} green</span>
                      <span style={{ color: "var(--rag-red)" }}>{reds} red</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Drivers */}
        {tab === "drivers" && (
          <div className="space-y-4">
            {contextPerson ? (
              <>
                <SectionLabel>
                  Secondary drivers · {contextPerson.name} (
                  {contextPerson.role.replace("_", " ")})
                </SectionLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  <Card padding="md">
                    <div
                      className="mb-2 flex items-center justify-between"
                    >
                      <div
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--rag-red)" }}
                      >
                        Pulling this metric down
                      </div>
                      <Link
                        to="/metric/$id"
                        params={{ id: def.id }}
                        search={{ from: undefined } as never}
                        className="text-[10px] underline transition-opacity hover:opacity-70"
                        style={{ color: "var(--text-2)" }}
                      >
                        Clear context
                      </Link>
                    </div>
                    {isPrimaryForContext ? (
                      <SecondaryDriverList drivers={ctxLagging} />
                    ) : (
                      <div
                        className="text-[12px] italic"
                        style={{ color: "var(--text-2)" }}
                      >
                        This metric isn't primary for{" "}
                        {contextPerson.role.replace("_", " ")}s — no role-specific
                        drivers.
                      </div>
                    )}
                  </Card>
                  <Card padding="md">
                    <div
                      className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--rag-green)" }}
                    >
                      Supporting this metric
                    </div>
                    <SecondaryDriverList drivers={ctxHealthy} />
                  </Card>
                </div>
              </>
            ) : firmLagging.length > 0 ? (
              <>
                <SectionLabel>Most common lagging drivers firm-wide</SectionLabel>
                <Card padding="md">
                  <ul className="space-y-2">
                    {firmLagging.map((d) => (
                      <li
                        key={d.metricId}
                        className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                        style={{
                          borderColor: "color-mix(in srgb, var(--rag-red) 25%, var(--line))",
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-metric-id text-[10px]"
                              style={{ color: "var(--text-2)" }}
                            >
                              {d.metricId}
                            </span>
                            <Link
                              to="/metric/$id"
                              params={{ id: d.metricId }}
                              className="text-[12px] font-semibold transition-opacity hover:opacity-70"
                              style={{ color: "var(--text-1)" }}
                            >
                              {d.name}
                            </Link>
                          </div>
                          <div
                            className="mt-0.5 text-[11px] italic"
                            style={{ color: "var(--text-2)" }}
                          >
                            {d.mechanism}
                          </div>
                        </div>
                        <div className="text-right text-[11px]">
                          <span
                            className="tabular font-mono font-semibold"
                            style={{ color: RAG_FG.red }}
                          >
                            {d.redCount}R
                          </span>
                          <span className="mx-1" style={{ color: "var(--line)" }}>
                            ·
                          </span>
                          <span
                            className="tabular font-mono font-semibold"
                            style={{ color: RAG_FG.amber }}
                          >
                            {d.amberCount}A
                          </span>
                          <div className="text-[10px]" style={{ color: "var(--text-2)" }}>
                            of {d.totalPrimaryPeople} people
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            ) : (
              <div
                className="py-8 text-center text-[13px]"
                style={{ color: "var(--text-2)" }}
              >
                No driver data available for this metric.
              </div>
            )}
          </div>
        )}

        {/* Tab: By squad */}
        {tab === "by-squad" && (
          <Card padding="md">
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={squadData}>
                  <XAxis
                    dataKey="captain"
                    tick={{ fontSize: 11, fill: axisColor }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      color: "var(--text-1)",
                    }}
                  />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]} fill={chartFill} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Tab: Leaders / Laggards */}
        {tab === "leaders" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card padding="md">
              <div
                className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--rag-green)" }}
              >
                Top 3 firm-wide
              </div>
              <ul className="space-y-1.5">
                {top3.map(({ mv, s }) => {
                  const person = mockPeople.find((p) => p.id === s.personId);
                  return (
                    <li
                      key={s.personId}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span style={{ color: "var(--text-1)" }}>
                        {person?.name ?? s.personId}
                      </span>
                      <span
                        className="tabular flex items-center gap-1 font-mono font-semibold"
                        style={{ color: RAG_FG[mv.rag] }}
                      >
                        {formatMetricValue(mv.value as number, mv.unit)}
                        <ScorecardStar show={mv.scorecardStar} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card padding="md">
              <div
                className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--rag-red)" }}
              >
                Bottom 3 firm-wide
              </div>
              <ul className="space-y-1.5">
                {bot3.map(({ mv, s }) => {
                  const person = mockPeople.find((p) => p.id === s.personId);
                  return (
                    <li
                      key={s.personId}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span style={{ color: "var(--text-1)" }}>
                        {person?.name ?? s.personId}
                      </span>
                      <span
                        className="tabular flex items-center gap-1 font-mono font-semibold"
                        style={{ color: RAG_FG[mv.rag] }}
                      >
                        {formatMetricValue(mv.value as number, mv.unit)}
                        <ScorecardStar show={mv.scorecardStar} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        )}

        {/* Tab: Causality */}
        {tab === "causality" && (
          <Card padding="md">
            <CausalSubgraph
              centerId={def.id}
              incoming={sub.incoming}
              outgoing={sub.outgoing}
            />
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

function RoleChip({ label, value }: { label: string; value: string }) {
  const color =
    value === "primary"
      ? { bg: "color-mix(in srgb, var(--lks-accent) 12%, transparent)", text: "var(--lks-accent)" }
      : value === "secondary"
        ? { bg: "var(--surface-2)", text: "var(--text-2)" }
        : { bg: "var(--surface-2)", text: "var(--text-2)", opacity: 0.5 };

  return (
    <span
      className="font-metric-id rounded px-1.5 py-0.5 text-[10px]"
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {label}: {value}
    </span>
  );
}
