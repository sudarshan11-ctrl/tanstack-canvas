# Responsive + zoom-proof refactor

Goal: no horizontal scrollbars, no overlaps, no clipping at any zoom level (50%–200%) or viewport (360px–1920px). Migrate from hardcoded `px` widths and flex-wrap-only layouts to fluid grid/flex + `rem` + `max-w-*` containers.

## Guiding rules (apply to every touched file)

1. Layout: `flex` / `grid` with `min-w-0` on every flex/grid text child; `shrink-0` on avatars, icons, dials.
2. Sizing: replace fixed `w-[NNNpx]` / `h-[NNNpx]` with Tailwind scale (`w-14`, `h-20`) or `min-w-0 w-full max-w-*`. Keep `px` only for hairlines (`h-px`, `border`) and true fixed graphics (dial SVG viewBox).
3. Typography: use `text-sm/base/lg/xl` + `leading-relaxed` or `leading-snug`; drop `text-[NNpx]`. Long strings get `truncate` or `break-words`.
4. Containers: every page root uses `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`. Replace `max-w-[1320px]` / `max-w-[1280px]`.
5. Media: `img` and SVG hosts get `max-w-full h-auto`; charts wrapped in `aspect-[16/9]` or `min-h-0` grid cells.
6. Overflow guard: add `overflow-x-hidden` to `<body>` in `__root.tsx`; tables get `overflow-x-auto` wrappers so only the table scrolls, never the page.

## Order of implementation

### Phase 1: Global foundations (1 pass, blocks nothing else)
- `src/styles.css`: set `html { font-size: 100%; }`, add `@utility fluid-container` for the standard `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` pattern, and add `body { overflow-x: hidden; }`.
- `src/routes/__root.tsx`: ensure viewport meta `width=device-width, initial-scale=1`.
- `src/components/layout/PageWrapper.tsx`: swap inner container to `fluid-container` utility. All pages inherit the fix.

### Phase 2: Shell (Sidebar, TopBar, Breadcrumbs)
- `src/components/layout/Sidebar.tsx`, `TopBar.tsx`, `Breadcrumbs.tsx`: convert fixed widths to `w-full md:w-64`, use `flex min-w-0`, truncate long labels.

### Phase 3: Hero + Match Centre (highest-visibility card)
- `src/components/ui/HeroHeader.tsx`: replace `p-6 gap-6` fixed values with responsive `p-4 sm:p-6 gap-4 sm:gap-6`; identity/stats/hygiene/LPI rows use `grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto]` with `min-w-0` on text side and `shrink-0` on stat/dial side. Drop `text-[NNpx]` in favor of Tailwind scale.
- `src/components/ui/HygieneMetricsPanel.tsx`: replace `min-w-[200px] max-w-[240px]` with `w-full sm:min-w-[14rem] sm:max-w-[16rem] flex-1`; inner grid `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`.
- `src/components/ipl/MatchCentreStrap.tsx`, `PlayerOfTheMatch.tsx`, `LPIDial.tsx`, `Sparkline.tsx`: SVGs get `w-full h-auto` with `viewBox`; wrapper cells become `min-h-0` grid children.

### Phase 4: League + tables
- `src/pages/FirmLanding/FirmLanding.tsx`: keep `grid-cols-1 lg:grid-cols-4` but add `min-w-0` on every `<section>`; drop custom max-w.
- `src/components/league/PracticeHeadLeagueTable.tsx`, `TeamTable.tsx`, `ipl/LeagueTable.tsx`, `squad/SquadRoster.tsx`: wrap `<table>` in `<div class="w-full overflow-x-auto">`; `table-auto w-full min-w-[40rem]` so the table (not the page) scrolls on narrow screens.

### Phase 5: Metric surfaces
- `src/components/metrics/*` (FirmMetricsExplorer, PrimaryMetricCard, PrimaryMetricGrid, SecondaryDriverList, CausalAlertTray, PerformanceRadar, CausalSubgraph, WhyIsThisRed): grids use `grid gap-4 sm:grid-cols-2 xl:grid-cols-3`; radar/graph SVGs wrapped in `aspect-square w-full max-w-md`.
- `src/pages/MetricDrilldown/index.tsx`, `MindMap/MindMap.tsx`: mindmap canvas gets `w-full h-[70vh]` instead of fixed px.

### Phase 6: People / Profile / Squad / Cohort / Partner / Associate views
- `src/pages/{ProfileCard,SquadView,PartnerView,AssociateView,CohortView,PracticeHeadView,PeopleList,FirmCommand,Verify,Settings}/*`: same treatment — swap `max-w-[NNNNpx]` and `text-[NNpx]`, add `min-w-0` on flex children, wrap tables.

### Phase 7: Verification
- Playwright zoom sweep at 50% / 100% / 150% / 200% on widths 360, 768, 1024, 1440, 1920.
- Assert: `document.documentElement.scrollWidth === clientWidth` (no horizontal scroll) and no element has `getBoundingClientRect().right > viewport`.
- Screenshot the hero, league table, metrics explorer, and mindmap at each breakpoint.

## Technical notes

- Do not touch business logic or data files (`src/data/**`, `src/utils/**`, `src/lib/**`, `src/store/**`).
- Do not touch auto-generated files (`src/routeTree.gen.ts`, `src/integrations/supabase/*`).
- Keep the CSS variables in `src/styles.css` (colors, radius, shadows) as-is; only add the container utility and the overflow guard.
- Inline `style={{ ... }}` blocks that carry design tokens (color, border) stay; only convert `width`/`height`/`padding`/`fontSize` inline styles to Tailwind classes.
- Icons keep numeric `size={N}` prop (Lucide expects a number and renders scalable SVG).

## Deliverables per phase

Each phase = one focused edit batch + a Playwright screenshot at 100% and 200% zoom on 1280 and 390 widths to prove no regression before moving on.

## Suggested execution order

Phase 1 → 2 → 3 → 4 → 5 → 6 → 7. Phases 1–2 unlock all pages; 3–6 are independent and can be reordered by user priority (recommend Hero first since it's the visible landing surface today).
