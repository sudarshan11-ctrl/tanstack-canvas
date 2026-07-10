import type { MetricArea } from "@/types";
import { BSC_COLOR, BSC_LABEL, type BscArea, bscOf, bscLevel } from "@/utils/bsc";
import { useThemeTokens } from "@/hooks/useThemeTokens";

export interface CompetencyWheelProps {
  areaScores: Record<MetricArea, number>;
  size?: number;
}

const ORDER: BscArea[] = ["financial", "client", "people", "leadership"];

export default function CompetencyWheel({ areaScores, size = 240 }: CompetencyWheelProps) {
  const { getToken } = useThemeTokens();
  const lineColor = getToken("--line") || "#e4e6ea";
  const textMuted = getToken("--text-2") || "#6e7276";
  const textPrimary = getToken("--text-1") || "#141414";

  const buckets: Record<BscArea, number[]> = {
    financial: [],
    client: [],
    people: [],
    leadership: [],
  };
  (Object.keys(areaScores) as MetricArea[]).forEach((a) => {
    buckets[bscOf(a)].push(areaScores[a]);
  });
  const bscScore: Record<BscArea, number> = {
    financial: avg(buckets.financial),
    client: avg(buckets.client),
    people: avg(buckets.people),
    leadership: avg(buckets.leadership),
  };

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <circle
            key={lvl}
            cx={cx}
            cy={cy}
            r={(r * lvl) / 5}
            fill="none"
            stroke={lineColor}
            strokeWidth={lvl === 5 ? 1.2 : 0.6}
          />
        ))}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={lineColor} strokeWidth={0.5} />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={lineColor} strokeWidth={0.5} />
        {ORDER.map((bsc, i) => {
          const lvl = bscLevel(bscScore[bsc]);
          const radius = (r * lvl) / 5;
          const start = -Math.PI / 2 + (i * Math.PI) / 2;
          const end = start + Math.PI / 2;
          const x1 = cx + radius * Math.cos(start);
          const y1 = cy + radius * Math.sin(start);
          const x2 = cx + radius * Math.cos(end);
          const y2 = cy + radius * Math.sin(end);
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
          return (
            <g key={bsc}>
              <path
                d={path}
                fill={BSC_COLOR[bsc]}
                fillOpacity={0.35}
                stroke={BSC_COLOR[bsc]}
                strokeWidth={1.5}
              />
              <text
                x={cx + (r + 14) * Math.cos((start + end) / 2)}
                y={cy + (r + 14) * Math.sin((start + end) / 2)}
                fontSize={9}
                fontWeight={600}
                fill={textMuted}
                textAnchor="middle"
                dy="0.32em"
              >
                L{lvl}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={3} fill={textPrimary} />
      </svg>
      <div className="flex flex-col gap-1.5 text-[11px]">
        {ORDER.map((bsc) => {
          const lvl = bscLevel(bscScore[bsc]);
          return (
            <div key={bsc} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: BSC_COLOR[bsc] }}
              />
              <span className="font-medium" style={{ color: "var(--text-1)" }}>
                {BSC_LABEL[bsc]}
              </span>
              <span className="tabular ml-auto font-mono" style={{ color: "var(--text-2)" }}>
                L{lvl} · {Math.round(bscScore[bsc])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
