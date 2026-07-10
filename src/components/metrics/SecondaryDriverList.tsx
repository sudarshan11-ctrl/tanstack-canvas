import { Link } from "@tanstack/react-router";
import { RAG_FG, RAG_BG } from "@/components/ui/rag-colors";
import { formatMetricValue } from "@/utils/format";
import type { DriverImpact } from "@/utils/secondaryDrivers";

export interface SecondaryDriverListProps {
  drivers: DriverImpact[];
  title?: string;
}

export default function SecondaryDriverList({ drivers, title }: SecondaryDriverListProps) {
  if (drivers.length === 0) {
    return (
      <div className="text-[12px] italic" style={{ color: "var(--text-2)" }}>
        No causal secondary drivers mapped for this metric.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {title ? (
        <div
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-1)", opacity: 0.72 }}
        >
          {title}
        </div>
      ) : null}
      {drivers.map((d) => (
        (() => {
          const passive = d.value?.passive === true;
          const inner = (
            <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="font-metric-id text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--lks-accent)" }}
              >
                {d.metricId}
              </span>
              <span
                className="text-[13px] font-semibold leading-snug"
                style={{ color: "var(--text-1)" }}
              >
                {d.name}
              </span>
              {passive ? (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-2)" }}
                >
                  No data
                </span>
              ) : (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: RAG_FG[d.rag], backgroundColor: RAG_BG[d.rag] }}
                >
                  {d.rag}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] italic" style={{ color: "var(--text-2)" }}>
              {passive ? (d.value?.remark ?? "Data not yet available for this metric.") : d.mechanism}
            </div>
          </div>
          );
          const tail = (
            <div className="text-right">
            <div className="font-mono text-[12px] font-semibold" style={{ color: "var(--text-1)" }}>
              {!passive && d.value && typeof d.value.value === "number"
                ? formatMetricValue(d.value.value, d.value.unit)
                : "—"}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-2)" }}>
              {!passive && d.value && typeof d.value.target === "number"
                ? `vs ${formatMetricValue(d.value.target, d.value.unit)}`
                : ""}
            </div>
          </div>
          );
          if (passive) {
            return (
              <div
                key={d.metricId}
                title={d.value?.remark ?? "Data not yet available for this metric."}
                aria-disabled="true"
                className="flex cursor-not-allowed items-start justify-between gap-3 rounded-md border px-3 py-2 opacity-80"
                style={{
                  backgroundColor: "var(--surface-2)",
                  borderColor: "var(--line)",
                  borderLeft: "3px solid var(--line)",
                }}
              >
                {inner}
                {tail}
              </div>
            );
          }
          return (
            <Link
              key={d.metricId}
              to="/metric/$id"
              params={{ id: d.metricId }}
              className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--line)",
                borderLeft: `3px solid ${RAG_FG[d.rag]}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--surface)";
              }}
            >
              {inner}
              {tail}
            </Link>
          );
        })()
      ))}
    </div>
  );
}
