import { useState } from "react";
import PrimaryMetricCard from "./PrimaryMetricCard";
import type { PersonScore } from "@/types";
import { primariesFor, type PrimaryScore } from "@/utils/rollup";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { normaliseMetric } from "@/utils/lpi";
import { isLowerIsBetter } from "@/utils/metricDirection";

export interface PrimaryMetricGridProps {
  personId: string;
  allScores: PersonScore[];
  buildLink: (metricId: string) => { to: string; params: Record<string, string>; search?: Record<string, string> };
  showAllToggle?: boolean;
}

export default function PrimaryMetricGrid({ personId, allScores, buildLink, showAllToggle = true }: PrimaryMetricGridProps) {
  const prims = primariesFor(personId, allScores);
  const self = allScores.find((s) => s.personId === personId);
  const [showAll, setShowAll] = useState(false);

  const primaryIds = new Set(prims.map((p) => p.metricId));
  const secondaries: PrimaryScore[] = (self?.metricValues ?? [])
    .filter((mv) => !primaryIds.has(mv.metricId))
    .map((mv) => {
      const def = mockMetricDefinitions.find((d) => d.id === mv.metricId);
      const val = typeof mv.value === "number" ? mv.value : null;
      const tgt = typeof mv.target === "number" ? mv.target : null;
      const score = val !== null && tgt !== null
        ? normaliseMetric(val, tgt, isLowerIsBetter(mv.metricId))
        : 0;
      return {
        metricId: mv.metricId,
        name: def?.name ?? mv.metricId,
        score: Math.round(score),
        value: val,
        target: tgt,
        unit: mv.unit ?? "",
        rag: mv.rag,
        trend: mv.trend ?? [],
      };
    })
    .sort((a, b) => a.metricId.localeCompare(b.metricId));

  const renderCard = (p: PrimaryScore) => {
    const mv = self?.metricValues.find((v) => v.metricId === p.metricId);
    const link = buildLink(p.metricId);
    return (
      <PrimaryMetricCard
        key={p.metricId}
        primary={p}
        metricValue={mv}
        href={link.to}
        hrefParams={link.params}
        hrefSearch={link.search}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {prims.map(renderCard)}
      </div>
      {showAllToggle && secondaries.length > 0 ? (
        <>
          {showAll ? (
            <>
              <div className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                All other metrics · {secondaries.length} secondary
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {secondaries.map(renderCard)}
              </div>
            </>
          ) : null}
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--line)",
                color: "var(--text-1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand-ink)";
                (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)";
              }}
            >
              {showAll
                ? `Show only ${prims.length} primary metrics ▴`
                : `Show all ${prims.length + secondaries.length} metrics ▾`}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
