import timesheetData from "@/data/timesheetEntryDelay.json";
import { directReports } from "@/utils/hierarchy";

export interface TimesheetDelayEntry {
  personId: string;
  name: string;
  avgDelayDays: number;
  /** Hours ÷ 10 (firm standard day). */
  daysEntered: number;
  availableDays: number;
  /** daysEntered / availableDays × 100. */
  coveragePct: number;
  period: string;
}

export interface TeamTimesheetHygiene {
  teamSize: number;
  withData: number;
  avgDelayDays: number;
  avgCoveragePct: number;
}

export interface PersonTimesheetHygiene {
  /** Personal line under the LPI dial */
  note: string;
  tone: "default" | "warning";
  /** Shown when the person manages more than one direct report */
  teamNote?: string;
}

const byPersonId = new Map<string, TimesheetDelayEntry>(
  (timesheetData.entries as TimesheetDelayEntry[]).map((e) => [e.personId, e]),
);

/** FY25-26 hygiene metric — not used in LPI or area scoring. */
export function timesheetDelayFor(personId: string): TimesheetDelayEntry | undefined {
  return byPersonId.get(personId);
}

function formatDays(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export function formatTimesheetDelayLabel(entry: TimesheetDelayEntry): string {
  const delay = formatDays(entry.avgDelayDays);
  const coverage = formatDays(entry.coveragePct);
  return `Avg timesheet entry delay: ${delay} days · Time entered: ${coverage}% of available days`;
}

export function teamTimesheetHygiene(managerId: string): TeamTimesheetHygiene | undefined {
  const reports = directReports(managerId);
  if (reports.length <= 1) return undefined;

  const entries = reports
    .map((p) => timesheetDelayFor(p.id))
    .filter((e): e is TimesheetDelayEntry => Boolean(e));

  if (entries.length === 0) return undefined;

  const avgDelayDays =
    Math.round(
      (entries.reduce((s, e) => s + e.avgDelayDays, 0) / entries.length) * 10,
    ) / 10;
  const avgCoveragePct =
    Math.round(
      (entries.reduce((s, e) => s + e.coveragePct, 0) / entries.length) * 10,
    ) / 10;

  return {
    teamSize: reports.length,
    withData: entries.length,
    avgDelayDays,
    avgCoveragePct,
  };
}

export function formatTeamTimesheetLabel(team: TeamTimesheetHygiene): string {
  return `Avg team timesheet delay: ${formatDays(team.avgDelayDays)} days · Avg timesheet entered: ${formatDays(team.avgCoveragePct)}%`;
}

/** Personal + optional team hygiene lines for person-level heroes. */
export function personTimesheetHygiene(personId: string): PersonTimesheetHygiene {
  const entry = timesheetDelayFor(personId);
  const team = teamTimesheetHygiene(personId);
  const teamNote = team ? formatTeamTimesheetLabel(team) : undefined;

  if (entry) {
    return {
      note: formatTimesheetDelayLabel(entry),
      tone: "default",
      teamNote,
    };
  }

  return {
    note: "Timesheet not filled",
    tone: "warning",
    teamNote,
  };
}
