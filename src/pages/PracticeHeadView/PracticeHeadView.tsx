import { useMemo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import SectionLabel from "@/components/ui/SectionLabel";
import HeroHeader from "@/components/ui/HeroHeader";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PrimaryMetricGrid from "@/components/metrics/PrimaryMetricGrid";
import TeamTable from "@/components/league/TeamTable";
import { useDashboardStore } from "@/store/dashboardStore";
import { personById, partnersOfEp, directAssociatesOfEp } from "@/utils/hierarchy";
import { rollupFor } from "@/utils/rollup";
import { lpiToRAG } from "@/utils/rag";
import { formatTimesheetDelayLabel, timesheetDelayFor } from "@/utils/timesheetDelay";

const TARGET_PH = 85;

export default function PracticeHeadView() {
  const { epId } = useParams({ from: "/_authenticated/ep/$epId" });
  const personScores = useDashboardStore((s) => s.personScores);
  const ep = personById(epId);
  const r = useMemo(() => rollupFor(epId, personScores), [epId, personScores]);
  const partners = useMemo(() => (ep ? partnersOfEp(ep.id) : []), [ep]);
  const directAssociates = useMemo(
    () => (ep ? directAssociatesOfEp(ep.id) : []),
    [ep],
  );

  if (!ep) {
    return (
      <div className="p-4">
        <Breadcrumbs crumbs={[{ label: "Not found" }]} />
        <div
          className="mt-3 text-[13px]"
          style={{ color: "var(--text-2)" }}
        >
          Practice head not found.
        </div>
      </div>
    );
  }

  const sparkline = r.trend.length > 1 ? r.trend : undefined;

  const hygieneNote = (() => {
    const entry = timesheetDelayFor(ep.id);
    return entry ? formatTimesheetDelayLabel(entry) : undefined;
  })();

  const heroStats = [
    { label: "Self PI", value: Math.round(r.personLpi) },
    { label: "Team PI", value: Math.round(r.teamLpi) },
    { label: "Roster", value: r.memberCount },
    { label: "Wickets", value: r.wickets, sub: "red primaries" },
  ];

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 p-1">
      <div className="flex items-center justify-between">
        <Breadcrumbs crumbs={[{ label: ep.name }]} />
        <Link
          to="/verify/$personId"
          params={{ personId: ep.id }}
          className="text-[11px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--lks-accent)" }}
        >
          Verify FY25-26 API →
        </Link>
      </div>

      <HeroHeader
        initials={ep.initials}
        eyebrow="Practice Head Squad"
        name={ep.name}
        chips={[ep.subPractice ?? "", ep.office ?? ""].filter(Boolean)}
        lpi={Math.round(r.teamLpi)}
        rag={lpiToRAG(r.teamLpi)}
        sparklineData={sparkline}
        stats={heroStats}
        strap={{
          innings: r.teamLpi,
          required: TARGET_PH,
          projection: r.teamLpi + 3,
          wickets: r.wickets,
        }}
        hygieneNote={hygieneNote}
      />

      <section>
        <SectionLabel>
          Practice head primary metrics · 10 outcomes with current run-rate vs required run-rate
        </SectionLabel>
        <PrimaryMetricGrid
          personId={ep.id}
          allScores={personScores}
          buildLink={(metricId) => ({
            to: "/metric/$id",
            params: { id: metricId },
            search: { from: ep.id },
          })}
        />
      </section>

      <section>
        <SectionLabel>
          Team leads · {partners.length} partners · click to drill in
        </SectionLabel>
        <TeamTable
          members={partners}
          scores={personScores}
          memberLabel="Partner"
          buildLink={(member) => ({
            to: "/ep/$epId/p/$partnerId",
            params: { epId: ep.id, partnerId: member.id },
          })}
        />
      </section>

      {directAssociates.length > 0 ? (
        <section>
          <SectionLabel>
            Direct reports · {directAssociates.length} lawyers reporting to practice head
          </SectionLabel>
          <TeamTable
            members={directAssociates}
            scores={personScores}
            memberLabel="Associate"
            buildLink={(member) => ({
              to: "/profile/$id",
              params: { id: member.id },
            })}
          />
        </section>
      ) : null}
    </div>
  );
}
