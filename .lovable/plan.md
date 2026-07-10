## Goal

Today, metrics that are inactive fall into two logical buckets but render identically (gray card, `opacity: 0.55–0.6`, "No data" badge):

1. **No data uploaded yet** — INACTIVE_METRIC_REMARK
2. **Awaiting target entry** — AWAITING_TARGET_METRIC_IDS = `FH-09`, `PO-02` with remark "Metric to be calculated when target will be entered."

The user wants bucket 2 visually distinguishable from bucket 1, while keeping both non-clickable inactive states.

## Visual language

| State | Border | Background | Opacity | Badge |
|---|---|---|---|---|
| Active | area color, 4px left | white | 1 | "Primary" / area color |
| No data (unchanged) | slate-300, 4px left | slate-50 | 0.6 | slate "No data · Request upload" |
| **Awaiting target (new)** | amber-400, 4px left dashed | amber-50 | 0.85 (readable) | amber "Awaiting target" with target icon |

Amber signals "action pending" (target needs entry), differentiating from slate "nothing here yet". Higher opacity because the metric definition is real and known, just parameterised.

## Changes (presentation only)

1. **`src/utils/metricActivity.ts`** — export a small helper:
   ```ts
   export type MetricInactiveReason = "no-data" | "awaiting-target";
   export function metricInactiveReason(id: string): MetricInactiveReason | null
   ```
   Returns `"awaiting-target"` if id is in `AWAITING_TARGET_METRIC_IDS`, else `"no-data"` if `!isMetricActive`, else `null`. Keep `isMetricActive` and existing exports intact.

2. **`src/components/metrics/FirmMetricsExplorer.tsx`** (table row, lines ~347–395)
   - Replace single `active` branch with `reason = metricInactiveReason(r.id)`.
   - When `reason === "awaiting-target"`:
     - row `opacity: 0.85`
     - left border 3px `var(--rag-amber)` on the row `<td>` first cell (or a leading indicator dot)
     - badge text: "Awaiting target"; colors: amber bg `color-mix(in srgb, var(--rag-amber) 15%, transparent)`, amber text
     - `title`: "Metric will be calculated once the target is entered."
   - When `reason === "no-data"`: keep current slate "No data · Request upload".

3. **`src/pages/MindMap/MindMap.tsx`** (primary cards ~127–184 and secondary rows ~196–241)
   - Compute `reason` alongside `active`.
   - For `awaiting-target`, render an amber-tinted card: `bg-amber-50`, `borderColor: var(--rag-amber) or #f59e0b`, `border-left-4 border-dashed`, `opacity-90`, badge "Awaiting target" in amber. Still non-clickable (wrap in `div` like existing inactive path) with the target-specific tooltip.
   - `no-data` path unchanged.

No changes to data logic, scoring, or which metrics are considered active. Purely presentational differentiation in the two surfaces that currently render the inactive state.

## Out of scope

- Making awaiting-target metrics clickable or routable.
- Adding a "set target" flow (can be a follow-up).
- Any other pages — these are the only two places `isMetricActive` gates rendering.
