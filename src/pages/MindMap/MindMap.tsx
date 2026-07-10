import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/SectionLabel";
import { causalLinks } from "@/data/mockCausalLinks";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { isMetricActive, metricInactiveReason } from "@/utils/metricActivity";
import type { MetricArea, Role } from "@/types";

const ROLE_TABS: { id: Role; label: string }[] = [
  { id: "practice_head", label: "Practice Head" },
  { id: "partner", label: "Partner" },
  { id: "associate", label: "Associate" },
];

const AREA_LABEL: Record<MetricArea, string> = {
  financial_health: "Financial Health",
  client_matter: "Client & Matter",
  people_ops: "People & Ops",
  growth_pipeline: "Growth & Pipeline",
  brand_discoverability: "Brand & Discoverability",
};

const AREA_COLOR: Record<MetricArea, string> = {
  financial_health: "#4CAF50",
  client_matter: "#2196F3",
  people_ops: "#9C27B0",
  growth_pipeline: "#FF9800",
  brand_discoverability: "#009688",
};

export default function MindMap() {
  const [role, setRole] = useState<Role>("practice_head");
  const [areaFilter, setAreaFilter] = useState<Set<MetricArea>>(
    new Set(Object.keys(AREA_LABEL) as MetricArea[]),
  );
  const [hideInactive, setHideInactive] = useState(false);

  const visibleMetrics = useMemo(() => {
    return mockMetricDefinitions.filter(
      (m) =>
        m.category[role] !== "na" &&
        areaFilter.has(m.area) &&
        (!hideInactive || isMetricActive(m.id)),
    );
  }, [role, areaFilter, hideInactive]);

  const visibleLinks = useMemo(() => {
    const ids = new Set(visibleMetrics.map((m) => m.id));
    return causalLinks.filter(
      (l) => l.applicableRoles.includes(role) && ids.has(l.fromId) && ids.has(l.toId),
    );
  }, [visibleMetrics, role]);

  const primaries = visibleMetrics.filter((m) => m.category[role] === "primary");
  const secondaries = visibleMetrics.filter((m) => m.category[role] === "secondary");
  const activeCount = visibleMetrics.filter((m) => isMetricActive(m.id)).length;

  const toggleArea = (a: MetricArea) => {
    const next = new Set(areaFilter);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    setAreaFilter(next);
  };

  return (
    <PageWrapper title="Metrics relationship map">
      <div className="mx-auto max-w-[1280px] space-y-4 p-2">
        <Card padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              {ROLE_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRole(t.id)}
                  className={
                    "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors " +
                    (role === t.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="h-6 w-px" style={{ backgroundColor: "#e2e8f0" }} />
            <div className="flex flex-wrap gap-1">
              {(Object.keys(AREA_LABEL) as MetricArea[]).map((a) => {
                const on = areaFilter.has(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleArea(a)}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                    style={{
                      borderColor: AREA_COLOR[a],
                      backgroundColor: on ? AREA_COLOR[a] : "white",
                      color: on ? "white" : AREA_COLOR[a],
                    }}
                  >
                    {AREA_LABEL[a]}
                  </button>
                );
              })}
            </div>
            <div className="h-6 w-px" style={{ backgroundColor: "#e2e8f0" }} />
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={hideInactive}
                onChange={(e) => setHideInactive(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer"
              />
              Hide metrics without data
            </label>
            <span className="text-[11px] text-slate-500">
              {activeCount} of {visibleMetrics.length} have data
            </span>
          </div>
        </Card>

        <SectionLabel>
          Primary outcomes ({primaries.length}) · click any to see drivers
        </SectionLabel>
        <Card padding="md">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {primaries.map((m) => {
              const drivers = visibleLinks.filter((l) => l.toId === m.id);
              const active = isMetricActive(m.id);
              const reason = metricInactiveReason(m.id);
              const awaitingTarget = reason === "awaiting-target";
              const card = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold text-slate-500">{m.id}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"
                      style={{
                        backgroundColor: active
                          ? AREA_COLOR[m.area]
                          : awaitingTarget
                            ? "#f59e0b"
                            : "#94a3b8",
                      }}
                    >
                      {active ? "Primary" : awaitingTarget ? "Awaiting target" : "No data"}
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-slate-900">{m.name}</div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {drivers.length} secondary drivers
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {drivers.slice(0, 6).map((d) => (
                      <span
                        key={d.fromId}
                        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                      >
                        {d.fromId}
                      </span>
                    ))}
                    {drivers.length > 6 ? (
                      <span className="text-[10px] text-slate-400">+{drivers.length - 6}</span>
                    ) : null}
                  </div>
                </>
              );
              if (!active) {
              return (
                  <div
                    key={m.id}
                    title={
                      awaitingTarget
                        ? "Metric will be calculated once the target is entered."
                        : "Data not yet available for this metric."
                    }
                    aria-disabled="true"
                    className={
                      awaitingTarget
                        ? "block cursor-not-allowed rounded-lg border bg-amber-50 p-3 opacity-90"
                        : "block cursor-not-allowed rounded-lg border bg-slate-50 p-3 opacity-60"
                    }
                    style={
                      awaitingTarget
                        ? { borderColor: "#f59e0b", borderLeftWidth: 4, borderLeftStyle: "dashed" }
                        : { borderColor: "#cbd5e1", borderLeftWidth: 4 }
                    }
                  >
                    {card}
                  </div>
                );
              }

              return (
                <Link
                  key={m.id}
                  to="/metric/$id"
                  params={{ id: m.id }}
                  className="block rounded-lg border bg-white p-3 transition-all hover:shadow-md"
                  style={{ borderColor: AREA_COLOR[m.area], borderLeftWidth: 4 }}
                >
                  {card}
                </Link>
              );
            })}
          </div>
        </Card>

        <SectionLabel>
          Secondary levers ({secondaries.length}) · ranked by causal degree
        </SectionLabel>
        <Card padding="md">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[...secondaries]
              .map((m) => ({ m, degree: visibleLinks.filter((l) => l.fromId === m.id).length }))
              .sort((a, b) => b.degree - a.degree)
              .map(({ m, degree }) => {
                const drives = visibleLinks.filter((l) => l.fromId === m.id);
                const active = isMetricActive(m.id);
                const inner = (
                  <>
                    <span className="font-mono text-[10px] text-slate-400 w-12">{m.id}</span>
                    <span className="flex-1 truncate text-[12px] text-slate-800">{m.name}</span>
                    {active ? (
                      <>
                        <span className="font-mono text-[11px] text-slate-500">drives {degree}</span>
                        {drives.length > 0 && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] text-amber-700">
                            → {drives[0].toId}{drives.length > 1 ? "…" : ""}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        No data
                      </span>
                    )}
                  </>
                );
                if (!active) {
                  return (
                    <div
                      key={m.id}
                      title="Data not yet available for this metric."
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-3 rounded-md border bg-slate-50 px-3 py-2 opacity-60"
                      style={{ borderColor: "#e2e8f0", borderLeft: `3px solid #cbd5e1` }}
                    >
                      {inner}
                    </div>
                  );
                }
                return (
                  <Link
                    key={m.id}
                    to="/metric/$id"
                    params={{ id: m.id }}
                    className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 transition-colors hover:bg-slate-50"
                    style={{ borderColor: "#e2e8f0", borderLeft: `3px solid ${AREA_COLOR[m.area]}` }}
                  >
                    {inner}
                  </Link>
                );
              })}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}