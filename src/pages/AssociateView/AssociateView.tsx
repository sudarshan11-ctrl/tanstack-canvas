import { useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/SectionLabel";
import HeroHeader from "@/components/ui/HeroHeader";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PrimaryMetricGrid from "@/components/metrics/PrimaryMetricGrid";
import SecondaryDriverList from "@/components/metrics/SecondaryDriverList";
import { useDashboardStore } from "@/store/dashboardStore";
import { personById, partnerOfAssociate, epOfPartner } from "@/utils/hierarchy";
import { rollupFor, primariesFor } from "@/utils/rollup";
import { driverOverviewFor } from "@/utils/secondaryDrivers";
import { lpiToRAG } from "@/utils/rag";
import { formatTimesheetDelayLabel, timesheetDelayFor } from "@/utils/timesheetDelay";

const TARGET_ASSOCIATE = 75;

function buildSummary(lpi: number, worstMetricId?: string, worstMetricName?: string): string {
  const rounded = Math.round(lpi);
  if (rounded >= 80) {
    return `Your index is ${rounded} — on track. Keep up the current pace.`;
  }
  if (worstMetricId && worstMetricName) {
    return `Your index is ${rounded}, held down mainly by ${worstMetricId} (${worstMetricName}). Focus here for the biggest gain.`;
  }
  return `Your index is ${rounded}. Review your primary metrics to identify where to accelerate.`;
}

export default function AssociateView() {
  const { epId, partnerId, associateId } = useParams({
    from: "/_authenticated/ep/$epId/p/$partnerId/a/$associateId",
  });
  const personScores = useDashboardStore((s) => s.personScores);
  const assoc = personById(associateId);
  const partner = partnerOfAssociate(associateId) ?? personById(partnerId);
  const ep = partner ? epOfPartner(partner.id) : personById(epId);
  const r = useMemo(
    () => rollupFor(associateId, personScores),
    [associateId, personScores],
  );
  const prims = useMemo(
    () => primariesFor(associateId, personScores),
    [associateId, personScores],
  );
  const overview = useMemo(
    () =>
      driverOverviewFor(
        associateId,
        prims.map((p) => p.metricId),
        personScores,
      ),
    [associateId, prims, personScores],
  );

  if (!assoc || !partner || !ep) {
    return (
      <div className="p-4">
        <Breadcrumbs crumbs={[{ label: "Not found" }]} />
        <div className="mt-3 text-[13px]" style={{ color: "var(--text-2)" }}>
          Associate not found.
        </div>
      </div>
    );
  }

  const worstPrim = [...prims].sort((a, b) => a.score - b.score)[0];
  const summary = buildSummary(r.personLpi, worstPrim?.metricId, worstPrim?.name);
  const sparkline = r.trend.length > 1 ? r.trend : undefined;

  const hygieneNote = (() => {
    const entry = timesheetDelayFor(assoc.id);
    return entry ? formatTimesheetDelayLabel(entry) : undefined;
  })();

  const heroStats = [
    { label: "PI", value: Math.round(r.personLpi) },
    { label: "Wickets", value: r.wickets },
    { label: "Tenure", value: `${assoc.tenureYears ?? "?"}y` },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-1">
      <Breadcrumbs
        crumbs={[
          { label: ep.name, to: "/ep/$epId", params: { epId: ep.id } },
          {
            label: partner.name,
            to: "/ep/$epId/p/$partnerId",
            params: { epId: ep.id, partnerId: partner.id },
          },
          { label: assoc.name },
        ]}
      />

      {/* Plain-language summary */}
      <div
        className="rounded-[var(--radius)] border px-4 py-3 text-[13px]"
        style={{
          backgroundColor: "color-mix(in srgb, var(--lks-accent) 5%, var(--surface))",
          borderColor: "color-mix(in srgb, var(--lks-accent) 20%, var(--line))",
          color: "var(--text-1)",
        }}
      >
        {summary}
      </div>

      <HeroHeader
        initials={assoc.initials}
        eyebrow={`Associate · reports to ${partner.name}`}
        name={assoc.name}
        chips={[
          assoc.subPractice ?? "",
          assoc.office ?? "",
          `${assoc.tenureYears ?? "?"}y tenure`,
        ].filter(Boolean)}
        lpi={Math.round(r.personLpi)}
        rag={lpiToRAG(r.personLpi)}
        sparklineData={sparkline}
        stats={heroStats}
        strap={{
          innings: r.personLpi,
          required: TARGET_ASSOCIATE,
          projection: r.personLpi + 1,
          wickets: r.wickets,
        }}
        hygieneNote={hygieneNote}
      />

      {/* Worst/Best drivers directly under hero */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="md">
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--rag-red)" }}
          >
            Worst drivers · pulling down
          </div>
          <SecondaryDriverList drivers={overview.worst} />
        </Card>
        <Card padding="md">
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--rag-green)" }}
          >
            Best drivers · supporting
          </div>
          <SecondaryDriverList drivers={overview.best} />
        </Card>
      </div>

      <section>
        <SectionLabel>Associate primary metrics · CRR / RRR</SectionLabel>
        <PrimaryMetricGrid
          personId={assoc.id}
          allScores={personScores}
          buildLink={(metricId) => ({
            to: "/metric/$id",
            params: { id: metricId },
            search: { from: assoc.id },
          })}
        />
      </section>
    </div>
  );
}
