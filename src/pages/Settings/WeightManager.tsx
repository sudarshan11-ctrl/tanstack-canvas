import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, RotateCcw, Save } from "lucide-react";
import Card from "@/components/ui/card";
import { useDashboardStore } from "@/store/dashboardStore";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { mockPeople } from "@/data/mockPeople";
import { mockWeights } from "@/data/mockWeights";
import type { Role } from "@/types";

const ROLE_TABS: { id: Role; label: string; target: number }[] = [
  { id: "practice_head", label: "Practice Head", target: 85 },
  { id: "partner", label: "Partner", target: 80 },
  { id: "associate", label: "Associate", target: 75 },
];

export default function WeightManager() {
  const weights = useDashboardStore((s) => s.weights);
  const personScores = useDashboardStore((s) => s.personScores);
  const updateWeight = useDashboardStore((s) => s.updateWeight);
  const recalculateScores = useDashboardStore((s) => s.recalculateScores);

  const [activeRole, setActiveRole] = useState<Role>("practice_head");
  const [baseline] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const ps of useDashboardStore.getState().personScores) {
      map[ps.personId] = ps.lpi;
    }
    return map;
  });

  const roleWeights = weights[activeRole].weights;
  const metricIds = Object.keys(roleWeights);

  const sumPct = useMemo(
    () => metricIds.reduce((s, id) => s + Math.round(roleWeights[id] * 100), 0),
    [roleWeights, metricIds],
  );
  const valid = sumPct === 100;

  const handleSlider = (metricId: string, pct: number) => {
    updateWeight(activeRole, metricId, pct / 100);
    recalculateScores();
  };

  const resetDefaults = () => {
    for (const r of ROLE_TABS) {
      const def = mockWeights[r.id].weights;
      for (const [id, w] of Object.entries(def)) {
        updateWeight(r.id, id, w);
      }
    }
    recalculateScores();
  };

  const topFive = useMemo(() => {
    const people = mockPeople.filter((p) => p.role === activeRole);
    return personScores
      .filter((ps) => people.some((p) => p.id === ps.personId))
      .sort((a, b) => b.lpi - a.lpi)
      .slice(0, 5)
      .map((ps) => {
        const person = mockPeople.find((p) => p.id === ps.personId)!;
        return {
          id: ps.personId,
          name: person.name,
          lpi: ps.lpi,
          delta: Math.round(ps.lpi - (baseline[ps.personId] ?? ps.lpi)),
        };
      });
  }, [personScores, activeRole, baseline]);

  const currentTarget = ROLE_TABS.find((t) => t.id === activeRole)?.target ?? 80;

  return (
    <div className="grid grid-cols-[1fr_280px] gap-4">
      {/* Main weight editor */}
      <Card padding="lg">
        <div
          className="mb-1 text-[17px] font-semibold"
          style={{ color: "var(--text-1)" }}
        >
          Performance Index weight configuration
        </div>
        <p className="mb-5 text-[13px]" style={{ color: "var(--text-2)" }}>
          Adjust the weight of each primary metric. Weights must sum to 100%.
          Changes recalculate all scores live.
        </p>

        {/* Role tabs */}
        <div
          className="mb-4 flex gap-0 border-b"
          style={{ borderColor: "var(--line)" }}
        >
          {ROLE_TABS.map((t) => {
            const active = activeRole === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveRole(t.id)}
                className="-mb-px border-b-2 px-4 py-2 text-[13px] font-medium transition-colors"
                style={{
                  borderColor: active ? "var(--lks-accent)" : "transparent",
                  color: active ? "var(--lks-accent)" : "var(--text-2)",
                }}
              >
                {t.label}
                <span
                  className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text-2)",
                  }}
                >
                  Target {t.target}
                </span>
              </button>
            );
          })}
        </div>

        {/* Metric sliders */}
        <div>
          {metricIds.map((id) => {
            const def = mockMetricDefinitions.find((m) => m.id === id);
            const pct = Math.round(roleWeights[id] * 100);
            return (
              <div
                key={id}
                className="flex items-center gap-4 border-b py-3"
                style={{ borderColor: "var(--surface-2)" }}
              >
                <span
                  className="font-metric-id w-14 rounded px-2 py-1 text-center text-[11px]"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text-2)",
                  }}
                >
                  {id}
                </span>
                <span
                  className="flex-1 text-[13px]"
                  style={{ color: "var(--text-1)" }}
                >
                  {def?.name ?? id}
                </span>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={pct}
                  onChange={(e) => handleSlider(id, Number(e.target.value))}
                  style={{ width: 160, accentColor: "var(--lks-accent)" }}
                />
                <span
                  className="w-10 text-right font-mono text-[14px] tabular"
                  style={{ color: valid ? "var(--lks-accent)" : "var(--rag-red)" }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Validation footer */}
        <div
          className="sticky bottom-0 mt-4 flex items-center justify-between rounded-md border px-4 py-3"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--line)",
          }}
        >
          <div className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
            Total:{" "}
            <span className="font-mono tabular">{sumPct}%</span> / 100%
          </div>
          {sumPct === 100 ? (
            <div
              className="flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: "var(--rag-green)" }}
            >
              <CheckCircle2 size={14} /> Valid
            </div>
          ) : sumPct > 100 ? (
            <div
              className="flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: "var(--rag-red)" }}
            >
              <AlertTriangle size={14} /> Exceeds 100% by {sumPct - 100}%
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: "var(--rag-amber)" }}
            >
              <AlertTriangle size={14} /> {100 - sumPct}% unallocated
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={recalculateScores}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--lks-accent)" }}
          >
            <Save size={13} />
            Recalculate all scores
          </button>
          <button
            onClick={resetDefaults}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-[13px] font-medium transition-colors"
            style={{
              backgroundColor: "var(--surface-2)",
              borderColor: "var(--line)",
              color: "var(--text-1)",
            }}
          >
            <RotateCcw size={13} />
            Reset to defaults
          </button>
        </div>
      </Card>

      {/* Live score preview */}
      <Card padding="md">
        <div
          className="mb-3 text-[13px] font-semibold"
          style={{ color: "var(--text-1)" }}
        >
          Score preview · top 5{" "}
          {ROLE_TABS.find((t) => t.id === activeRole)?.label}s
        </div>
        <div
          className="mb-2 text-[11px]"
          style={{ color: "var(--text-2)" }}
        >
          Target: {currentTarget} (RRR target)
        </div>
        <div className="space-y-2">
          {topFive.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
              style={{
                borderColor: "var(--line)",
                backgroundColor: "var(--surface-2)",
              }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="w-4 text-right font-mono text-[11px] tabular"
                  style={{ color: "var(--text-2)" }}
                >
                  {i + 1}
                </span>
                <span
                  className="truncate text-[12px]"
                  style={{ color: "var(--text-1)" }}
                >
                  {p.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="tabular font-mono text-[13px] font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  {p.lpi}
                </span>
                {p.delta !== 0 && (
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] tabular"
                    style={{
                      backgroundColor:
                        p.delta > 0
                          ? "color-mix(in srgb, var(--rag-green) 12%, transparent)"
                          : "color-mix(in srgb, var(--rag-red) 12%, transparent)",
                      color: p.delta > 0 ? "var(--rag-green)" : "var(--rag-red)",
                    }}
                  >
                    {p.delta > 0 ? "+" : ""}
                    {p.delta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
