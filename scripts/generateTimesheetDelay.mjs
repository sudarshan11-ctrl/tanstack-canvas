/**
 * Build src/data/timesheetEntryDelay.json from the FY25-26 sheet of
 * timesheet entry delay 2024-25,2025-26.xlsx.
 *
 * Yearly avg = mean of monthly "avg delay" for months with timesheet activity.
 * Coverage = (billable + non-billable hours / 10) / available days,
 * where available days = 365 − weekends − 23 holidays (= 238 for FY25-26).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const XLSX_PATH = join(ROOT, "timesheet entry delay 2024-25,2025-26.xlsx");
const HIER_PATH = join(ROOT, "src/data/lksHierarchy.json");
const OUT_PATH = join(ROOT, "src/data/timesheetEntryDelay.json");

/** FY25-26: 365 − 104 Sat/Sun − 23 holidays. Matches firm 2380h / 10h-day standard. */
const AVAILABLE_DAYS = 238;
const HOURS_PER_DAY = 10;

function normalizeName(s) {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function nameTokens(s) {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function tokenMatches(excelToken, hierToken) {
  if (excelToken === hierToken) return true;
  if (excelToken.length === 1 && hierToken.startsWith(excelToken)) return true;
  if (hierToken.length === 1 && excelToken.startsWith(hierToken)) return true;
  return false;
}

function nameMatchScore(excelName, hierName) {
  const excel = nameTokens(excelName);
  const hier = nameTokens(hierName);
  if (excel.length === 0 || hier.length === 0) return 0;

  let matched = 0;
  for (const e of excel) {
    if (hier.some((h) => tokenMatches(e, h))) matched++;
  }
  return matched / excel.length;
}

function resolvePersonId(excelName, hierarchy) {
  const exact = hierarchy.find((row) => normalizeName(row.name) === normalizeName(excelName));
  if (exact) return exact.id;

  let best = null;
  let bestScore = 0;
  for (const row of hierarchy) {
    const score = nameMatchScore(excelName, row.name);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  if (best && bestScore >= 0.75) return best.id;
  return null;
}

function yearlyMetrics(row) {
  const delays = [];
  let totalHours = 0;
  // Columns: name, then 12 × (avg delay, diff, billable, non-billable)
  for (let m = 0; m < 12; m++) {
    const base = 1 + m * 4;
    const avgDelay = Number(row[base]);
    const billable = Number(row[base + 2]) || 0;
    const nonBillable = Number(row[base + 3]) || 0;
    const hours = billable + nonBillable;
    totalHours += hours;
    const hasActivity = hours > 0;
    if (!hasActivity && (!Number.isFinite(avgDelay) || avgDelay <= 0)) continue;
    if (Number.isFinite(avgDelay) && avgDelay >= 0) delays.push(avgDelay);
  }
  if (delays.length === 0 && totalHours <= 0) return null;
  const avgDelayDays =
    delays.length > 0
      ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 100) / 100
      : null;
  const daysEntered = Math.round((totalHours / HOURS_PER_DAY) * 100) / 100;
  const coveragePct =
    Math.round((daysEntered / AVAILABLE_DAYS) * 1000) / 10; // 1 decimal
  return { avgDelayDays, totalHours: Math.round(totalHours * 100) / 100, daysEntered, coveragePct };
}

const hierarchy = JSON.parse(readFileSync(HIER_PATH, "utf8"));

const wb = XLSX.readFile(XLSX_PATH);
const ws = wb.Sheets["2025-26"];
if (!ws) throw new Error('Sheet "2025-26" not found');

const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
const dataRows = grid.slice(2).filter((row) => row[0]);

const entries = [];
const unmatched = [];

for (const row of dataRows) {
  const excelName = String(row[0]).trim();
  const metrics = yearlyMetrics(row);
  if (metrics === null || metrics.avgDelayDays === null) continue;

  const personId = resolvePersonId(excelName, hierarchy);
  if (!personId) {
    unmatched.push(excelName);
    continue;
  }

  entries.push({
    personId,
    name: excelName,
    avgDelayDays: metrics.avgDelayDays,
    daysEntered: metrics.daysEntered,
    availableDays: AVAILABLE_DAYS,
    coveragePct: metrics.coveragePct,
    period: "FY2025-26",
  });
}

const payload = {
  source: "timesheet entry delay 2024-25,2025-26.xlsx",
  sheet: "2025-26",
  period: "FY2025-26",
  generatedAt: new Date().toISOString(),
  metric: "Avg Timesheet entry delay",
  unit: "days",
  availableDays: AVAILABLE_DAYS,
  hoursPerDay: HOURS_PER_DAY,
  coverageNote:
    "coveragePct = (total billable+non-billable hours / 10) / availableDays × 100",
  entries,
  unmatched,
};

writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} entries to ${OUT_PATH}`);
if (unmatched.length) {
  console.log(`Unmatched names (${unmatched.length}):`, unmatched.slice(0, 10).join(", "));
}
