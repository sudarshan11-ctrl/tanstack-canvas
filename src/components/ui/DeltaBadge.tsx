import { formatDelta } from "@/utils/format";
import { RAG_FG, RAG_BG } from "./rag-colors";

export interface DeltaBadgeProps {
  delta: number | null;
  unit?: string;
  lowerIsBetter?: boolean;
}

export default function DeltaBadge({
  delta,
  unit = "%",
  lowerIsBetter = false,
}: DeltaBadgeProps) {
  if (delta === null || delta === 0 || !Number.isFinite(delta)) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ color: "var(--text-2)", backgroundColor: "var(--surface-2)" }}
      >
        — {unit && unit !== "%" ? unit : ""}
      </span>
    );
  }

  const favourable = lowerIsBetter ? delta < 0 : delta > 0;
  const tone: "green" | "red" = favourable ? "green" : "red";
  const arrow = delta > 0 ? "\u2191" : "\u2193";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ color: RAG_FG[tone], backgroundColor: RAG_BG[tone] }}
    >
      <span>{arrow}</span>
      <span>{formatDelta(delta, unit)}</span>
    </span>
  );
}