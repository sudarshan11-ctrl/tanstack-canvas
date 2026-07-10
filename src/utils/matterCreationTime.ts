import matterCreationData from "@/data/matterCreationTime.json";
import type { HygieneBucketMetric } from "@/types/hygiene";

/** FY25-26 firm hygiene metric — not used in LPI or area scoring. */
export function firmMatterCreationTime(): HygieneBucketMetric {
  return {
    kind: "buckets",
    id: "matter-creation-time",
    title: matterCreationData.metric,
    buckets: matterCreationData.buckets.map((b) => ({
      label: b.label,
      count: b.count,
      sharePct: b.sharePct,
    })),
  };
}
