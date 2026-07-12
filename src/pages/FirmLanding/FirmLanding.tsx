import { useMemo } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import HeroHeader from "@/components/ui/HeroHeader";
import PracticeHeadLeagueTable from "@/components/league/PracticeHeadLeagueTable";
import PlayerOfTheMatch from "@/components/ipl/PlayerOfTheMatch";
import FirmMetricsExplorer from "@/components/metrics/FirmMetricsExplorer";
import { useDashboardStore } from "@/store/dashboardStore";
import { epsOfFirm } from "@/utils/hierarchy";
import { lpiToRAG } from "@/utils/rag";
import { playerOfTheMatchTags } from "@/utils/playerOfTheMatch";
import { rollupFor } from "@/utils/rollup";
import { ReplicaConnectivityButton } from "@/components/admin/ReplicaConnectivityButton";
import { snapshotInfo } from "@/data/snapshotMetricValues";
import { formatPeriod } from "@/utils/format";
import { firmMatterCreationTime } from "@/utils/matterCreationTime";
import {
  firmTaggingCoverage,
  firmTaggingHygiene,
} from "@/utils/emailTaggingHygiene";
import type { PersonScore } from "@/types";

const CURRENT_PERIOD = formatPeriod(snapshotInfo.period);
const TARGET_LPI = 80; // Partners target

function buildFirmAlert(
  personScores: PersonScore[],
): { message: string; href?: string } | undefined {
  const redMetrics = personScores.flatMap((p) =>
    p.metricValues.filter((mv) => mv.rag === "red"),
  );
  if (redMetrics.length === 0) return undefined;

  const byMetric = new Map<string, number>();
  for (const mv of redMetrics) {
    byMetric.set(mv.metricId, (byMetric.get(mv.metricId) ?? 0) + 1);
  }
  const worst = [...byMetric.entries()].sort((a, b) => b[1] - a[1])[0];
  const worstId = worst?.[0] ?? "";
  return {
    message: `${redMetrics.length} primary metrics in red — most affected: ${worstId}`,
    href: worstId ? `/metric/${worstId}` : undefined,
  };
}

export default function FirmLanding() {
  const personScores = useDashboardStore((s) => s.personScores);
  const eps = useMemo(() => epsOfFirm(), []);

  const firmLpi = Math.round(
    eps.reduce((s, ep) => s + rollupFor(ep.id, personScores).teamLpi, 0) /
      Math.max(1, eps.length),
  );
  const firmRag = lpiToRAG(firmLpi);

  const wickets = personScores.reduce(
    (s, p) => s + p.metricValues.filter((mv) => mv.rag === "red").length,
    0,
  );

  const projection = Math.round(firmLpi * 1.04);
  const required = TARGET_LPI;
  const need = Math.max(0, required - firmLpi);

  const tags = useMemo(() => playerOfTheMatchTags(personScores), [personScores]);

  const sparklineData = useMemo(
    () =>
      eps
        .slice(0, 8)
        .map((ep) => rollupFor(ep.id, personScores).teamLpi)
        .filter((v) => v > 0),
    [eps, personScores],
  );

  const alert = useMemo(() => buildFirmAlert(personScores), [personScores]);

  const firmStats = [
    { label: "Squads", value: eps.length },
    { label: "Lawyers", value: personScores.length },
    { label: "Wickets", value: wickets, sub: "red primaries" },
  ];

  const hygieneMetrics = useMemo(
    () => [
      firmMatterCreationTime(),
      firmTaggingCoverage(),
      firmTaggingHygiene(),
    ],
    [],
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5">
      {/* Admin tool */}
      <div className="flex justify-end">
        <ReplicaConnectivityButton />
      </div>

      {/* Hero header — full width */}
      <HeroHeader
        initials="LKS"
        eyebrow={`Firm Performance · ${CURRENT_PERIOD}`}
        name="Lakshmikumaran and Sridharan"
        chips={[`${eps.length} practice-head squads`, `${personScores.length} lawyers`]}
        lpi={firmLpi}
        rag={firmRag}
        sparklineData={sparklineData}
        stats={firmStats}
        hygieneMetrics={hygieneMetrics}
        strap={{
          innings: firmLpi,
          required,
          projection,
          wickets,
        }}
        alert={alert}
      />

      {/* Bento grid — league table 3/4 + Player of the Match 1/4 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Practice Head league table — 3/4 width */}
        <section className="min-w-0 lg:col-span-3">
          <SectionLabel>Practice Head league · this period</SectionLabel>
          <PracticeHeadLeagueTable eps={eps} scores={personScores} />
        </section>

        {/* Player of the Match — 1/4 width */}
        <section className="min-w-0 lg:col-span-1">
          <SectionLabel>Player of the match · this period</SectionLabel>
          <PlayerOfTheMatch tags={tags} />
        </section>
      </div>

      {/* Metrics explorer — full width */}
      <section className="min-w-0">
        <SectionLabel>
          All firm metrics · filter by level · drill into any parameter
        </SectionLabel>
        <FirmMetricsExplorer scores={personScores} />
      </section>
    </div>
  );
}

