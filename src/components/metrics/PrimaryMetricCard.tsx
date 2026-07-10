import { Link } from "@tanstack/react-router";
import Sparkline from "@/components/ui/Sparkline";
import DeltaBadge from "@/components/ui/DeltaBadge";
import { RAG_FG } from "@/components/ui/rag-colors";
import { formatMetricValue } from "@/utils/format";
import { isLowerIsBetter } from "@/utils/metricDirection";
import { runRateFor, STATUS_COLOR, STATUS_LABEL } from "@/utils/runRate";
import ScorecardStar from "@/components/ui/ScorecardStar";
import type { PrimaryScore } from "@/utils/rollup";
import type { MetricValue } from "@/types";

export interface PrimaryMetricCardProps {
  primary: PrimaryScore;
  metricValue: MetricValue | undefined;
  href: string;
  hrefParams: Record<string, string>;
  hrefSearch?: Record<string, string>;
}

export default function PrimaryMetricCard({ primary, metricValue, href, hrefParams, hrefSearch }: PrimaryMetricCardProps) {
  const passive = metricValue?.passive === true;
  const ragColor = passive ? "var(--text-2)" : RAG_FG[primary.rag];
  const lower = isLowerIsBetter(primary.metricId);
  const rr = passive || !metricValue ? null : runRateFor(metricValue);
  const formattedValue = passive || primary.value === null ? "—" : formatMetricValue(primary.value, primary.unit);
  const target = passive || primary.target === null ? "—" : formatMetricValue(primary.target, primary.unit);

  const cardBody = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-metric-id flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--lks-accent)" }}
        >
          {primary.metricId}
          <ScorecardStar show={metricValue?.scorecardStar} />
        </span>
        {passive ? (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--text-2)" }}
          >
            No data
          </span>
        ) : (
          <DeltaBadge delta={metricValue?.deltaVsTarget ?? null} unit="%" lowerIsBetter={lower} />
        )}
      </div>
      <div
        className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug"
        style={{ color: passive ? "var(--text-2)" : "var(--text-1)" }}
        title={primary.name}
      >
        {primary.name}
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="font-mono text-[20px] font-semibold leading-none" style={{ color: ragColor }}>
          {formattedValue}
        </div>
        <div className="min-w-0 flex-1">
          {passive ? null : (
            <Sparkline data={primary.trend.length ? primary.trend : [0]} color={ragColor} height={24} />
          )}
        </div>
      </div>

      <div className="mt-1.5 text-[11px] font-medium" style={{ color: "var(--text-2)" }}>
        Target: {target}
      </div>

      {passive ? (
        <div
          className="mt-auto rounded px-2 py-1.5 text-[10px] italic"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-2)" }}
        >
          {metricValue?.remark ?? "Data not yet available for this metric."}
        </div>
      ) : rr ? (
        <div
          className="mt-auto flex items-center justify-between gap-2 rounded px-2 py-1.5"
          style={{ backgroundColor: `${STATUS_COLOR[rr.status]}15` }}
        >
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
              CRR · today
            </span>
            <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>
              {rr.crr >= 0.01 ? rr.crr.toFixed(2) : rr.crr.toExponential(1)} /d
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-2)" }}>
              RRR · need
            </span>
            <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--text-1)" }}>
              {Math.max(0, rr.rrr).toFixed(2)} /d
            </span>
          </div>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: STATUS_COLOR[rr.status] }}
          >
            {STATUS_LABEL[rr.status]}
          </span>
        </div>
      ) : (
        <div className="mt-auto text-[10px] italic" style={{ color: "var(--text-2)" }}>
          No CRR/RRR — missing data.
        </div>
      )}
    </>
  );

  if (passive) {
    return (
      <div
        title={metricValue?.remark ?? "Data not yet available for this metric."}
        aria-disabled="true"
        className="flex min-h-[10.625rem] cursor-not-allowed flex-col rounded-lg border p-3 opacity-80"
        style={{
          backgroundColor: "var(--surface-2)",
          borderColor: "var(--line)",
          borderTop: "2px solid var(--line)",
        }}
      >
        {cardBody}
      </div>
    );
  }

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={href as any}
      params={hrefParams as never}
      search={hrefSearch as never}
      className="flex min-h-[10.625rem] flex-col rounded-lg border p-3 transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--line)",
        borderTop: `2px solid ${ragColor}`,
      }}
    >
      {cardBody}
    </Link>
  );
}
