# API implementation changelog

- Scope: every user prompt and the actions taken in response, from the first replica-db-api wiring through the latest designation-to-endpoint refinement.
- Date range: 26/06/2026 to 30/06/2026.
- Attribution: all prompts credited to Actual User.
- Format per entry: the user's prompt first, then the actions/changes implemented in response.

---

### Entry 1 — Wire portal to replica-db-api

- Date: 26/06/2026
- Requested by: Actual User

Prompt:
> "Wire the Performance Metrics Portal to our live replica-db-api so dashboard pages auto-populate with real metric data instead of static mock values."

Actions and changes implemented:
- Reviewed `dashboardStore.ts`, `config.server.ts`, `mockMetricValues.ts`, `people.ts`, `metrics.ts`, `example.functions.ts`, `route.tsx`, `.env`.
- Added server-only env vars `REPLICA_API_BASE_URL`, `REPLICA_API_KEY_HEADER`, `DEFAULT_FY_START`, `DEFAULT_FY_END` to `.env`; read them via `src/lib/config.server.ts`.
- Created `src/lib/api/replica-api.server.ts` with `runMetric` and `listPerformanceMetrics` helpers.
- Created `src/lib/api/metrics.functions.ts` with `getPersonMetrics`, `getFirmMetrics`, `getMetricCatalog` server functions.
- Refactored `src/store/dashboardStore.ts` to merge live values over mock values and expose `loadDashboardData`.
- Outcome: dashboard hydrates from live API when reachable, falls back to mock otherwise.

---

### Entry 2 — Where is the API key set

- Date: 26/06/2026
- Requested by: Actual User

Prompt:
> "where is th ereplica db api key set"

Actions and changes implemented:
- No code change. Clarified that `REPLICA_API_KEY` is stored as a Lovable secret, injected only into server-side code as `process.env.REPLICA_API_KEY`, and never reaches the browser bundle.

---

### Entry 3 — Connectivity test endpoint and UI button

- Date: 26/06/2026
- Requested by: Actual User

Prompt:
> "Add a server endpoint and a UI button to test connectivity to replica-db-api and show a success/error message without leaking the API key."

Actions and changes implemented:
- Added `src/lib/api/healthcheck.ts` (later consolidated into `src/lib/api/connectivity.functions.ts`) returning `{ success, message }` with no key material in the response.
- Added `src/components/admin/ReplicaConnectivityButton.tsx` to trigger the check and surface a toast.
- Outcome: manual connectivity verification available from the UI without exposing secrets.

---

### Entry 4 — Is data getting fed

- Date: 26/06/2026
- Requested by: Actual User

Prompt:
> "is the data from the api getting feeded"

Actions and changes implemented:
- Inspected server function logs; found `POST` returning status 0.
- Diagnosed base URL `http://20.20.20.52` as an RFC1918 private address unreachable from the Cloudflare Worker runtime.
- Switched base URL to the public tunnel and updated `.env` accordingly.
- Outcome: store no longer permanently falls back to mock.

---

### Entry 5 — Confirm live data and map user 420

- Date: 26/06/2026
- Requested by: Actual User

Prompts:
> "is right now the data on the dashboard according to the API , can you confirm that?"
> "yes , i want the dashboard to use live data from the API"
> "420 , fy_start: 22 and fy_end 23"

Actions and changes implemented:
- Ran `curl` probes against `listPerformanceMetrics` and `runMetric`.
- Verified `partner_user_id=420` returned ₹18.79 Cr (FY22-23) and ₹14.21 Cr (FY21-22).
- Updated `src/data/lcmsUserMap.json` to map `p-001` and `p-002` to `420`.
- Confirmed `src/data/apiMetricMap.json` values matched the API columns.
- Outcome: FH-01 rendered live YoY on the dashboard.

---

### Entry 6 — User-supplied map update

- Date: 26/06/2026
- Requested by: Actual User

Prompt:
> "i have changed the src/data/apiMetricMap.json src/data/lcmsUserMap.json , can you tell me if live is getting fethced from the API"

Actions and changes implemented:
- No file changes.
- Ran `curl` sweeps for each mapped person id and documented per-person live values (for example p-001 → uid 420 Charanya L, ₹18.79 Cr FY22-23).
- Outcome: user's edits confirmed working.

---

### Entry 7 — Headline metrics only, single-profile demo

- Date: 28/06/2026 (approx.)
- Requested by: Actual User

Prompt (paraphrased from discussion):
> Keep API calls within replica-db-api rate limits by fetching only headline metrics per profile.

Actions and changes implemented in `src/lib/api/metrics.functions.ts`:
- Set `HEADLINE_METRIC_IDS = ["FH-01", "FH-08", "CM-03"]`.
- `fetchMetricsForPerson` accepts optional `metricIds` and `includePriorYear`.
- `getPersonMetrics` input validator extended with `metricIds` and `includePriorYear`.
- Outcome: profile pages hydrate quickly; full metric fan-out is opt-in.

---

### Entry 8 — Implement the LKS firm hierarchy

- Date: 29/06/2026
- Requested by: Actual User

Prompt:
> "Implement this hierarchy on the dashboard." (with `LKS_Firm_Hierarchy_1.xlsx` attached)

Follow-up chosen:
> "Hierarchy scope: Replace people across the dashboard, keep live metrics by name match."

Actions and changes implemented:
- Added `scripts/generateLksHierarchy.py` to parse the "Complete Hierarchy" and "Summary" sheets (439 people; 10 practice heads, 58 partners, 374 associates).
- Emitted `src/data/lksHierarchy.json`; wired `src/data/mockPeople.ts` and `src/data/people.ts` to it.
- Preserved live-metric wiring for the 137 people with an LCMS name match.
- Outcome: dashboard renders against the real firm structure; existing live metric flow retained where names match.

---

### Entry 9 — Load FY25-26 data for L Badrinarayanan and team

- Date: 29/06/2026
- Requested by: Actual User

Prompt:
> "Load the data via API for FY25-26 For L Badrinarayan and his team/ people working under him / reporting to him"

Actions and changes implemented in `src/lib/api/metrics.functions.ts`:
- Fiscal constants updated to FY2025-26 (`FY_START=2025-04-01`, `FY_END=2026-04-01`; prior-year window `2024-04-01`/`2025-04-01`).
- `CONCURRENCY` raised from 2 to 3.
- Added `getTeamMetrics` server function that walks the supervisor graph downward from `rootPersonId`.
- Auto-fetched on mount for every practice-head profile.
- Verification: preview run returned 42 live values for a 56-person team in ~15 seconds.
- Outcome: Badri's team page shows live FY25-26 data.

---

### Entry 10 — Reference metric comparison and full scorecard mapping

- Date: 29/06/2026
- Requested by: Actual User

Prompt (paraphrased): two reference tables provided (FH-01, FH-07, FH-08, FH-10, FH-12, FH-13, FH-14, FH-16, FH-17, FH-18, FH-19, CM-01, CM-02, and more) with an ask to compare API output to reference and complete the missing mappings.

Actions and changes implemented:
- `src/data/lcmsUserMap.json`: added `lks-1130` → LCMS `378` (L Badrinarayanan).
- `src/lib/api/transformMetric.ts`: refactored to apply `scale`, `valueColumn`, `altColumns`, `combineColumns`, and `multiRow` per mapping metadata.
- `src/data/apiMetricMap.json`: metadata expanded for the 23 scorecard metrics.
- Verification: API values matched reference for FH-01 ₹24.48 Cr, FH-07 100.0%, FH-08 90.2%, and nine other spot-checked metrics.
- Outcome: full 23-metric scorecard renders correctly for Badri; three known mapping issues flagged (FH-12 unit and two others).

---

### Entry 11 — Verify page for `lks-1130`

- Date: 29/06/2026
- Requested by: Actual User

Prompt (paraphrased): give a diagnostic page listing expected vs. API value for every mapped metric.

Actions and changes implemented:
- Added `src/routes/_authenticated/verify.$personId.tsx` and `src/pages/Verify/VerifyView.tsx`.
- Page shows: expected value, API value, RAG badge, column picked, scale applied, raw API endpoint id, raw first row.
- Outcome: single-screen diagnostic for the 23 mapped metrics.

---

### Entry 12 — Verify page timeout refactor

- Date: 29/06/2026
- Requested by: Actual User

Prompt (paraphrased): verify page times out under the Worker runtime limit.

Actions and changes implemented in `src/lib/api/metrics.functions.ts`:
- Removed batch `verifyPersonMetrics`.
- Added `verifyOnePersonMetric` (one metric per call) and `listVerifyMetricIds` (returns mapped ids for a person).
- Client fires 23 parallel calls; the UI fills in progressively even under replica-api rate limits.
- Outcome: verify page loads reliably; no single-request timeouts.

---

### Entry 13 — Remove existing data, keep 442 people, ingest Badri's team

- Date: 30/06/2026
- Requested by: Actual User

Prompt:
> "Remove the exiting data on the dashboard. Remove the people who are not in the uploaded hierarchy. Then ingest the data for L badrinarayan ( LCMS ID - 378) and his team."

Follow-up answers:
- People scope: keep all 442 hierarchy people; only Badri's tree has live data.
- Mock metric data: remove for Badri's team only; keep mock for everyone else.
- Ingestion trigger: on-demand when the page loads, per person, streamed like the verify page.

Actions and changes implemented:
- New `src/data/badriSubtree.ts`: computes the subtree rooted at `lks-1130` via DFS over `lksHierarchy.json`; exports `badriSubtreeIds` (ReadonlySet) and `isInBadriSubtree(id)`.
- `src/data/mockMetricValues.ts`: mock rows stripped for any `personId` in the Badri subtree.
- `src/store/dashboardStore.ts`: added `loadPersonMetrics(personId)` and `loadTeamMetrics(rootPersonId)`; both merge only the affected slice; Badri subtree fetches the full mapped metric set, others keep the headline default.
- `src/routeTree.gen.ts`: regenerated for the new route surface.
- Outcome: 442 people preserved; Badri's tree is live-only; everyone else keeps mock for visual continuity.

---

### Entry 14 — API endpoint follows hierarchy designation

- Date: 30/06/2026
- Requested by: Actual User

Prompt:
> "The api endpoint used should be according to the designation of the person in the hierarchy file, use that matching technique to figure out which api endpoint to be used."

Actions and changes implemented:
- `src/types/people.ts`: added optional `designation` to `Person`.
- `src/data/mockPeople.ts`: populated `designation` from the hierarchy row.
- `src/lib/api/metricRegistry.ts`: added `designationToApiRole(designation)`; `getMetricMapping` and `listMappedPortalMetricIds` accept `Role | RoleKey`.
- `src/lib/api/metrics.functions.ts`: `resolvePerson` uses `designationToApiRole(person.designation) ?? person.role`.
- `src/store/dashboardStore.ts`: mirrors the same rule when choosing metric ids to request.
- Outcome: endpoint variant now driven by hierarchy designation.

---

### Entry 15 — Designation mapping refinement (group heads are equity partners)

- Date: 30/06/2026
- Requested by: Actual User

Prompts:
> "Equity partner - Principal Partner / Partner - all partner designations except principal partner / Associate - all associate designations"

Clarification chosen:
> "Let group heads be equity partner"

Actions and changes implemented in `src/lib/api/metricRegistry.ts`:
- Removed `designationToApiRole`.
- Added `resolveApiRole(role, designation)`:
  - `role === "practice_head"` → `practice_head` (equity-partner endpoints).
  - Executive Partner, Senior Partner, Partner, Associate Partner → `partner` endpoints.
  - Principal Associate, Senior Associate, Associate, Associate Director, Director, Consultant, Of Counsel → `associate` endpoints.
- `src/lib/api/metrics.functions.ts` and `src/store/dashboardStore.ts` updated to import and call `resolveApiRole`.
- Verification: typecheck passed.
- Outcome: endpoint variant follows group-head status plus designation; no user maps to equity-partner endpoints purely by designation string.

---

## Files touched (cumulative)

| Area | Files |
| --- | --- |
| Config and secrets | `.env`, `src/lib/config.server.ts` |
| Server-side API | `src/lib/api/replica-api.server.ts`, `src/lib/api/metrics.functions.ts`, `src/lib/api/connectivity.functions.ts`, `src/lib/api/healthcheck.ts`, `src/lib/api/transformMetric.ts`, `src/lib/api/metricRegistry.ts` |
| Data | `src/data/apiMetricMap.json`, `src/data/lcmsUserMap.json`, `src/data/lksHierarchy.json`, `src/data/mockPeople.ts`, `src/data/mockMetricValues.ts`, `src/data/badriSubtree.ts` |
| Store | `src/store/dashboardStore.ts` |
| Types | `src/types/people.ts` |
| UI | `src/components/admin/ReplicaConnectivityButton.tsx`, `src/pages/Verify/VerifyView.tsx`, `src/routes/_authenticated/verify.$personId.tsx` |
| Tooling | `scripts/generateLksHierarchy.py`, `src/routeTree.gen.ts` (auto) |

## Open follow-ups

- FH-12 unit mismatch (API returns rupees, portal expects a per-lawyer figure) and the other two mapping issues flagged on the verify page.
- Mock metric values are retained for everyone outside the Badri subtree; revisit when more LCMS name matches are confirmed.
- Only practice-head profiles auto-fetch team metrics on mount; partner and associate profiles fetch on demand via `loadPersonMetrics`.
