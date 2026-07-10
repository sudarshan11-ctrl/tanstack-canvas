import type { RAGStatus } from "@/types";
import { useRagColors } from "@/hooks/useThemeTokens";

const SIZES = {
  sm: { d: 64, stroke: 6, text: "text-base" },
  md: { d: 96, stroke: 8, text: "text-2xl" },
  lg: { d: 144, stroke: 12, text: "text-4xl" },
} as const;

export default function LPIDial({
  score,
  status,
  size = "md",
}: {
  score: number;
  status: RAGStatus;
  size?: keyof typeof SIZES;
}) {
  const ragColors = useRagColors();
  const { d, stroke, text } = SIZES[size];
  const r = (d - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c * (1 - clamped / 100);

  const color =
    status === "green"
      ? ragColors.green
      : status === "amber"
        ? ragColors.amber
        : status === "red"
          ? ragColors.red
          : ragColors.na;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: d, height: d }}
    >
      <svg width={d} height={d} className="-rotate-90">
        {/* Track ring */}
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          stroke="var(--line)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Arc */}
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div
        className={`absolute font-mono font-bold tabular ${text}`}
        style={{ color }}
      >
        {Math.round(clamped)}
      </div>
    </div>
  );
}
