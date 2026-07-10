import type { RAGStatus } from "@/types";
import LPIDial from "@/components/ui/LPIDial";
import MatchCentreStrap, {
  type MatchCentreStrapProps,
} from "@/components/ipl/MatchCentreStrap";
import Sparkline from "@/components/ui/Sparkline";
import HygieneMetricsPanel from "@/components/ui/HygieneMetricsPanel";
import type { FirmHygieneMetric } from "@/types/hygiene";
import { useThemeStore } from "@/store/themeStore";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type { FirmHygieneMetric };

export interface HeroStat {
  label: string;
  value: string | number;
  sub?: string;
}

export interface HeroAlert {
  message: string;
  href?: string;
}

export interface HeroHeaderProps {
  /** Identity zone */
  initials: string;
  eyebrow: string;
  name: string;
  chips?: string[];

  /** Score zone */
  lpi: number;
  rag: RAGStatus;
  sparklineData?: number[];

  /** Bento-band stats (shown in bento theme) */
  stats?: HeroStat[];

  /** MatchCentreStrap footer */
  strap: MatchCentreStrapProps;

  /** Top-level alert (firm landing) */
  alert?: HeroAlert;

  /** Non-scoring hygiene context shown under the LPI dial (person views) */
  hygieneNote?: string;

  /** Firm-level hygiene metrics shown beside the LPI dial */
  hygieneMetrics?: FirmHygieneMetric[];
}

export default function HeroHeader({
  initials,
  eyebrow,
  name,
  chips,
  lpi,
  rag,
  sparklineData,
  stats,
  strap,
  alert,
  hygieneNote,
  hygieneMetrics,
}: HeroHeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const isBento = theme === "bento";

  const ragColor =
    rag === "green"
      ? "var(--rag-green)"
      : rag === "amber"
        ? "var(--rag-amber)"
        : rag === "red"
          ? "var(--rag-red)"
          : "var(--text-2)";

  return (
    <div
      className="overflow-hidden rounded-[var(--radius)]"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow:
          isBento
            ? "0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06)"
            : undefined,
      }}
    >
      {/* Top gradient accent — bento only */}
      {isBento && (
        <div
          className="h-[3px] w-full"
          style={{
            background: "linear-gradient(90deg, var(--brand-ink) 0%, var(--lks-accent) 100%)",
          }}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {/* Top row — identity + hygiene + stats */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:gap-6">
          {/* Identity zone — left */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* Initials avatar */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold sm:h-14 sm:w-14 sm:text-lg"
              style={{
                backgroundColor: "color-mix(in srgb, var(--lks-accent) 15%, transparent)",
                color: "var(--lks-accent)",
                border: `2px solid color-mix(in srgb, var(--lks-accent) 30%, transparent)`,
              }}
            >
              {initials}
            </div>

            <div className="min-w-0">
              <div
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                {eyebrow}
              </div>
              <div
                className="font-display mt-0.5 truncate text-xl leading-tight sm:text-2xl lg:text-[1.625rem]"
                style={{ color: "var(--text-1)" }}
              >
                {name}
              </div>
              {chips && chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        color: "var(--text-2)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Spacer — only when the row is flex (sm+) */}
          <div className="hidden sm:block sm:flex-1" />

          {/* Hygiene panel */}
          {hygieneMetrics && hygieneMetrics.length > 0 && (
            <div className="col-span-2 min-w-0 sm:col-auto sm:shrink-0">
              <HygieneMetricsPanel metrics={hygieneMetrics} />
            </div>
          )}

          {/* Stats band */}
          {stats && stats.length > 0 && (
            <div className="col-span-2 flex flex-wrap gap-2 sm:col-auto sm:gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex min-w-[4.5rem] flex-1 flex-col items-center rounded-[var(--radius)] p-3 text-center sm:flex-none"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <span
                    className="tabular text-xl font-bold leading-none sm:text-2xl"
                    style={{ color: "var(--text-1)" }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="mt-1 text-[10px] uppercase tracking-wide"
                    style={{ color: "var(--text-2)" }}
                  >
                    {s.label}
                  </span>
                  {s.sub && (
                    <span className="mt-0.5 text-[9px]" style={{ color: "var(--text-2)", opacity: 0.7 }}>
                      {s.sub}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom row — sparkline + LPI dial, right-aligned */}
        <div className="flex flex-wrap items-center justify-end gap-4">
          {sparklineData && sparklineData.length > 1 && (
            <div
              className="hidden min-w-0 flex-1 sm:block sm:max-w-[10rem]"
              style={{ height: "5rem" }}
              aria-hidden
            >
              <Sparkline data={sparklineData} color={ragColor} height="100%" />
            </div>
          )}
          <div className="flex shrink-0 flex-col items-center">
            <LPIDial score={lpi} status={rag} size="lg" />
            <div
              className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-2)" }}
            >
              LPI
            </div>
            {hygieneNote ? (
              <div
                className="mt-2 max-w-[14rem] text-center text-[11px] font-medium leading-snug"
                style={{ color: "var(--text-1)", opacity: 0.8 }}
              >
                {hygieneNote}
              </div>
            ) : null}
          </div>
        </div>
      </div>


      {/* Alert bar — firm landing */}
      {alert && (
        <div
          className="flex items-center gap-2 border-t px-6 py-2.5"
          style={{
            backgroundColor: "color-mix(in srgb, var(--rag-red) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--rag-red) 20%, transparent)",
          }}
        >
          <AlertCircle size={14} style={{ color: "var(--rag-red)", flexShrink: 0 }} />
          {alert.href ? (
            <Link
              to={alert.href as never}
              className="text-[12px] font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--rag-red)" }}
            >
              {alert.message}
              <ChevronRight size={12} className="ml-1 inline-block" />
            </Link>
          ) : (
            <span className="text-[12px] font-medium" style={{ color: "var(--rag-red)" }}>
              {alert.message}
            </span>
          )}
        </div>
      )}

      {/* MatchCentreStrap — full-width footer band */}
      <MatchCentreStrap {...strap} />
    </div>
  );
}
