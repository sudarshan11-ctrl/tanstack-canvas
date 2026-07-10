/**
 * Build src/data/diversityMetrics.json from
 * team_diversity_by_reporting_authority_FY25-26.csv.
 *
 * Value = team_pct_female (gender mix of direct reports).
 * Match reporting authorities by employee_code → lks-{code}.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_PATH = join(ROOT, "team_diversity_by_reporting_authority_FY25-26.csv");
const HIER_PATH = join(ROOT, "src/data/lksHierarchy.json");
const OUT_PATH = join(ROOT, "src/data/diversityMetrics.json");

/** Floor for female representation on the team (higher is better for RAG). */
const TARGET_PCT_FEMALE = 40;

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      q = !q;
      continue;
    }
    if ((c === "\n" || c === "\r") && !q) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      cur = "";
      continue;
    }
    if (c === "," && !q) {
      row.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
}

const hierarchy = JSON.parse(readFileSync(HIER_PATH, "utf8"));
const byCode = new Map(hierarchy.map((h) => [String(h.employeeCode), h]));

const grid = parseCSV(readFileSync(CSV_PATH, "utf8"));
const header = grid[0].map((h) => h.trim());
const idx = Object.fromEntries(header.map((h, i) => [h, i]));

const entries = [];
const unmatched = [];

for (const cols of grid.slice(1)) {
  const name = String(cols[idx.reporting_authority] ?? "").trim();
  const code = String(cols[idx.employee_code] ?? "").trim();
  if (!name || !code) continue;

  const person = byCode.get(code);
  if (!person) {
    unmatched.push({ name, employeeCode: Number(code) });
    continue;
  }

  const directReports = Number(cols[idx.direct_reports]) || 0;
  const teamMale = Number(cols[idx.team_male]) || 0;
  const teamFemale = Number(cols[idx.team_female]) || 0;
  const teamUnknown = Number(cols[idx.team_unknown_gender]) || 0;
  const pctFemale = Number(cols[idx.team_pct_female]);
  const pctMale = Number(cols[idx.team_pct_male]);

  if (!Number.isFinite(pctFemale) || directReports <= 0) continue;

  entries.push({
    personId: person.id,
    name: person.name,
    employeeCode: Number(code),
    role: person.role,
    csvName: name,
    directReports,
    teamMale,
    teamFemale,
    teamUnknown,
    pctMale: Number.isFinite(pctMale) ? pctMale : null,
    pctFemale,
    value: pctFemale,
  });
}

const payload = {
  source: "team_diversity_by_reporting_authority_FY25-26.csv",
  metricId: "PO-03",
  period: "FY2025-26",
  unit: "%",
  valueField: "team_pct_female",
  targetPctFemale: TARGET_PCT_FEMALE,
  generatedAt: new Date().toISOString(),
  entries,
  unmatched,
};

writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} entries to ${OUT_PATH}`);
if (unmatched.length) {
  console.log(
    `Unmatched (${unmatched.length}):`,
    unmatched.map((u) => `${u.name} (${u.employeeCode})`).join(", "),
  );
}
