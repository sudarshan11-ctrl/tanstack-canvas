import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/SectionLabel";
import LPIDial from "@/components/ui/LPIDial";
import CompetencyWheel from "@/components/bsc/CompetencyWheel";
import MatchCentreStrap from "@/components/ipl/MatchCentreStrap";
import SquadRoster from "@/components/squad/SquadRoster";
import CausalAlertTray from "@/components/metrics/CausalAlertTray";
import { useDashboardStore } from "@/store/dashboardStore";
import { buildStandings } from "@/utils/squad";
import { runRateFor } from "@/utils/runRate";
import { bandFor, BAND_COLOR, BAND_LABEL } from "@/utils/bsc";

export default function SquadView() {
  const { epId } = useParams({ from: "/_authenticated/squad/$epId" });
  const personScores = useDashboardStore((s) => s.personScores);
  const standings = buildStandings(personScores);
  const row = standings.find((r) => r.squad.captain.id === epId) ?? standings[0];
  const { squad } = row;
  const captainScore = squad.members[0].score;

  const captainPrimaries = captainScore?.metricValues ?? [];
  const topRunRate = captainPrimaries
    .map((mv) => runRateFor(mv))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .filter((r) => squad.leadsIn.includes(r.metricId))[0] ?? null;

  const band = bandFor(row.squadLpi);

  // Aggregate squad alerts
  const squadAlerts = squad.members
    .flatMap((m) => m.score?.alerts ?? [])
    .slice(0, 5);

  return (
    <PageWrapper title="">
      <div className="mx-auto max-w-[1280px] space-y-4 p-2">
        <Link to="/firm" className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-800">
          <ArrowLeft size={14} /> Firm Command
        </Link>

        {/* Captain header */}
        <Card padding="lg">
          <div className="flex flex-wrap items-center gap-6">
            <div
              className="flex items-center justify-center rounded-full text-blue-700"
              style={{ width: 72, height: 72, backgroundColor: "#dbeafe", fontSize: 22, fontWeight: 600 }}
            >
              {squad.captain.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[20px] font-semibold text-slate-900">{squad.captain.name}</div>
              <div className="text-[13px] text-slate-500">{squad.archetype} · {squad.captain.pillar} · {squad.captain.office}</div>
              <div className="mt-2 text-[13px] text-slate-700 italic">"{squad.tagline}"</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Leads firm in:</span>
                {squad.leadsIn.map((m) => (
                  <Link
                    key={m}
                    to="/metric/$id"
                    params={{ id: m }}
                    className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 hover:bg-amber-200"
                  >
                    #{1} · {m}
                  </Link>
                ))}
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{ backgroundColor: BAND_COLOR[band] }}
                >
                  {BAND_LABEL[band]}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <LPIDial score={row.squadLpi} status={captainScore?.rag ?? "na"} size="lg" />
              <span className="text-[11px] text-slate-500">Squad Performance Index</span>
            </div>
          </div>
        </Card>

        {/* Match centre strap (captain personal) */}
        {captainScore ? (
          <MatchCentreStrap
            innings={captainScore.lpi}
            required={85}
            projection={captainScore.lpi + 4}
            wickets={captainScore.metricValues.filter((mv) => mv.rag === "red").length}
            topRunRate={topRunRate}
          />
        ) : null}

        {/* Wheel + roster */}
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card padding="md">
            <SectionLabel>BSC competency wheel — captain</SectionLabel>
            {captainScore ? <CompetencyWheel areaScores={captainScore.areaScores} size={220} /> : null}
          </Card>
          <div className="space-y-3">
            <SectionLabel>Squad roster · {squad.members.length} lawyers</SectionLabel>
            <SquadRoster squad={squad} />
          </div>
        </div>

        {/* Causal alerts for squad */}
        <div>
          <SectionLabel>Squad red flags</SectionLabel>
          <CausalAlertTray alerts={squadAlerts} />
        </div>
      </div>
    </PageWrapper>
  );
}