import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export interface SparklineProps {
  data: number[];
  color?: string;
  /** Accepts a number (px) or any CSS length such as "100%", "5rem". */
  height?: number | string;
}

export default function Sparkline({
  data,
  color = "#475569",
  height = 32,
}: SparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
