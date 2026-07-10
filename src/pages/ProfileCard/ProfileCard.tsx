import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, BarChart2 } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/SectionLabel";
import HeroHeader from "@/components/ui/HeroHeader";
import MetricCard from "@/components/ui/MetricCard";
import CausalAlertTray from "@/components/metrics/CausalAlertTray";
import CompetencyWheel from "@/components/bsc/CompetencyWheel";
import WhyIsThisRed from "@/components/metrics/WhyIsThisRed";
import { useDashboardStore } from "@/store/dashboardStore";
import { mockPeople } from "@/data/mockPeople";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";
import { runRateFor } from "@/utils/runRate";
import { bandFor, BAND_COLOR, BAND_LABEL } from "@/utils/bsc";
import { squadForPerson } from "@/utils/squad";
import { lpiToRAG } from "@/utils/rag";
import type { Role } from "@/types";
import { snapshotInfo } from "@/data/snapshotMetricValues";
import { formatTimesheetDelayLabel, timesheetDelayFor } from "@/utils/timesheetDelay";
import { formatPeriod, formatSyncedAt } from "@/utils/format";

const ROLE_LABEL: Record<Role, string> = {
  practice_head: "Practice Head",
  partner: "Partner",
  associate: "Associate",
};

const ROLE_TARGET: Record<Role, number> = {
  practice_head: 85,
  partner: 80,
  associate: 75,
};

const LAST_SYNC = formatSyncedAt(snapshotInfo.fetchedAt);
const CURRENT_YEAR = 2026;
const ROSTER_PERIOD = formatPeriod(snapshotInfo.period);

type ProfileTab = "competency" | "diagnosis";

export default function ProfileCard() {
  const { id } = useParams({ from: "/_authenticated/profile/$id" });
  const personScores = useDashboardStore((s) => s.personScores);
  const [profileTab, setProfileTab] = useState<ProfileTab>("competency");

  const person = mockPeople.find((p) => p.id === id);

  if (!person) {
    return (
      <PageWrapper>
        <div className="p-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[12px] transition-opacity hover:opacity-70"
            style={{ color: "var(--text-2)" }}
          >
            <ArrowLeft size={14} /> Firm Landing
          </Link>
          <div
            className="mt-4 text-[14px]"
            style={{ color: "var(--text-2)" }}
          >
            This person is not on the {ROSTER_PERIOD} roster.{" "}
            <Link to="/" style={{ color: "var(--lks-accent)" }}>
              Back to firm
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const score = personScores.find((s) => s.personId === person.id)!;

  const primaryDefs = mockMetricDefinitions.filter(
    (m) => m.category[person.role] === "primary",
  );
  const primaryValues = primaryDefs
    .map((def) => ({
      def,
      value: score.metricValues.find((v) => v.metricId === def.id),
    }))
    .filter(
      (x): x is { def: typeof x.def; value: NonNullable<typeof x.value> } =>
        Boolean(x.value),
    );

  const joinedYear = CURRENT_YEAR - person.tenureYears;
  const band = bandFor(score.lpi);
  const wickets = score.metricValues.filter((mv) => mv.rag === "red").length;

  const runRates = primaryValues
    .map(({ value }) => runRateFor(value))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const topRR = runRates.find((r) => r.status === "needs-acceleration") ?? runRates[0] ?? null;

  const mySquad = squadForPerson(person.id, personScores);
  const target = ROLE_TARGET[person.role];
  const sparkline = score.metricValues
    .filter((mv) => mv.trend.length > 1)
    .slice(0, 1)[0]?.trend;

  const hygieneNote = (() => {
    const entry = timesheetDelayFor(person.id);
    return entry ? formatTimesheetDelayLabel(entry) : undefined;
  })();

  const heroStats = [
    { label: ROLE_LABEL[person.role], value: score.lpi.toFixed(0) },
    { label: "Firm rank", value: `#${score.firmRank}` },
    { label: "Wickets", value: wickets },
    { label: "Joined", value: joinedYear },
  ];

  return (
    <PageWrapper>
      <div className="mx-auto max-w-[1320px] space-y-5">
        <div className="flex items-center justify-between">
          <Link
            to={mySquad ? "/squad/$epId" : "/"}
            params={mySquad ? { epId: mySquad.captain.id } : ({} as never)}
            className="inline-flex items-center gap-1 text-[12px] transition-opacity hover:opacity-70"
            style={{ color: "var(--text-2)" }}
          >
            <ArrowLeft size={14} />
            {mySquad ? `${mySquad.captain.name}'s squad` : "Firm Landing"}
          </Link>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-2)" }}>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: BAND_COLOR[band] }}
            >
              {BAND_LABEL[band]}
            </span>
            <span>{person.pillar} · {person.subPractice} · {person.office}</span>
          </div>
        </div>

        {/* Hero header */}
        <HeroHeader
          initials={person.initials}
          eyebrow={`${ROLE_LABEL[person.role]} · joined ${joinedYear}`}
          name={person.name}
          chips={[person.subPractice ?? "", person.office ?? ""].filter(Boolean)}
          lpi={Math.round(score.lpi)}
          rag={lpiToRAG(score.lpi)}
          sparklineData={sparkline}
          stats={heroStats}
          strap={{
            innings: score.lpi,
            required: target,
            projection: score.lpi + 4,
            wickets,
            topRunRate: topRR,
          }}
          hygieneNote={hygieneNote}
        />

        {/* Primary metrics grid */}
        <div>
          <SectionLabel>
            Primary metrics — {primaryValues.length} of {primaryDefs.length} ·{" "}
            {ROLE_LABEL[person.role]}
          </SectionLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {primaryValues.map(({ def, value }) => (
              <Link key={def.id} to="/metric/$id" params={{ id: def.id }} className="block">
                <MetricCard metric={def} value={value} />
              </Link>
            ))}
          </div>
        </div>

        {/* Two-tab lower section: Competency / Diagnosis */}
        <Card padding="lg">
          {/* Tab bar */}
          <div
            className="mb-5 flex gap-0 border-b"
            style={{ borderColor: "var(--line)" }}
          >
            {(
              [
                { id: "competency" as const, label: "Competency" },
                { id: "diagnosis" as const, label: "Diagnosis" },
              ] as const
            ).map((t) => {
              const active = profileTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setProfileTab(t.id)}
                  className="-mb-px border-b-2 px-4 py-2 text-[13px] font-medium transition-colors"
                  style={{
                    borderColor: active ? "var(--lks-accent)" : "transparent",
                    color: active ? "var(--lks-accent)" : "var(--text-2)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {profileTab === "competency" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
              <CompetencyWheel areaScores={score.areaScores} size={220} />
              <CausalAlertTray alerts={score.alerts} />
            </div>
          )}

          {profileTab === "diagnosis" && (
            <WhyIsThisRed values={score.metricValues} role={person.role} />
          )}
        </Card>

        {/* Primary action + footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 text-[12px]"
          style={{ color: "var(--text-2)" }}
        >
          <span>Last sync: {LAST_SYNC} · Period {score.period}</span>
          <Link
            to="/metric/$id"
            params={{ id: primaryDefs[0]?.id ?? "FH-01" }}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <BarChart2 size={14} />
            Drill into metrics
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
