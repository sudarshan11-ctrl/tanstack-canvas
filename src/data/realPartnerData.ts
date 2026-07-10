// Re-export the unified person data set (partners + associates) parsed from
// the FY2022-23 scorecard upload, with promoted-partner ids re-keyed to
// their practice-head ids so metric values follow them when promoted.
import { realPersonData, type RealMetricEntry } from "./realPeopleData";
import { promotedPartnerIdToPracticeHeadId } from "./mockPeople";

export type { RealMetricEntry } from "./realPeopleData";

const remapped: Record<string, Record<string, RealMetricEntry>> = {};
for (const [personId, metrics] of Object.entries(realPersonData)) {
  const targetId = promotedPartnerIdToPracticeHeadId.get(personId) ?? personId;
  remapped[targetId] = metrics;
}

export const realPartnerData = remapped;
