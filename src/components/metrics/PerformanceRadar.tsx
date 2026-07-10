import type { MetricArea, RAGStatus } from "@/types";
import { RAG_FG } from "@/components/ui/rag-colors";

export interface PerformanceRadarProps {
  current: Record<MetricArea, number>;
  priorYear: Record<MetricArea, number>;
  size?: number;
}

const AXES: { key: MetricArea; label: string }[] = [
  { key: "financial_health", label: "Financial Health" },
  { key: "client_matter", label: "Client & Matter" },
  { key: "people_ops", label: "People & Ops" },
  { key: "growth_pipeline", label: "Growth & Pipeline" },
  { key: "brand_discoverability", label: "Brand & Discoverability" },
];

function scoreToRAG(score: number): RAGStatus {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

function angleFor(i: number, n: number) {
  return (i * 2 * Math.PI) / n - Math.PI / 2;
}

export default function PerformanceRadar({
  current,
  priorYear,
  size = 220,
}: PerformanceRadarProps) {
  const padding = 48;
  const svgSize = size + padding * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = size / 2;
  const n = AXES.length;

  const pointFor = (i: number, score: number) => {
    const a = angleFor(i, n);
    const rr = (r * Math.max(0, Math.min(100, score))) / 100;
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  };

  const polyPoints = (scores: Record<MetricArea, number>) =>
    AXES.map((ax, i) => {
      const p = pointFor(i, scores[ax.key] ?? 0);
      return `${p.x},${p.y}`;
    }).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div style={{ width: "fit-content" }}>
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Grid rings as polygons */}
        {rings.map((f) => (
          <polygon
            key={f}
            points={AXES.map((_, i) => {
              const a = angleFor(i, n);
              return `${cx + r * f * Math.cos(a)},${cy + r * f * Math.sin(a)}`;
            }).join(" ")}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const a = angleFor(i, n);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(a)}
              y2={cy + r * Math.sin(a)}
              stroke="#cbd5e1"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Prior year polygon */}
        <polygon
          points={polyPoints(priorYear)}
          fill="none"
          stroke="#60a5fa"
          strokeOpacity={0.5}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* Current year polygon */}
        <polygon
          points={polyPoints(current)}
          fill="#f59e0b"
          fillOpacity={0.2}
          stroke="#f59e0b"
          strokeWidth={2}
        />

        {/* Current year score dots */}
        {AXES.map((ax, i) => {
          const p = pointFor(i, current[ax.key] ?? 0);
          const rag = scoreToRAG(current[ax.key] ?? 0);
          return <circle key={ax.key} cx={p.x} cy={p.y} r={4} fill={RAG_FG[rag]} />;
        })}

        {/* Axis labels */}
        {AXES.map((ax, i) => {
          const a = angleFor(i, n);
          const lr = r + 12;
          const x = cx + lr * Math.cos(a);
          const y = cy + lr * Math.sin(a);
          const cos = Math.cos(a);
          const anchor =
            Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
          const sin = Math.sin(a);
          const dy = sin < -0.5 ? "-0.2em" : sin > 0.5 ? "0.8em" : "0.32em";
          return (
            <text
              key={ax.key}
              x={x}
              y={y}
              fontSize={11}
              fill="#64748b"
              textAnchor={anchor}
              dy={dy}
            >
              {ax.label}
            </text>
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 11,
          color: "#94a3b8",
          justifyContent: "center",
          marginTop: 4,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          FY26
          <svg width={28} height={8}>
            <circle cx={4} cy={4} r={3} fill="#f59e0b" />
            <line x1={8} y1={4} x2={28} y2={4} stroke="#f59e0b" strokeWidth={2} />
          </svg>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          FY25
          <svg width={28} height={8}>
            <circle cx={4} cy={4} r={3} fill="#60a5fa" fillOpacity={0.5} />
            <line
              x1={8}
              y1={4}
              x2={28}
              y2={4}
              stroke="#60a5fa"
              strokeOpacity={0.5}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}