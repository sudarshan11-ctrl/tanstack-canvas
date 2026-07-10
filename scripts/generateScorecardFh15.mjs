/**
 * Build src/data/scorecardFh15.json from LKS_Performance_Scorecard_FY25-26.xlsx.
 * FH-15: use EW when EW ≠ STD; when equal, value is either and showStar = true.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const XLSX_PATH = join(ROOT, "LKS_Performance_Scorecard_FY25-26.xlsx");
const HIER_PATH = join(ROOT, "src/data/lksHierarchy.json");
const OUT_PATH = join(ROOT, "src/data/scorecardFh15.json");

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

function resolvePerson(hierarchy, excelName) {
  const exact = hierarchy.find((row) => normalizeName(row.name) === normalizeName(excelName));
  if (exact) return exact;

  let best = null;
  let bestScore = 0;
  for (const row of hierarchy) {
    const score = nameMatchScore(excelName, row.name);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  if (best && bestScore >= 0.75) return best;
  return null;
}

function parseRupeePerHour(cell) {
  const s = String(cell ?? "").trim();
  if (!s) return null;
  const m = s.match(/₹\s*([\d,]+(?:\.\d+)?)/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

function median(nums) {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function parseSheet(ws, hierarchy, sheetRole) {
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headers = grid[1];
  const fh15Col = headers.findIndex(
    (h) => String(h).startsWith("FH-15\n") && !String(h).includes("STD"),
  );
  const fh15StdCol = headers.findIndex((h) => String(h).includes("FH-15-STD"));
  if (fh15Col < 0 || fh15StdCol < 0) {
    throw new Error(`FH-15 columns not found in sheet`);
  }

  const entries = [];
  const unmatched = [];

  for (const row of grid.slice(2)) {
    const excelName = String(row[0] ?? "").trim();
    if (!excelName) continue;

    const ewRaw = row[fh15Col];
    const stdRaw = row[fh15StdCol];
    const ewNum = parseRupeePerHour(ewRaw);
    const stdNum = parseRupeePerHour(stdRaw);
    if (ewNum === null && stdNum === null) continue;

    const person = resolvePerson(hierarchy, excelName);
    if (!person) {
      unmatched.push(excelName);
      continue;
    }

    const ewEqualsStd = ewNum !== null && stdNum !== null && ewNum === stdNum;
    const value = ewEqualsStd ? ewNum : (ewNum ?? stdNum);

    entries.push({
      personId: person.id,
      name: excelName,
      role: person.role,
      sheet: sheetRole,
      value,
      ewRaw: String(ewRaw ?? ""),
      stdRaw: String(stdRaw ?? ""),
      ewEqualsStd,
      usesEw: !ewEqualsStd,
    });
  }

  return { entries, unmatched };
}

const hierarchy = JSON.parse(readFileSync(HIER_PATH, "utf8"));
const wb = XLSX.readFile(XLSX_PATH);

const partners = parseSheet(wb.Sheets["Partners"], hierarchy, "Partners");
const associates = parseSheet(wb.Sheets["Associates"], hierarchy, "Associates");

const byPerson = new Map();
for (const e of partners.entries) byPerson.set(e.personId, e);
for (const e of associates.entries) {
  if (!byPerson.has(e.personId)) byPerson.set(e.personId, e);
}
const entries = [...byPerson.values()];

const partnerValues = entries
  .filter((e) => e.role === "partner" || e.role === "practice_head")
  .map((e) => e.value);
const associateValues = entries.filter((e) => e.role === "associate").map((e) => e.value);

const payload = {
  source: "LKS_Performance_Scorecard_FY25-26.xlsx",
  metricId: "FH-15",
  period: "FY2025-26",
  generatedAt: new Date().toISOString(),
  targets: {
    practice_head: Math.round(median(partnerValues)),
    partner: Math.round(median(partnerValues)),
    associate: Math.round(median(associateValues)),
  },
  entries,
  unmatched: [...new Set([...partners.unmatched, ...associates.unmatched])],
  stats: {
    total: entries.length,
    starCount: entries.filter((e) => e.ewEqualsStd).length,
    ewCount: entries.filter((e) => !e.ewEqualsStd).length,
  },
};

writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} FH-15 entries (${payload.stats.starCount} star, ${payload.stats.ewCount} EW)`);
if (payload.unmatched.length) {
  console.log(`Unmatched (${payload.unmatched.length}):`, payload.unmatched.slice(0, 8).join(", "));
}
