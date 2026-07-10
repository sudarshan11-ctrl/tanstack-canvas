export interface HygieneBucket {
  label: string;
  count: number;
  sharePct: number;
}

export interface HygieneBucketMetric {
  kind: "buckets";
  id: string;
  title: string;
  buckets: HygieneBucket[];
}

/** Single-rate hygiene metric (e.g. tagging coverage / hygiene). */
export interface HygieneRateMetric {
  kind: "rate";
  id: string;
  title: string;
  /** Short formula or definition shown under the title */
  formula?: string;
  valuePct: number;
  /** Optional numerator / denominator context */
  detail?: string;
}

export type FirmHygieneMetric = HygieneBucketMetric | HygieneRateMetric;
