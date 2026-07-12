import { useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import SectionLabel from "@/components/ui/SectionLabel";
import HeroHeader from "@/components/ui/HeroHeader";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PrimaryMetricGrid from "@/components/metrics/PrimaryMetricGrid";
import TeamTable from "@/components/league/TeamTable";
import { useDashboardStore } from "@/store/dashboardStore";
import { personById, epOfPartner, partnersOfPartner, directAssociatesOfPartner } from "@/utils/hierarchy";
import { rollupFor, primariesFor } from "@/utils/rollup";
import { lpiToRAG } from "@/utils/rag";
import { personTimesheetHygiene } from "@/utils/timesheetDelay";
import { AlertTriangle } from "lucide-react";

const TARGET_PARTNER = 80;

export default function PartnerView() {
  const { epId, partnerId } = useParams({
    from: "/_authenticated/ep/$epId/p/$partnerId",
  });
  const personScores = useDashboardStore((s) => s.personScores);
  const partner = personById(partnerId);
  const ep = epOfPartner(partnerId) ?? personById(epId);
  const r = useMemo(
    () => rollupFor(partnerId, personScores),
    [partnerId, personScores],
  );
  const teamLeads = useMemo(
    () => (partner ? partnersOfPartner(partner.id) : []),
    [partner],
  );
  const associates = useMemo(
    () => (partner ? directAssociatesOfPartner(partner.id) : []),
    [partner],
  );

  // Needs-attention: associates with red primaries that are dragging Team PI
  const needsAttention = useMemo(() => {
    if (!partner) return [];
    return associates
      .map((a) => {
        const ps = personScores.find((s) => s.personId === a.id);
        const reds = ps?.metricValues.filter((mv) => mv.rag === "red") ?? [];
        return { person: a, redCount: reds.length, topMetric: reds[0]?.metricId };
      })
      .filter((x) => x.redCount > 0)
      .sort((a, b) => b.redCount - a.redCount)
      .slice(0, 3);
  }, [associates, partner, personScores]);

  if (!partner || !ep) {
    return (
      <div className="p-4">
        <Breadcrumbs crumbs={[{ label: "Not found" }]} />
        <div className="mt-3 text-[13px]" style={{ color: "var(--text-2)" }}>
          Partner not found.
        </div>
      </div>
    );
  }

  const prims = primariesFor(partnerId, personScores);
  const sparkline = r.trend.length > 1 ? r.trend : undefined;

  const timesheetHygiene = personTimesheetHygiene(partner.id);

  const heroStats = [
    { label: "Self PI", value: Math.round(r.personLpi) },
    { label: "Team PI", value: Math.round(r.teamLpi) },
    { label: "Team leads", value: teamLeads.length },
    { label: "Associates", value: associates.length },
    { label: "Wickets", value: r.wickets },
  ];

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 p-1">
      <Breadcrumbs
        crumbs={[
          { label: ep.name, to: "/ep/$epId", params: { epId: ep.id } },
          { label: partner.name },
        ]}
      />

      <HeroHeader
        initials={partner.initials}
        eyebrow={`Partner · reports to ${ep.name}`}
        name={partner.name}
        chips={[
          partner.subPractice ?? "",
          partner.office ?? "",
          teamLeads.length > 0
            ? `${teamLeads.length} team leads · ${associates.length} associates`
            : `${associates.length} associates`,
        ].filter(Boolean)}
        lpi={Math.round(r.teamLpi)}
        rag={lpiToRAG(r.teamLpi)}
        sparklineData={sparkline}
        stats={heroStats}
        strap={{
          innings: r.teamLpi,
          required: TARGET_PARTNER,
          projection: r.teamLpi + 2,
          wickets: r.wickets,
        }}
        hygieneNote={timesheetHygiene.note}
        hygieneTone={timesheetHygiene.tone}
        teamHygieneNote={timesheetHygiene.teamNote}
      />

      {/* Needs-attention coaching callout */}
      {needsAttention.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-[var(--radius)] border p-4"
          style={{
            backgroundColor: "color-mix(in srgb, var(--rag-amber) 8%, var(--surface))",
            borderColor: "color-mix(in srgb, var(--rag-amber) 25%, var(--line))",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "var(--rag-amber)", flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <div
              className="text-[12px] font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              Needs attention — associates dragging Team PI
            </div>
            <div className="mt-1 flex flex-wrap gap-3">
              {needsAttention.map(({ person, redCount, topMetric }) => (
                <span
                  key={person.id}
                  className="text-[12px]"
                  style={{ color: "var(--text-2)" }}
                >
                  <span style={{ color: "var(--text-1)", fontWeight: 500 }}>
                    {person.name}
                  </span>{" "}
                  — {redCount} red{redCount !== 1 ? "s" : ""}
                  {topMetric && (
                    <span className="font-metric-id ml-1 opacity-70">({topMetric})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <section>
        <SectionLabel>Partner primary metrics · CRR / RRR</SectionLabel>
        <PrimaryMetricGrid
          personId={partner.id}
          allScores={personScores}
          buildLink={(metricId) => ({
            to: "/metric/$id",
            params: { id: metricId },
            search: { from: partner.id },
          })}
        />
      </section>

      {teamLeads.length > 0 ? (
        <section>
          <SectionLabel>
            Team leads · {teamLeads.length} partners · click to drill in
          </SectionLabel>
          <TeamTable
            members={teamLeads}
            scores={personScores}
            memberLabel="Partner"
            buildLink={(member) => ({
              to: "/ep/$epId/p/$partnerId",
              params: { epId: ep.id, partnerId: member.id },
            })}
          />
        </section>
      ) : null}

      <section>
        <SectionLabel>
          Associate squad · {associates.length} associates · click to drill in
        </SectionLabel>
        <TeamTable
          members={associates}
          scores={personScores}
          memberLabel="Associate"
          buildLink={(member) => ({
            to: "/ep/$epId/p/$partnerId/a/$associateId",
            params: {
              epId: ep.id,
              partnerId: partner.id,
              associateId: member.id,
            },
          })}
        />
      </section>
    </div>
  );
}
