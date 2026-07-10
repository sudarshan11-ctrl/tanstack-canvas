import { TriangleAlert, CheckCircle } from "lucide-react";
import type { CausalAlert } from "@/types";
import { Card } from "@/components/ui/card";

export interface CausalAlertTrayProps {
  alerts: CausalAlert[];
  onDrillDown?: (metricId: string) => void;
}

export default function CausalAlertTray({
  alerts,
  onDrillDown,
}: CausalAlertTrayProps) {
  return (
    <Card className="w-full" padding="md">
      <div className="mb-3 flex items-center gap-2">
        <TriangleAlert size={14} style={{ color: "var(--rag-red)" }} />
        <span
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-2)" }}
        >
          Red-flag secondaries — top 3 causal alerts
        </span>
      </div>

      {alerts.length === 0 ? (
        <div
          className="flex items-center gap-2 text-[13px]"
          style={{ color: "var(--text-2)" }}
        >
          <CheckCircle size={14} style={{ color: "var(--rag-green)" }} />
          No critical alerts this period.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.slice(0, 3).map((alert, i) => {
            const clickable = !!onDrillDown;
            const Wrapper = clickable ? "button" : "div";
            return (
              <Wrapper
                key={`${alert.primaryId}-${alert.secondaryId}-${i}`}
                onClick={
                  clickable ? () => onDrillDown!(alert.primaryId) : undefined
                }
                className={
                  "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors" +
                  (clickable ? " cursor-pointer" : "")
                }
                style={{
                  backgroundColor: "color-mix(in srgb, var(--rag-red) 8%, var(--surface))",
                  borderColor: "color-mix(in srgb, var(--rag-red) 25%, var(--line))",
                }}
                onMouseEnter={
                  clickable
                    ? (e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "color-mix(in srgb, var(--rag-red) 14%, var(--surface))";
                      }
                    : undefined
                }
                onMouseLeave={
                  clickable
                    ? (e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "color-mix(in srgb, var(--rag-red) 8%, var(--surface))";
                      }
                    : undefined
                }
              >
                <TriangleAlert
                  size={14}
                  style={{ color: "var(--rag-red)", flexShrink: 0 }}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "color-mix(in srgb, var(--rag-red) 30%, var(--line))",
                        color: "var(--rag-red)",
                      }}
                    >
                      <span className="font-mono">{alert.secondaryId}</span>
                      <span>{alert.secondaryName}</span>
                      <span>↓</span>
                    </span>
                    <span className="text-[12px]" style={{ color: "var(--text-2)" }}>
                      →
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: "var(--rag-red)",
                        color: "var(--primary-foreground)",
                      }}
                    >
                      <span className="font-mono">{alert.primaryId}</span>
                      <span>{alert.primaryName}</span>
                      <span>↓</span>
                    </span>
                  </div>
                  <div
                    className="mt-1 text-[11px]"
                    style={{ color: "var(--text-2)", lineHeight: 1.4 }}
                  >
                    {alert.description}
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </Card>
  );
}
