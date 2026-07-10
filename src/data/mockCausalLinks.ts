import type { Role } from "@/types";

export interface CausalLink {
  fromId: string;
  toId: string;
  mechanism: string;
  applicableRoles: Role[];
}

const ALL: Role[] = ["practice_head", "partner", "associate"];
const SENIOR: Role[] = ["practice_head", "partner"];
const PA: Role[] = ["partner", "associate"];

export const causalLinks: CausalLink[] = [
  // Anchor links from the metric framework
  { fromId: "FH-18", toId: "FH-08", mechanism: "Write-down+off control drives realization", applicableRoles: ALL },
  { fromId: "GP-06", toId: "GP-07", mechanism: "Outbound wins credited as origination", applicableRoles: SENIOR },
  { fromId: "FH-19", toId: "FH-08", mechanism: "Lockup gap eliminates billing opportunities", applicableRoles: ALL },
  { fromId: "PO-01", toId: "FH-09", mechanism: "Stable team maintains utilization", applicableRoles: SENIOR },
  { fromId: "CM-09", toId: "CM-03", mechanism: "NPS predicts client loyalty", applicableRoles: SENIOR },

  // Financial health chains
  { fromId: "FH-05", toId: "FH-19", mechanism: "WIP days roll up into lockup", applicableRoles: ALL },
  { fromId: "FH-06", toId: "FH-19", mechanism: "AR days roll up into lockup", applicableRoles: ALL },
  { fromId: "FH-04", toId: "FH-03", mechanism: "Timely billings unlock collections", applicableRoles: ALL },
  { fromId: "FH-17", toId: "FH-08", mechanism: "Discounting compresses realization", applicableRoles: SENIOR },
  { fromId: "FH-09", toId: "FH-02", mechanism: "Utilization fuels revenue worked", applicableRoles: ALL },
  { fromId: "FH-07", toId: "FH-11", mechanism: "Effective rate flows to contribution margin", applicableRoles: SENIOR },
  { fromId: "FH-08", toId: "FH-11", mechanism: "Realization underpins contribution margin", applicableRoles: ALL },
  { fromId: "FH-11", toId: "FH-10", mechanism: "Contribution margin drives PEP", applicableRoles: ["practice_head"] },
  { fromId: "FH-12", toId: "FH-11", mechanism: "Matter profitability rolls into margin", applicableRoles: SENIOR },
  { fromId: "FH-13", toId: "FH-09", mechanism: "Billable hours produce utilization", applicableRoles: ALL },
  { fromId: "FH-14", toId: "FH-09", mechanism: "Non-billable load suppresses utilization", applicableRoles: ALL },
  { fromId: "FH-15", toId: "FH-10", mechanism: "Leverage amplifies PEP", applicableRoles: ["practice_head"] },
  { fromId: "FH-16", toId: "FH-10", mechanism: "Revenue growth lifts PEP", applicableRoles: ["practice_head"] },
  { fromId: "FH-02", toId: "FH-04", mechanism: "Worked revenue must convert to billings", applicableRoles: ALL },
  { fromId: "FH-03", toId: "FH-06", mechanism: "Collections shorten AR days", applicableRoles: ALL },
  { fromId: "FH-18", toId: "FH-12", mechanism: "Write-offs erode matter profitability", applicableRoles: SENIOR },

  // Client & matter chains
  { fromId: "CM-02", toId: "FH-01", mechanism: "New matters generate originated revenue", applicableRoles: SENIOR },
  { fromId: "CM-03", toId: "CM-07", mechanism: "Retention compounds into repeat revenue", applicableRoles: SENIOR },
  { fromId: "CM-06", toId: "CM-07", mechanism: "Cross-sell deepens repeat revenue", applicableRoles: SENIOR },
  { fromId: "CM-08", toId: "CM-02", mechanism: "Win rate converts pitches to matters", applicableRoles: SENIOR },
  { fromId: "CM-10", toId: "CM-09", mechanism: "Complaints suppress NPS", applicableRoles: ALL },
  { fromId: "CM-05", toId: "FH-19", mechanism: "Long cycle times extend lockup", applicableRoles: ALL },
  { fromId: "CM-11", toId: "FH-01", mechanism: "Larger matters lift origination", applicableRoles: SENIOR },
  { fromId: "CM-04", toId: "FH-01", mechanism: "Client concentration drives originated revenue volatility", applicableRoles: ["practice_head"] },
  { fromId: "CM-07", toId: "CM-03", mechanism: "Repeat work reinforces retention", applicableRoles: SENIOR },
  { fromId: "CM-01", toId: "CM-02", mechanism: "Active client base feeds new matters", applicableRoles: SENIOR },

  // People & operations chains
  { fromId: "PO-02", toId: "PO-01", mechanism: "Attrition is the inverse of retention", applicableRoles: SENIOR },
  { fromId: "PO-05", toId: "PO-06", mechanism: "Supervision quality lifts feedback scores", applicableRoles: PA },
  { fromId: "PO-06", toId: "PO-02", mechanism: "Poor feedback predicts attrition", applicableRoles: PA },
  { fromId: "PO-09", toId: "PO-02", mechanism: "Low engagement triggers attrition", applicableRoles: ALL },
  { fromId: "PO-04", toId: "PO-07", mechanism: "Training builds promotion readiness", applicableRoles: PA },
  { fromId: "PO-07", toId: "FH-15", mechanism: "Promotion pipeline shapes leverage", applicableRoles: ["practice_head"] },
  { fromId: "PO-03", toId: "FH-15", mechanism: "Hiring velocity adjusts leverage", applicableRoles: SENIOR },
  { fromId: "PO-01", toId: "PO-07", mechanism: "Retained team progresses to readiness", applicableRoles: SENIOR },
  { fromId: "PO-05", toId: "FH-12", mechanism: "Supervision improves matter profitability", applicableRoles: SENIOR },
  { fromId: "PO-08", toId: "PO-09", mechanism: "Inclusive teams report higher engagement", applicableRoles: ALL },

  // Growth & pipeline chains
  { fromId: "GP-01", toId: "GP-07", mechanism: "Pipeline value precedes origination credits", applicableRoles: SENIOR },
  { fromId: "GP-02", toId: "GP-07", mechanism: "Conversion turns pipeline into credits", applicableRoles: SENIOR },
  { fromId: "GP-05", toId: "GP-02", mechanism: "Pitch wins improve conversion", applicableRoles: SENIOR },
  { fromId: "GP-03", toId: "CM-01", mechanism: "New client wins grow active book", applicableRoles: SENIOR },
  { fromId: "GP-04", toId: "FH-16", mechanism: "Practice growth flows to revenue growth", applicableRoles: SENIOR },
  { fromId: "GP-06", toId: "GP-01", mechanism: "Outbound activity refills the pipeline", applicableRoles: SENIOR },
  { fromId: "GP-07", toId: "FH-01", mechanism: "Origination credits realize as revenue", applicableRoles: SENIOR },
  { fromId: "GP-01", toId: "FH-16", mechanism: "Healthy pipeline supports revenue growth", applicableRoles: SENIOR },
  { fromId: "GP-03", toId: "FH-01", mechanism: "New clients add originated revenue", applicableRoles: SENIOR },

  // Brand & discoverability chains
  { fromId: "BD-01", toId: "BD-07", mechanism: "Media visibility drives inbound inquiries", applicableRoles: SENIOR },
  { fromId: "BD-02", toId: "BD-07", mechanism: "Directory rankings attract inbound work", applicableRoles: SENIOR },
  { fromId: "BD-03", toId: "BD-02", mechanism: "Thought leadership lifts directory rankings", applicableRoles: SENIOR },
  { fromId: "BD-04", toId: "BD-07", mechanism: "Speaking circuits drive inbound interest", applicableRoles: SENIOR },
  { fromId: "BD-05", toId: "BD-02", mechanism: "Awards reinforce directory standing", applicableRoles: SENIOR },
  { fromId: "BD-06", toId: "BD-07", mechanism: "Steady publication cadence creates inbound flow", applicableRoles: ALL },
  { fromId: "BD-07", toId: "GP-01", mechanism: "Inbound inquiries seed pipeline", applicableRoles: SENIOR },
  { fromId: "BD-03", toId: "BD-07", mechanism: "Long-form content surfaces inbound inquiries", applicableRoles: SENIOR },
  { fromId: "BD-06", toId: "BD-02", mechanism: "Consistent publishing supports directory work", applicableRoles: ALL },
  { fromId: "BD-04", toId: "BD-01", mechanism: "Speaking generates media mentions", applicableRoles: SENIOR },

  // Cross-area chains
  { fromId: "CM-03", toId: "FH-01", mechanism: "Retained clients sustain originated revenue", applicableRoles: SENIOR },
  { fromId: "PO-01", toId: "FH-13", mechanism: "Stable team protects billable hour output", applicableRoles: ALL },
  { fromId: "PO-06", toId: "FH-09", mechanism: "Healthy team culture sustains utilization", applicableRoles: SENIOR },
  { fromId: "FH-09", toId: "FH-13", mechanism: "Utilization targets are met via billable hours", applicableRoles: ALL },
  { fromId: "CM-06", toId: "GP-04", mechanism: "Cross-sell expands practice area growth", applicableRoles: SENIOR },
  { fromId: "BD-02", toId: "GP-05", mechanism: "Rankings improve pitch win rate", applicableRoles: SENIOR },
  { fromId: "PO-05", toId: "FH-08", mechanism: "Supervision reduces realization leakage", applicableRoles: SENIOR },
  { fromId: "FH-13", toId: "FH-01", mechanism: "Billable output converts to originated revenue", applicableRoles: ALL },
];