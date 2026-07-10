import type { MetricDefinition, MetricArea, MetricCategory, DataTier, Role } from "@/types";

const PRACTICE_HEAD_PRIMARY = new Set(["FH-01", "FH-08", "FH-09", "FH-10", "FH-11", "CM-03", "GP-01", "GP-07", "BD-03", "PO-01"]);
const P_PRIMARY  = new Set(["FH-01", "FH-02", "FH-08", "FH-09", "CM-02", "CM-03", "GP-04", "GP-07", "PO-05", "BD-06"]);
const A_PRIMARY  = new Set(["FH-01", "FH-08", "FH-09", "FH-13", "FH-19", "CM-02", "CM-09", "GP-07", "PO-06", "BD-06"]);

function cat(id: string): Record<Role, MetricCategory> {
  return {
    practice_head: PRACTICE_HEAD_PRIMARY.has(id) ? "primary" : "secondary",
    partner:        P_PRIMARY.has(id)  ? "primary" : "secondary",
    associate:      A_PRIMARY.has(id)  ? "primary" : "secondary",
  };
}

type Row = [string, string, MetricArea, DataTier, string, string];

const rows: Row[] = [
  // Financial Health (FH-01..FH-19) — names from LKS_Performance_All_Metrics_Flat.csv
  ["FH-01", "Total revenue",                        "financial_health", "derivable", "Absolute top-line fee income for the whole firm.", "₹Cr target by role band"],
  ["FH-02", "Total profit",                         "financial_health", "derivable", "Absolute net / distributable profit for the whole firm.", "Within 10% of plan"],
  ["FH-03", "Total operating cost",                 "financial_health", "derivable", "Absolute total cost of running the firm (people, premises, tech, admin).", ">90% of billings"],
  ["FH-04", "Cost-to-revenue ratio",               "financial_health", "derivable", "Total operating cost as a percentage of revenue; overall efficiency.", "Aligned with WIP run-rate"],
  ["FH-05", "Compensation / people-cost ratio",     "financial_health", "derivable", "Total compensation (below equity) as a share of revenue.", "<60 days"],
  ["FH-06", "Cost per fee-earner",                  "financial_health", "derivable", "Total operating cost / fee-earner headcount.", "<75 days"],
  ["FH-07", "Fixed-fee revenue share",              "financial_health", "derivable", "Fixed-fee revenue as a percentage of total fee revenue; revenue-mix and delivery-risk signal (not a profitability measure).", "At or above target rate"],
  ["FH-08", "Realization rate",                     "financial_health", "derivable", "Firm-wide gap between work done and cash collected.", "≥85%"],
  ["FH-09", "Utilization rate",                     "financial_health", "derivable", "Aggregate billable capacity used across all fee-earners. Metric to be calculated when target will be entered.", "To be set"],
  ["FH-10", "Leverage ratio",                       "financial_health", "derivable", "Fee-earners per equity partner across the firm.", "₹Cr per PH per FY"],
  ["FH-11", "Profit per equity partner",            "financial_health", "derivable", "Net profit divided by equity partners; headline profitability.", "≥45%"],
  ["FH-12", "Revenue per lawyer",                   "financial_health", "derivable", "Total revenue / fee-earner headcount.", "≥30%"],
  ["FH-13", "Average billing rate (effective)",     "financial_health", "derivable", "Effective realised rate: fees actually earned per billable hour after discounts, write-downs and non-collection.", "Role-banded annual target"],
  ["FH-14", "Revenue per billable hour",            "financial_health", "derivable", "Total revenue / total reported billable hours, all mandate types (incl. fixed-fee); blended yield per billable hour worked.", "<25% of capacity"],
  ["FH-15", "Revenue per available hour (capacity yield)", "financial_health", "derivable", "Total revenue / total available fee-earner person-hours; yield on capacity (folds in utilization).", "Within firm band"],
  ["FH-16", "Write-downs",                          "financial_health", "derivable", "Value cut from WIP before/at billing (inefficiency, scoping); erodes billing realization.", "≥12%"],
  ["FH-17", "Write-offs",                           "financial_health", "derivable", "Value cut from issued invoices that won't collect; erodes collection realization.", "<10%"],
  ["FH-18", "Total write-downs + write-offs",       "financial_health", "derivable", "Combined value lost from WIP and invoices; total realization leakage.", "<5% of billings"],
  ["FH-19", "Lockup",                               "financial_health", "derivable", "Firm-wide WIP days + debtor days; cash tied up.", "<120 days"],

  // Client & Matter (CM-01..CM-11)
  ["CM-01", "Total clients",                        "client_matter", "derivable", "Count of active clients firm-wide.", "Role-banded"],
  ["CM-02", "Total matter count",                   "client_matter", "derivable", "Count of active/open matters firm-wide.", "Quarterly target"],
  ["CM-03", "Client retention rate",                "client_matter", "derivable", "Share of clients retained year over year, firm-wide.", "≥85%"],
  ["CM-04", "Cohort revenue retention",             "client_matter", "derivable", "NRR-style view: revenue from each client-acquisition cohort tracked over time.", "<40%"],
  ["CM-05", "Wallet share (estimated)",             "client_matter", "derivable", "Estimated % of a client's spend in a practice that LKS holds, plus YoY direction.", "Within practice band"],
  ["CM-06", "Repeat-client revenue share",          "client_matter", "derivable", "Revenue from returning vs new clients, firm-wide.", "≥2.5"],
  ["CM-07", "Client concentration",                 "client_matter", "derivable", "Revenue dependence on top clients; firm risk measure.", "≥75%"],
  ["CM-08", "Matter-level profitability",           "client_matter", "derivable", "Profit per matter after cost of time/disbursements, firm-wide.", "≥40%"],
  ["CM-09", "Net Promoter Score / client feedback", "client_matter", "external",  "Firm-wide structured client satisfaction.", "≥50"],
  ["CM-10", "New client acquisition cost",          "client_matter", "exported",  "Cost to win a new client, firm-wide.", "<2"],
  ["CM-11", "Cross-selling rate",                   "client_matter", "derivable", "Clients using more than one practice area, firm-wide.", "Practice-banded"],

  // People & Operations (PO-01..PO-09)
  ["PO-01", "Attrition / retention",                "people_ops", "derivable", "Departures vs headcount, firm-wide (esp. associates).", "≥85%"],
  ["PO-02", "Time-to-productivity",                 "people_ops", "derivable", "How fast new hires reach billable targets, firm-wide. Metric to be calculated when target will be entered.", "To be set"],
  ["PO-03", "Diversity metrics",                    "people_ops", "exported",  "Team gender mix (% female among direct reports).", "≥40% female"],
  ["PO-04", "Engagement / satisfaction",            "people_ops", "exported",  "Firm-wide morale and engagement.", "≥40 hrs/yr"],
  ["PO-05", "Cycle time per matter type",           "people_ops", "derivable", "Avg open-to-close time by matter type, firm-wide.", "≥4 hrs/wk"],
  ["PO-06", "Drafting turnaround time",             "people_ops", "external",  "Avg time to produce drafts from instruction, firm-wide.", "≥4.0/5"],
  ["PO-07", "Hearing-prep responsiveness",          "people_ops", "proxy",     "Firm-controllable responsiveness around hearings.", "≥30%"],
  ["PO-08", "Billing cycle length",                 "people_ops", "derivable", "Avg days from work done to invoice, firm-wide.", "Firm policy band"],
  ["PO-09", "Cost-to-collect ratio",                "people_ops", "external",  "Cost of billing/collections vs collected, firm-wide.", "≥75"],

  // Growth & Pipeline (GP-01..GP-07)
  ["GP-01", "Revenue growth by practice area",      "growth_pipeline", "exported",  "Year-over-year revenue per practice, firm-wide.", "≥3× quarterly target"],
  ["GP-02", "Geography-wise revenue growth",        "growth_pipeline", "derivable", "Year-over-year revenue by office/region, firm-wide.", "≥25%"],
  ["GP-03", "New-office ramp / breakeven",          "growth_pipeline", "derivable", "Months to breakeven and ramp to target revenue for new offices.", "Role-banded"],
  ["GP-04", "Cross-sell pipeline & win rate",       "growth_pipeline", "derivable", "Expansion into existing clients: pipeline value and win rate.", "≥15%"],
  ["GP-05", "Inbound new-client pipeline & win rate", "growth_pipeline", "exported",  "New clients who approach the firm: pipeline and win rate.", "≥35%"],
  ["GP-06", "Outbound new-client pipeline & win rate", "growth_pipeline", "proxy",     "New clients won via firm-initiated pursuit: pipeline and win rate.", "≥8 / month"],
  ["GP-07", "Matter origination",                   "growth_pipeline", "derivable", "Revenue credited to originating partners on cross-sell and outbound.", "Role-banded target"],

  // Brand & Discoverability (BD-01..BD-07)
  ["BD-01", "Search visibility",                    "brand_discoverability", "external", "Organic rankings/traffic for target topics, firm-wide.", "≥12 / FY"],
  ["BD-02", "Share of voice vs peers",              "brand_discoverability", "external", "Visibility relative to peer firms, firm-wide.", "Tier 1–2 in practice"],
  ["BD-03", "Directory presence and rankings",      "brand_discoverability", "exported", "Standing in legal directories, firm-wide.", "≥4 / FY"],
  ["BD-04", "Awards and honours",                   "brand_discoverability", "exported", "Firm and individual awards and honours beyond directory rankings.", "≥6 / FY"],
  ["BD-05", "Media mentions and quality",           "brand_discoverability", "external", "Volume and tier of coverage, firm-wide.", "≥1 / FY"],
  ["BD-06", "Thought-leadership output",            "brand_discoverability", "exported", "Volume + engagement of articles/alerts, firm-wide.", "≥10 / FY"],
  ["BD-07", "Social reach and engagement",          "brand_discoverability", "proxy",    "Firm + partner social reach and engagement.", "≥2 / month"],
];

export const mockMetricDefinitions: MetricDefinition[] = rows.map(
  ([id, name, area, dataTier, description, targetDescription]) => ({
    id,
    name,
    area,
    category: cat(id),
    dataTier,
    description,
    targetDescription,
  }),
);