// Metric IDs whose lower value is better (e.g. lockup days, write-offs).
export const LOWER_IS_BETTER = new Set<string>([
  "FH-05", "FH-06", "FH-14", "FH-17", "FH-18", "FH-19",
  "CM-04", "CM-05", "CM-10",
  "PO-02",
]);

export const isLowerIsBetter = (metricId: string): boolean =>
  LOWER_IS_BETTER.has(metricId);