import { useMemo } from "react";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/SectionLabel";
import LPIDial from "@/components/ui/LPIDial";
import LeagueTable from "@/components/ipl/LeagueTable";
import PlayerOfTheMatch from "@/components/ipl/PlayerOfTheMatch";
import MatchCentreStrap from "@/components/ipl/MatchCentreStrap";
import CausalAlertTray from "@/components/metrics/CausalAlertTray";
import { useDashboardStore } from "@/store/dashboardStore";
import { buildStandings } from "@/utils/squad";
import { lpiToRAG } from "@/utils/rag";
import { playerOfTheMatchTags } from "@/utils/playerOfTheMatch";
import { bscOf, BSC_LABEL, BSC_COLOR, bscLevel, type BscArea } from "@/utils/bsc";
import type { MetricArea } from "@/types";
import { snapshotInfo } from "@/data/snapshotMetricValues";
import { formatPeriod, formatSyncedAt } from "@/utils/format";

const BSC_ORDER: BscArea[] = ["financial", "client", "people", "leadership"];

const LAST_SYNC = formatSyncedAt(snapshotInfo.fetchedAt);
const CURRENT_PERIOD = formatPeriod(snapshotInfo.period);

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

export default function FirmCommand() {
  const personScores = useDashboardStore((s) => s.personScores);

  const firmLpi = Math.round(avg(personScores.map((p) => p.lpi)));
  const firmRag = lpiToRAG(firmLpi);
  const wickets = personScores.reduce(
    (s, p) => s + p.metricValues.filter((mv) => mv.rag === "red").length, 0,
  );

  const standings = useMemo(() => buildStandings(personScores), [personScores]);
  const tags = useMemo(() => playerOfTheMatchTags(personScores), [personScores]);
  const firmAlerts = personScores.flatMap((p) => p.alerts).slice(0, 4);

  // BSC heatmap: 6 squads × 4 BSC quadrants
  const heatmap = standings.map((row) => {
    const sums: Record<BscArea, number[]> = { financial: [], client: [], people: [], leadership: [] };
    row.squad.members.forEach((m) => {
      if (!m.score) return;
      (Object.keys(m.score.areaScores) as MetricArea[]).forEach((a) => {
        sums[bscOf(a)].push(m.score!.areaScores[a]);
      });
    });
    return {
      captain: row.squad.captain,
      values: {
        financial: avg(sums.financial),
        client: avg(sums.client),
        people: avg(sums.people),
        leadership: avg(sums.leadership),
      } as Record<BscArea, number>,
    };
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-1">
      {/* HERO */}
      <Card padding="lg">
        <div className="flex flex-wrap items-center gap-8">
          <LPIDial score={firmLpi} status={firmRag} size="lg" />
          <div className="flex-1 min-w-[17.5rem]">
            <div className="text-[12px] uppercase tracking-wider text-slate-500">
              Time Period · {CURRENT_PERIOD} · {LAST_SYNC}
            </div>
            <div className="mt-1 text-[28px] font-semibold leading-tight text-slate-900">
              Firm Performance Index {firmLpi}
            </div>
            <div className="mt-1 text-[14px] text-slate-600">
              6 PH squads · {personScores.length} lawyers · {wickets} primary metrics in red.
            </div>
          </div>
          <div className="min-w-[21.25rem] flex-1">
            <MatchCentreStrap
              innings={firmLpi}
              required={85}
              projection={firmLpi + 3}
              wickets={wickets}
              compact
            />
          </div>
        </div>
      </Card>

      {/* LEAGUE TABLE */}
      <section>
        <SectionLabel>League standings · click a squad to drill in</SectionLabel>
        <LeagueTable standings={standings} />
      </section>

      {/* BSC HEATMAP */}
      <section>
        <SectionLabel>BSC competency heatmap · squad × area</SectionLabel>
        <Card padding="md">
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-1">Squad</th>
                  {BSC_ORDER.map((bsc) => (
                    <th key={bsc} className="px-2 py-1 text-center" style={{ color: BSC_COLOR[bsc] }}>
                      {BSC_LABEL[bsc].split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((h) => (
                  <tr key={h.captain.id} className="border-t" style={{ borderColor: "#f1f5f9" }}>
                    <td className="px-2 py-1.5 font-medium text-slate-700">{h.captain.name}</td>
                    {BSC_ORDER.map((bsc) => {
                      const v = h.values[bsc];
                      const lvl = bscLevel(v);
                      return (
                        <td key={bsc} className="px-2 py-1.5 text-center">
                          <span
                            className="inline-block w-12 rounded px-1 py-0.5 font-mono text-[11px] font-semibold text-white"
                            style={{ backgroundColor: BSC_COLOR[bsc], opacity: 0.4 + (lvl / 5) * 0.6 }}
                          >
                            L{lvl} · {Math.round(v)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* POM + ALERTS */}
      <section>
        <SectionLabel>Player of the match</SectionLabel>
        <PlayerOfTheMatch tags={tags} />
      </section>

      <section>
        <SectionLabel>Firm red flags · causal alerts</SectionLabel>
        <CausalAlertTray alerts={firmAlerts} />
      </section>
    </div>
  );
}