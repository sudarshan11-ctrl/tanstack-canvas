# API Implementation Changelog Report

## Deliverable

A single new markdown file at `docs/api-implementation-changelog.md` that documents every prompt and change since the replica-db-api integration began (26 Jun 2026) through the latest designation-to-endpoint rule (30 Jun 2026).

Attribution: every user prompt is credited to **Actual User**.

## Structure

Front matter (title, date range, scope note), then one entry per user prompt in chronological order. Each entry uses this template:

```
### Entry N — <short title>
- Date: DD/MM/YYYY
- Requested by: Actual User
- Prompt (verbatim, quoted): ...
- Intent: what the user was trying to achieve
- Actions taken: decisions made, options offered, clarifications gathered
- Execution steps: files created/edited/deleted, functions/endpoints introduced, verification performed
- Outcome: what shipped, known follow-ups
```

Closing section: a "Files touched (cumulative)" table and a short "Open follow-ups" list (e.g. FH-12 unit, mock retention outside Badri subtree).

## Entries to include (chronological)

1. **26/06** Wire portal to replica-db-api (initial plan + implementation). Server-side data pipeline, env config, `REPLICA_API_KEY` moved to Lovable secret. Files: `.env`, `src/lib/config.server.ts`, `src/lib/api/replica-api.server.ts`, `src/lib/api/metrics.functions.ts`, `src/store/dashboardStore.ts`.
2. **26/06** "Where is the replica db api key set?" — clarification that the key is a Lovable secret, injected server-side only.
3. **26/06** Add connectivity test endpoint + UI button. Files: `src/lib/api/healthcheck.ts` (later `connectivity.functions.ts`), `src/components/admin/ReplicaConnectivityButton.tsx`.
4. **26/06** "Is data getting fed?" — diagnosed RFC1918 base URL unreachable from Cloudflare Worker; switched base URL to the public tunnel.
5. **26/06** Confirm dashboard uses live data + user 420 verification. `apiMetricMap.json`, `lcmsUserMap.json` updated.
6. **~28/06** Single-profile headline demo: `HEADLINE_METRIC_IDS = ["FH-01","FH-08","CM-03"]`, `fetchMetricsForPerson` accepts `metricIds` / `includePriorYear`.
7. **29/06** "Implement this hierarchy on the dashboard" (LKS_Firm_Hierarchy_1.xlsx). Created `scripts/generateLksHierarchy.py`, `src/data/lksHierarchy.json`, replaced roster (10 practice heads, 58 partners, 374 associates).
8. **29/06** Load FY25-26 data for L Badrinarayanan and team. Fiscal constants updated, `CONCURRENCY` 2→3, new `getTeamMetrics` server function, auto-fetch on practice-head mount.
9. **29/06** Reference metric list provided; comparison of API values against reference; LCMS 378 mapped for `lks-1130`; `transformMetric` refactored for scaling / combineColumns / multi-row aggregation.
10. **29/06** Verify page introduced at `/verify/lks-1130`; three known mapping issues flagged (FH-12 unit, and two others).
11. **29/06** Verify page timeout refactor: replaced batch `verifyPersonMetrics` with per-metric `verifyOnePersonMetric` + `listVerifyMetricIds`, fan-out on the client.
12. **30/06** Remove existing dashboard data, keep 442 hierarchy people, ingest Badri's team. New `src/data/badriSubtree.ts`; mock metric values stripped for Badri subtree only; on-demand `loadPersonMetrics` / `loadTeamMetrics` per page mount.
13. **30/06** API endpoint should follow hierarchy designation. Added `designation` to `Person`, introduced `designationToApiRole`, wired through `metricRegistry.ts`, `metrics.functions.ts`, `dashboardStore.ts`.
14. **30/06** Designation mapping refinement (equity partner = group heads). Replaced `designationToApiRole` with `resolveApiRole(role, designation)`: group heads → equity-partner endpoints; other Partner tiers → partner endpoints; associate tiers → associate endpoints.

## Notes

- Report is documentation only. No source code, config, or data files change.
- All prompt quotes come from the chat history for messages #3 through #104; anything ambiguous will be labelled as such rather than invented.
- Punctuation and formatting follow project standards: sentence case headings, no em dashes, dates as DD/MM/YYYY.
