import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { MetricValue, Role } from "@/types";
import { causalLinks } from "@/data/mockCausalLinks";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { isLowerIsBetter } from "@/utils/metricDirection";

export interface WhyIsThisRedProps {
  values: MetricValue[];
  role: Role;
}

const nameOf = (id: string) =>
  mockMetricDefinitions.find((m) => m.id === id)?.name ?? id;

function favourability(mv: MetricValue): number {
  // 0..1 higher = better. Uses deltaVsTarget signed appropriately.
  const d = mv.deltaVsTarget ?? 0;
  const score = isLowerIsBetter(mv.metricId) ? -d : d;
  // Map -50..+50 → 0..1
  return Math.max(0, Math.min(1, (score + 50) / 100));
}

export default function WhyIsThisRed({ values, role }: WhyIsThisRedProps) {
  const byId = new Map(values.map((v) => [v.metricId, v]));

  // Score each secondary by its causal degree × favourability deviation
  const scored: Array<{ mv: MetricValue; score: number; drives: string[] }> = [];
  for (const mv of values) {
    const outs = causalLinks.filter(
      (l) => l.fromId === mv.metricId && l.applicableRoles.includes(role),
    );
    if (!outs.length) continue;
    const fav = favourability(mv);
    const weight = outs.length;
    scored.push({ mv, score: (fav - 0.5) * weight, drives: outs.map((o) => o.toId) });
  }
  scored.sort((a, b) => b.score - a.score);
  const helping = scored.slice(0, 3);
  const hurting = scored.slice(-3).reverse();

  return (
    <div className="rounded-lg border bg-white p-4" style={{ borderColor: "#e2e8f0" }}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Why is my Performance Index here?
      </div>
      <div className="grid grid-cols-2 gap-4">
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
            <TrendingUp size={12} /> Top 3 helping
          </div>
          <ul className="space-y-2">
            {helping.map((h) => (
              <li key={h.mv.metricId}>
                <Link
                  to="/metric/$id"
                  params={{ id: h.mv.metricId }}
                  className="block rounded border border-green-100 bg-green-50 px-2 py-1.5 hover:bg-green-100"
                >
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="font-mono text-[10px] text-slate-500">{h.mv.metricId}</span>
                    <span className="flex-1 truncate text-slate-800">{nameOf(h.mv.metricId)}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    Drives → {h.drives.slice(0, 3).join(", ")}{h.drives.length > 3 ? "…" : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-red-700">
            <TrendingDown size={12} /> Top 3 hurting
          </div>
          <ul className="space-y-2">
            {hurting.map((h) => (
              <li key={h.mv.metricId}>
                <Link
                  to="/metric/$id"
                  params={{ id: h.mv.metricId }}
                  className="block rounded border border-red-100 bg-red-50 px-2 py-1.5 hover:bg-red-100"
                >
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="font-mono text-[10px] text-slate-500">{h.mv.metricId}</span>
                    <span className="flex-1 truncate text-slate-800">{nameOf(h.mv.metricId)}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    Drives → {h.drives.slice(0, 3).join(", ")}{h.drives.length > 3 ? "…" : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}