import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { FirmHygieneMetric } from "@/types/hygiene";

export interface HygieneMetricsPanelProps {
  metrics: FirmHygieneMetric[];
  /** Start expanded. Defaults to true. */
  defaultOpen?: boolean;
}

function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

function formatPct(pct: number): string {
  if (pct % 1 === 0) return `${pct.toFixed(0)}%`;
  if (Math.round(pct * 100) % 10 === 0) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(2)}%`;
}

interface SummaryLine {
  id: string;
  label: string;
  value: string;
}

function summaryLines(metrics: FirmHygieneMetric[]): SummaryLine[] {
  return metrics.map((m) => {
    if (m.kind === "rate") {
      return { id: m.id, label: m.title, value: formatPct(m.valuePct) };
    }
    const top = m.buckets[m.buckets.length - 1];
    return {
      id: m.id,
      label: m.title,
      value: top ? `${formatPct(top.sharePct)} ${top.label}` : "—",
    };
  });
}

function HygieneShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="w-full min-w-0 rounded-[var(--radius)] px-3 py-2.5 sm:min-w-[12.5rem] sm:max-w-[15rem]"
      style={{
        backgroundColor: "var(--surface-2)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-2)" }}
      >
        Hygiene
      </div>
      <div
        className="mt-0.5 text-[12px] font-semibold leading-snug"
        style={{ color: "var(--text-1)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function BucketMetricCard({
  metric,
}: {
  metric: Extract<FirmHygieneMetric, { kind: "buckets" }>;
}) {
  return (
    <HygieneShell title={metric.title}>
      <div className="mt-2 space-y-1.5">
        {metric.buckets.map((bucket) => (
          <div key={bucket.label}>
            <div className="flex items-baseline justify-between gap-3 text-[11px]">
              <span style={{ color: "var(--text-2)" }}>{bucket.label}</span>
              <span className="tabular shrink-0" style={{ color: "var(--text-1)" }}>
                <span className="font-semibold">{formatCount(bucket.count)}</span>
                <span className="ml-2" style={{ color: "var(--text-2)" }}>
                  {formatPct(bucket.sharePct)}
                </span>
              </span>
            </div>
            <div
              className="mt-0.5 h-1 overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--line)" }}
              aria-hidden
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, bucket.sharePct))}%`,
                  backgroundColor: "var(--lks-accent)",
                  opacity: 0.75,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </HygieneShell>
  );
}

function RateMetricCard({
  metric,
}: {
  metric: Extract<FirmHygieneMetric, { kind: "rate" }>;
}) {
  return (
    <HygieneShell title={metric.title}>
      {metric.formula ? (
        <div
          className="mt-0.5 font-mono text-[9px] leading-snug"
          style={{ color: "var(--text-2)", opacity: 0.85 }}
        >
          {metric.formula}
        </div>
      ) : null}
      <div
        className="tabular mt-2 text-[22px] font-bold leading-none"
        style={{ color: "var(--text-1)" }}
      >
        {formatPct(metric.valuePct)}
      </div>
      <div
        className="mt-1 h-1 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--line)" }}
        aria-hidden
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, metric.valuePct))}%`,
            backgroundColor: "var(--lks-accent)",
            opacity: 0.75,
          }}
        />
      </div>
      {metric.detail ? (
        <div className="mt-1.5 text-[10px] leading-snug" style={{ color: "var(--text-2)" }}>
          {metric.detail}
        </div>
      ) : null}
    </HygieneShell>
  );
}

export default function HygieneMetricsPanel({
  metrics,
  defaultOpen = false,
}: HygieneMetricsPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  if (metrics.length === 0) return null;

  const lines = summaryLines(metrics);

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-start gap-2 rounded-[var(--radius)] px-3 py-2 text-left transition-opacity hover:opacity-80"
        style={{
          backgroundColor: "var(--surface-2)",
          border: "1px solid var(--line)",
          color: "var(--text-1)",
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-2)" }}
          >
            Matter Hygiene
          </span>
          {!open && (
            <ul className="flex flex-col gap-0.5">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className="flex items-baseline justify-between gap-2 text-[11px]"
                >
                  <span className="truncate" style={{ color: "var(--text-2)" }}>
                    {l.label}
                  </span>
                  <span
                    className="tabular shrink-0 font-semibold"
                    style={{ color: "var(--text-1)" }}
                  >
                    {l.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ChevronDown
          size={14}
          className="mt-0.5 shrink-0 transition-transform duration-200"
          style={{
            color: "var(--text-2)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="flex flex-wrap items-stretch justify-end gap-3"
      >
        {metrics.map((metric) =>
          metric.kind === "buckets" ? (
            <BucketMetricCard key={metric.id} metric={metric} />
          ) : (
            <RateMetricCard key={metric.id} metric={metric} />
          ),
        )}
      </div>
    </div>
  );
}
