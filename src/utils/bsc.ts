import type { MetricArea } from "@/types";

export type BscArea =
  | "financial"
  | "client"
  | "people"
  | "leadership";

export const BSC_LABEL: Record<BscArea, string> = {
  financial: "Financial Performance",
  client: "Client Relationship Development",
  people: "People & Teamwork",
  leadership: "Leadership & Firm as Institution",
};

export const BSC_COLOR: Record<BscArea, string> = {
  financial: "#0ea5e9",
  client: "#f59e0b",
  people: "#10b981",
  leadership: "#8b5cf6",
};

// Edge wheel mapping: 5 metric areas → 4 BSC quadrants
export function bscOf(area: MetricArea): BscArea {
  if (area === "financial_health") return "financial";
  if (area === "client_matter") return "client";
  if (area === "growth_pipeline") return "client";
  if (area === "people_ops") return "people";
  return "leadership"; // brand_discoverability
}

export function bscLevel(evidenceIndex: number): 1 | 2 | 3 | 4 | 5 {
  if (evidenceIndex >= 80) return 5;
  if (evidenceIndex >= 60) return 4;
  if (evidenceIndex >= 40) return 3;
  if (evidenceIndex >= 20) return 2;
  return 1;
}

export function levelToAreaScore(level: 1 | 2 | 3 | 4 | 5): number {
  return ((level - 1) / 4) * 100;
}

export type Band = "elite" | "heavyweight" | "developing" | "entry";
export const BAND_LABEL: Record<Band, string> = {
  elite: "Elite",
  heavyweight: "Heavyweight",
  developing: "Developing",
  entry: "Entry",
};
export const BAND_COLOR: Record<Band, string> = {
  elite: "#16a34a",
  heavyweight: "#0ea5e9",
  developing: "#d97706",
  entry: "#dc2626",
};
export function bandFor(lpi: number): Band {
  if (lpi >= 85) return "elite";
  if (lpi >= 65) return "heavyweight";
  if (lpi >= 40) return "developing";
  return "entry";
}