import timesheetData from "@/data/timesheetEntryDelay.json";

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
