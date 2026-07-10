import type { MetricDefinition, MetricValue } from "@/types";
import Sparkline from "./Sparkline";
import DeltaBadge from "./DeltaBadge";
import { RAG_FG } from "./rag-colors";
import { formatMetricValue } from "@/utils/format";
import { isLowerIsBetter } from "@/utils/metricDirection";
import ScorecardStar from "@/components/ui/ScorecardStar";

export interface MetricCardProps {
  metric: MetricDefinition;
  value: MetricValue;
}

export default function MetricCard({ metric, value }: MetricCardProps) {
  const ragColor = RAG_FG[value.rag];
  const lower = isLowerIsBetter(metric.id);
  const formattedValue =
    value.value === null ? "—" : formatMetricValue(value.value, value.unit);
  const target =
    value.target === null ? "—" : formatMetricValue(value.target, value.unit);

  return (
    <div
      className="flex min-h-[132px] flex-col rounded-[var(--radius)] border p-3"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--line)",
        borderTop: `2px solid ${ragColor}`,
      }}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span
          className="font-metric-id flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--lks-accent)" }}
        >
          {metric.id}
          <ScorecardStar show={value.scorecardStar} />
        </span>
      </div>
      <div
        className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug"
        style={{ color: "var(--text-1)" }}
        title={metric.name}
      >
        {metric.name}
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div
          className="tabular font-mono text-xl font-semibold leading-none"
          style={{ color: ragColor }}
        >
          {formattedValue}
        </div>
        <div className="min-w-0 flex-1">
          <Sparkline data={value.trend} color={ragColor} height={24} />
        </div>
      </div>

      <div
        className="mt-auto flex items-center justify-between border-t pt-1"
        style={{ borderColor: "var(--line)" }}
      >
        <span className="text-[10px]" style={{ color: "var(--text-2)" }}>
          Target: {target}
        </span>
        <DeltaBadge delta={value.deltaVsTarget} unit="%" lowerIsBetter={lower} />
      </div>
    </div>
  );
}
