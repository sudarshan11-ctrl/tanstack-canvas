import type { RunRate } from "@/utils/runRate";
import { STATUS_COLOR, STATUS_LABEL, DAYS_REMAINING } from "@/utils/runRate";
import { formatMetricValue } from "@/utils/format";

export interface MatchCentreStrapProps {
  innings: number;       // Performance Index to date
  required: number;      // band target
  projection: number;    // projected close
  wickets: number;       // count of red primaries
  topRunRate?: RunRate | null;
  compact?: boolean;
}

export default function MatchCentreStrap({
  innings,
  required,
  projection,
  wickets,
  topRunRate,
  compact,
}: MatchCentreStrapProps) {
  const need = Math.max(0, required - innings);
  const status =
    projection >= required
      ? "on-track"
      : projection >= required - 10
        ? "needs-acceleration"
        : "out-of-reach";
  const statusColor = STATUS_COLOR[status];

  const cells = [
    {
      label: "Innings",
      value: `${Math.round(innings)}`,
      sub: "Performance Index to date",
    },
    {
      label: "RRR",
      value: `${need.toFixed(1)}`,
      sub: `pts in ${DAYS_REMAINING} days`,
    },
    {
      label: "Projection",
      value: `${Math.round(projection)}`,
      sub: "if pace holds",
    },
    {
      label: "Wickets",
      value: `${wickets}`,
      sub: "primaries red",
    },
  ];

  return (
    <div
      className="flex w-full items-stretch overflow-hidden"
      style={{
        backgroundColor: "var(--strap-bg)",
        borderRadius: "0 0 var(--radius) var(--radius)",
      }}
    >
      {cells.map((c, i) => (
        <div
          key={c.label}
          className="flex flex-1 flex-col gap-0.5 px-4 py-2.5"
          style={{
            minWidth: compact ? 80 : 110,
            borderRight: i < cells.length - 1 ? "1px solid rgba(255,255,255,0.08)" : undefined,
          }}
        >
          <span
            className="text-[9px] font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {c.label}
          </span>
          <span
            className="tabular font-mono text-[18px] font-bold leading-none"
            style={{ color: "var(--strap-text)" }}
          >
            {c.value}
          </span>
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {c.sub}
          </span>
        </div>
      ))}

      {/* Match situation cell */}
      <div
        className="flex flex-col justify-center gap-0.5 px-4 py-2.5"
        style={{
          minWidth: compact ? 120 : 160,
          backgroundColor: `${statusColor}18`,
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Match situation
        </span>
        <span
          className="text-[13px] font-semibold leading-tight"
          style={{ color: statusColor }}
        >
          {STATUS_LABEL[status]}
        </span>
        {topRunRate ? (
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {topRunRate.metricId}: CRR{" "}
            {formatMetricValue(topRunRate.crr, topRunRate.unit)}/d · RRR{" "}
            {formatMetricValue(Math.max(0, topRunRate.rrr), topRunRate.unit)}/d
          </span>
        ) : null}
      </div>
    </div>
  );
}
