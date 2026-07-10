
## Goal

Make every page hold its layout under any viewport width and any browser zoom level (50%–200%): no overlap, no clipped text, no unexpected horizontal scrollbars, and media that scales inside its parent.

## Guiding rules (apply to every touched file)

1. Layout with `flex` / `grid` only. Absolute positioning reserved for true overlays (tooltips, popovers, dial center labels), always pinned inside a `relative` parent.
2. No hard pixel sizes on layout containers. Replace `min-w-[1080px]`, `w-64`, `h-[...px]`, inline `style={{ width: 240 }}` etc. with `rem`, `%`, `min-w-0`, `basis-*`, `max-w-*`, or Tailwind spacing tokens. Pixels stay only for hairlines (1px borders), icons, avatars, and chart primitives (sparkline stroke).
3. Typography via Tailwind scale (`text-xs`…`text-2xl`) with `leading-*` and `truncate` / `break-words` where needed. Replace inline `fontSize: 13` style overrides.
4. Page shell uses `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` via `PageWrapper`.
5. Media: `img`, chart wrappers → `max-w-full h-auto` or an `aspect-*` box.
6. Every flex/grid text cell gets `min-w-0`; every fixed widget gets `shrink-0`; single-line headings get `truncate`. Multi-item header rows follow the pattern in `responsive-layout-patterns` (grid on mobile, flex at `sm:`).

## Order of work

### Phase 1: Foundation (shared shell + tokens)
- `src/components/layout/PageWrapper.tsx` — wrap `<main>` content in `max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8`; drop the `p-6` in favour of responsive padding; heading uses `text-2xl sm:text-3xl lg:text-[2rem]`.
- `src/components/layout/Sidebar.tsx` + `--sidebar-width` in `src/styles.css` — convert `240px` to `rem` (e.g. `15rem`) so it scales with root font-size on zoom.
- `src/components/layout/TopBar.tsx`, `Breadcrumbs.tsx` — audit for fixed widths; add `min-w-0` + `truncate` on title slots.
- `src/styles.css` — add global rules: `html { overflow-x: hidden; }`, `img, svg, video { max-width: 100%; height: auto; }`, and register a `.no-scrollbar` utility for horizontal scroll shelves.

### Phase 2: Hero / header row (highest-visibility, currently pixel-heavy)
- `src/components/ui/HeroHeader.tsx` — convert the two-row layout to `grid grid-cols-[minmax(0,1fr)_auto] gap-4 sm:flex sm:flex-wrap`, add `min-w-0` on identity zone, `shrink-0` on hygiene/dial, `truncate` on name, replace inline `style={{ fontSize }}` with `text-*`.
- `src/components/ui/HygieneMetricsPanel.tsx` — drop `max-w-[280px]`, use `w-full sm:max-w-xs`, replace `px-3 py-2` inline sizes with tokens only.
- `src/components/ui/Sparkline.tsx` + LPI dial — wrap in `aspect-[3/1]` / `aspect-square` box so SVG scales via `width="100%" height="100%"` instead of fixed px height.

### Phase 3: Data-dense tables and grids
- `src/components/league/PracticeHeadLeagueTable.tsx` — replace `min-w-[1080px]` with `min-w-[64rem]` (or drop entirely and switch to a responsive grid that stacks columns under `md`). Column template moves from mixed `px` to `fr` + `minmax(0,*)`. Search input `w-64` → `w-full sm:w-64`.
- `src/components/league/TeamTable.tsx`, `src/components/ipl/LeagueTable.tsx` — same treatment.
- `src/components/metrics/FirmMetricsExplorer.tsx` — `min-w-[960px]` → `min-w-[60rem]`; row grid uses `minmax(0,*)`; badges wrap instead of clipping.
- `src/components/metrics/PrimaryMetricGrid.tsx`, `PrimaryMetricCard.tsx`, `SecondaryDriverList.tsx` — grid becomes `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4`, cards get `min-w-0`, numbers get `tabular` + `truncate`.
- `src/pages/MindMap/MindMap.tsx` — audit primary/secondary card blocks for fixed widths; align with grid rules above.

### Phase 4: Page-level surfaces
Sweep each page for pixel widths, absolute positioning, and horizontal overflow. One pass per file, verify at 720px and 200% zoom:
- `src/pages/FirmLanding/FirmLanding.tsx`
- `src/pages/PracticeHeadView/PracticeHeadView.tsx`
- `src/pages/PartnerView/PartnerView.tsx`
- `src/pages/AssociateView/AssociateView.tsx`
- `src/pages/SquadView/SquadView.tsx`
- `src/pages/CohortView/CohortView.tsx`
- `src/pages/PeopleList/PeopleList.tsx`
- `src/pages/MetricDrilldown/index.tsx`
- `src/pages/ProfileCard/ProfileCard.tsx`
- `src/pages/Settings/*`

### Phase 5: Verification
- Playwright script under `/tmp/browser/responsive/`: load Firm Landing, PH view, Partner view, Metric drilldown, MindMap at viewports 360, 720, 1024, 1440 and at simulated zoom (via `deviceScaleFactor` + reduced viewport). Screenshot each; assert `document.documentElement.scrollWidth <= innerWidth` on every page.
- Manual check on the current preview (720×589) that no page produces a horizontal scrollbar on the body and that HeroHeader/tables no longer clip.

## Technical notes

- Keep the existing design tokens (`--surface`, `--line`, `--text-*`) untouched — this is purely a sizing / structural pass, no color or typography redesign.
- Horizontal scroll on very wide tables is acceptable *inside* their card (`overflow-x-auto` + `min-w-[…rem]`), but must never bleed to the page body. Confirm every such wrapper has a `max-w-full` parent.
- Do not switch the `px` used inside `<svg>` viewBox math, stroke widths, or icon `size={}` props — those are correct pixel primitives.
- Ban new inline `style={{ width|height|fontSize|padding|margin: <number> }}` in touched files; move to Tailwind classes.
- Total scope is presentation-only; no data, routing, or business-logic changes.

## Deliverable per phase

Each phase is a separate build turn with: (a) the file edits, (b) a Playwright screenshot pass at 360 / 1024 / 1440 widths, (c) a short PASS/FAIL note per page touched.
