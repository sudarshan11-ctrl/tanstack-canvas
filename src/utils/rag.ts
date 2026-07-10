import type { RAGStatus } from "@/types";

// LPI composite → RAG. green ≥ 75, amber 50–74, red < 50.
export function lpiToRAG(score: number): RAGStatus {
  if (!Number.isFinite(score)) return "na";
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

// Per-metric RAG based on % of target achieved.
// higher-is-better: ≥95% green, 75–94% amber, <75% red
// lower-is-better : ≤105% green, 106–125% amber, >125% red
export function metricToRAG(
  value: number,
  target: number,
  lowerIsBetter: boolean,
): RAGStatus {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target === 0) {
    return "na";
  }
  const ratio = value / target;
  if (lowerIsBetter) {
    if (ratio <= 1.05) return "green";
    if (ratio <= 1.25) return "amber";
    return "red";
  }
  if (ratio >= 0.95) return "green";
  if (ratio >= 0.75) return "amber";
  return "red";
}