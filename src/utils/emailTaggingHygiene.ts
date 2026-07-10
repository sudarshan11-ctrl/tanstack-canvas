import taggingData from "@/data/emailTaggingHygiene.json";
import type { HygieneRateMetric } from "@/types/hygiene";

const FY_SCOPE = "FY25-26 active";

function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

/** FY25-26 firm hygiene — tagging coverage. Not used in LPI scoring. */
export function firmTaggingCoverage(): HygieneRateMetric {
  const row = taggingData.coverage.scopes.find((s) => s.scope === FY_SCOPE)!;
  return {
    kind: "rate",
    id: "tagging-coverage",
    title: taggingData.coverage.metric,
    formula: taggingData.coverage.formula,
    valuePct: row.coveragePct,
    detail: `${formatCount(row.taggedNE)} / ${formatCount(row.allEmails)} · ${FY_SCOPE}`,
  };
}

/** FY25-26 firm hygiene — tagging hygiene (drop-leak rate). Not used in LPI scoring. */
export function firmTaggingHygiene(): HygieneRateMetric {
  const row = taggingData.hygiene.scopes.find((s) => s.scope === FY_SCOPE)!;
  return {
    kind: "rate",
    id: "tagging-hygiene",
    title: taggingData.hygiene.metric,
    formula: taggingData.hygiene.formula,
    valuePct: row.hygienePct,
    detail:
      row.dropLeaks === 0
        ? `${formatCount(row.taggedNE)} tagged · 0 drop leaks · ${FY_SCOPE}`
        : `${formatCount(row.taggedNE)} / ${formatCount(row.taggedNE + row.dropLeaks)} · ${FY_SCOPE}`,
  };
}
