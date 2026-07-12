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

  /** Red warning styling for missing timesheet / similar alerts */
  hygieneTone?: "default" | "warning";

  /** Team roll-up hygiene (managers with >1 direct reports) */
  teamHygieneNote?: string;

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
  hygieneTone = "default",
  teamHygieneNote,
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
      className="w-full min-w-0 overflow-hidden rounded-[var(--radius)]"
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
          className="h-0.5 w-full"
          style={{
            background: "linear-gradient(90deg, var(--brand-ink) 0%, var(--lks-accent) 100%)",
          }}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        {/* Top row: identity left, stats right */}
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
          {/* Identity zone — left */}
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {/* Initials avatar */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              style={{
                backgroundColor: "color-mix(in srgb, var(--lks-accent) 15%, transparent)",
                color: "var(--lks-accent)",
                border: `2px solid color-mix(in srgb, var(--lks-accent) 30%, transparent)`,
              }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                {eyebrow}
              </div>
              <div
                className="font-display mt-0.5 break-words text-xl leading-tight sm:text-2xl lg:text-[1.75rem]"
                style={{ color: "var(--text-1)" }}
              >
                {name}
              </div>
              {chips && chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
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

          {/* Stats — top right */}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 md:justify-end">
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
                    className="mt-1 text-[0.625rem] uppercase tracking-wide"
                    style={{ color: "var(--text-2)" }}
                  >
                    {s.label}
                  </span>
                  {s.sub && (
                    <span
                      className="mt-0.5 text-[0.5625rem] leading-tight"
                      style={{ color: "var(--text-2)", opacity: 0.7 }}
                    >
                      {s.sub}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom row: hygiene left, LPI + sparkline right */}
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
          <div className="min-w-0">
            {hygieneMetrics && hygieneMetrics.length > 0 && (
              <HygieneMetricsPanel metrics={hygieneMetrics} />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
            {sparklineData && sparklineData.length > 1 && (
              <div className="hidden h-20 w-32 sm:block" aria-hidden>
                <Sparkline data={sparklineData} color={ragColor} height={80} />
              </div>
            )}
            <div className="flex flex-col items-center">
              <LPIDial score={lpi} status={rag} size="lg" />
              <div
                className="mt-1 text-center text-[0.625rem] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-2)" }}
              >
                LPI
              </div>
              {(hygieneNote || teamHygieneNote) ? (
                <div className="mt-2 max-w-[15rem] space-y-1.5 text-center">
                  {hygieneNote ? (
                    <div
                      className="text-xs font-medium leading-snug"
                      style={{
                        color:
                          hygieneTone === "warning"
                            ? "var(--rag-red)"
                            : "var(--text-1)",
                        opacity: hygieneTone === "warning" ? 1 : 0.85,
                        fontWeight: hygieneTone === "warning" ? 600 : 500,
                      }}
                    >
                      {hygieneNote}
                    </div>
                  ) : null}
                  {teamHygieneNote ? (
                    <div
                      className="text-xs font-medium leading-snug"
                      style={{ color: "var(--text-1)", opacity: 0.85 }}
                    >
                      {teamHygieneNote}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>




      {/* Alert bar — firm landing */}
      {alert && (
        <div
          className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5 sm:px-6"
          style={{
            backgroundColor: "color-mix(in srgb, var(--rag-red) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--rag-red) 20%, transparent)",
          }}
        >
          <AlertCircle size={14} className="shrink-0" style={{ color: "var(--rag-red)" }} />
          {alert.href ? (
            <Link
              to={alert.href as never}
              className="min-w-0 break-words text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--rag-red)" }}
            >
              {alert.message}
              <ChevronRight size={12} className="ml-1 inline-block" />
            </Link>
          ) : (
            <span className="min-w-0 break-words text-xs font-medium" style={{ color: "var(--rag-red)" }}>
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
