# LKS Performance Dashboard — Implementation Guide for Lovable

This document is written as a build brief. Part 1 specifies the theming system: **Powerplay Bento is the default theme**, with **Broadcast Night** (dark mode) and **Counsel Ledger** (brand-classic mode) as user-selectable alternatives. Part 2 contains the full UI/UX recommendations to implement alongside the themes.

Stack context: React 19, TanStack Start + Router, Tailwind CSS v4, Zustand, Recharts, lucide-react.

---

# PART 1 — THEMING SYSTEM

## 1.1 Architecture

Implement theming with CSS custom properties on the `<html>` element, switched by a `data-theme` attribute. Do NOT hardcode any colour in components; every colour must come from a token.

- `data-theme="bento"` → **Powerplay Bento** (DEFAULT — the app must load with this)
- `data-theme="night"` → **Broadcast Night** (functions as the app's dark mode)
- `data-theme="ledger"` → **Counsel Ledger** (light, brand-classic mode)

Requirements:

1. Define all tokens in Tailwind v4 `@theme` / `:root` blocks, one block per `[data-theme="..."]` selector, so Tailwind utilities like `bg-surface`, `text-primary`, `border-line` resolve per theme.
2. Persist the user's choice in the Zustand store (persisted to localStorage key `lks-theme`) and apply it on boot before first paint to avoid a flash of the wrong theme.
3. If no saved preference exists: default to `bento`, but if the OS reports `prefers-color-scheme: dark`, default to `night`.
4. Theme switching must be instant (no reload) and must transition background/text colours over 150ms.
5. Charts (Recharts) must read colours from CSS variables (via `getComputedStyle` or a `useThemeTokens()` hook), not from constants, so they re-theme correctly.

## 1.2 Theme switcher UI

Place the switcher in two locations:

- **TopBar**: a compact icon button (sun/moon/palette from lucide) opening a small popover with the three options, each showing a 3-swatch preview strip + name + one-line description.
- **Settings page**: a full "Appearance" section with three preview cards (a miniature mock of the header in each theme), the active one ringed in the theme's accent. Labels:
  - "Powerplay Bento — Default · modern product view"
  - "Broadcast Night — Dark mode · match-centre view"
  - "Counsel Ledger — Classic · lkslaw.com brand view"

The selection applies immediately on click; show a toast "Theme changed to {name}".

## 1.3 Brand constants (shared by all themes)

These come from lkslaw.com and never change between themes:

| Token | Value | Meaning |
|---|---|---|
| `--brand-ink` | `#101010` | LKS header black |
| `--brand-paper` | `#FFFFFF` | Paper white |
| `--brand-panel` | `#F1F1F1` | Panel grey |
| `--brand-orange` | `#ED7524` | LKS highlight orange |
| `--brand-blue` | `#2F3FB6` | LKS CTA royal blue |

**Global rule (all themes): LKS Orange is a brand/interaction colour, NEVER a status colour.** RAG amber is always a distinct golden/ochre tone, and every RAG indicator pairs colour with a shape: green = circle, amber = triangle, red = square (or equivalent icon), so colour-blind users and orange/amber confusion are both handled.

## 1.4 Typography (shared by all themes)

- Display face: **Playfair Display** (700) — used for page titles, person names in hero headers, and the large LPI numeral. In `bento` it appears in exactly one place per page (the page title + hero name); in `ledger` it is used most broadly (all section headings); in `night` it is used for names and headline numerals.
- Body/UI face: **Inter** 400/500/600.
- All numerals in tables, dials, and straps: `font-variant-numeric: tabular-nums`.
- Metric IDs (FH-01, GP-06): a mono face (Geist Mono or JetBrains Mono).
- Type scale (px): 12 (eyebrows/labels, uppercase, tracked), 13 (table body), 14 (default body), 16 (card titles), 20 (page meta), 26 (metric names), 32–34 (hero LPI numeral only). No ad-hoc sizes.
- Load both fonts from Google Fonts with `display=swap`.

## 1.5 Token tables per theme

### THEME `bento` — Powerplay Bento (DEFAULT)

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#F4F5F7` | App background (derived from Panel Grey) |
| `--surface` | `#FFFFFF` | Cards / tiles |
| `--surface-2` | `#EFF1F5` | Insets, hover fills, table header |
| `--line` | `#E4E6EA` | Borders / hairlines |
| `--text-1` | `#141414` | Primary text |
| `--text-2` | `#6E7276` | Secondary text |
| `--accent` | `#2F3FB6` | PRIMARY accent: buttons, links, focus, selected, sparklines |
| `--highlight` | `#ED7524` | Player of the Match, ticker items, record highs ONLY |
| `--strap-bg` | `#101010` | MatchCentreStrap tile |
| `--strap-text` | `#ED7524` | Strap numerals |
| `--rag-green` | `#18A957` | |
| `--rag-amber` | `#E0A400` | Caution Gold (≠ orange) |
| `--rag-red` | `#E13F3F` | |
| `--area-financial` | `#C97A2E` | Area colours: OKLCH-balanced satellites of the brand hues |
| `--area-growth` | `#4656C8` | |
| `--area-people` | `#7E6BD9` | |
| `--area-ops` | `#9A8A2E` | |
| `--area-client` | `#2E9A8A` | |

Shape & depth: radius 14px tiles / 8px inputs; shadow `0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06)` plus 1px `--line` border; hover lifts tiles 2px. Hero tile carries a faint ink→blue top-edge gradient. Overlays: subtle glass (backdrop-blur 12px, 85% white). Area chips: full-strength colour in charts, 8% tint as chip background; when a RAG state is present on the same element, the area chip drops to its tint so status always wins saturation.

### THEME `night` — Broadcast Night (dark mode)

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#101010` | App background (brand ink) |
| `--surface` | `#1C1C1C` | Cards |
| `--surface-2` | `#282828` | Insets / hover |
| `--line` | `#303030` | Borders |
| `--text-1` | `#F5F5F5` | Primary text |
| `--text-2` | `#9A9A9A` | Secondary text |
| `--accent` | `#ED7524` | PRIMARY accent: scores, live states, dial sweep, active nav |
| `--highlight` | `#98A2F5` | Links / interactive secondary (lightened CTA blue) |
| `--cta` | `#2F3FB6` | Filled buttons (white label) |
| `--strap-bg` | `#000000` | Strap: pure-black broadcast lower-third |
| `--strap-text` | `#ED7524` | Strap numerals |
| `--rag-green` | `#34C77B` | |
| `--rag-amber` | `#F2C230` | Caution Gold (≠ orange) |
| `--rag-red` | `#FF5A52` | |
| `--area-financial` | `#F0A468` | Lightened tints for dark ground |
| `--area-growth` | `#98A2F5` | |
| `--area-people` | `#C9B8F0` | |
| `--area-ops` | `#D9D9D9` | |
| `--area-client` | `#8FCBB8` | |

Shape & depth: radius 10px cards / 6px chips; NO shadows — depth from the three ink steps + 1px borders. Focus/hover = 2px orange outline glow `0 0 0 3px rgba(237,117,36,.25)`. LPI dial sweeps 260° in orange on load (600ms, respects `prefers-reduced-motion`). Signature element: a live alert ticker under the TopBar (white serif items on ink, active item underlined in orange), each item deep-linking to its metric.

### THEME `ledger` — Counsel Ledger (brand-classic light)

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#FFFFFF` | App background |
| `--surface` | `#FFFFFF` | Cards (border-defined) |
| `--surface-2` | `#F1F1F1` | Panel Grey: sidebar, section panels |
| `--line` | `#E3E3E3` | Hairline rules |
| `--text-1` | `#141414` | Primary text |
| `--text-2` | `#6E6E6E` | Secondary text |
| `--accent` | `#ED7524` | Active nav/filters (orange underline like the site's 'Who We Are'), highlights |
| `--cta` | `#2F3FB6` | The ONLY filled button colour (white label) |
| `--strap-bg` | `#101010` | Strap: ink band on paper |
| `--strap-text` | `#ED7524` | Strap numerals; micro-labels white |
| `--rag-green` | `#1F8A4C` | |
| `--rag-amber` | `#C98A00` | Caution Ochre (≠ orange) |
| `--rag-red` | `#C0392E` | |
| `--area-financial` | `#8A6E4B` | Quiet editorial tones, used only as 3px left borders + labels, never fills |
| `--area-growth` | `#4B5FA8` | |
| `--area-people` | `#7A5C8F` | |
| `--area-ops` | `#B0691F` | |
| `--area-client` | `#3E7D74` | |

Shape & depth: radius 6px, near-flat; hairline borders; no shadows except one soft ambient on overlays; card padding 28px, section gaps 40px; body text 15px, tables 13.5px, line-height 1.6. Signature element: "ledger lines" — every aggregate score is underlined with a fine double hairline and hovering it opens a footnote-style popover showing exactly how the number was computed.

## 1.6 Component behaviour across themes

| Component | bento (default) | night | ledger |
|---|---|---|---|
| Primary button | Filled `--accent` blue | Filled `--cta` blue | Filled `--cta` blue (only filled element) |
| Links / active nav | Blue | Light blue `--highlight` | Orange underline |
| LPI dial arc | Blue, sparkline behind numeral | Orange 260° sweep | Thin orange arc, serif numeral |
| MatchCentreStrap | Ink tile, orange numerals | Pure-black band, orange numerals | Ink band on paper, orange numerals |
| Player of the Match | Orange badge/ribbon | Orange + serif card | Orange label, hairline card |
| Mind map (React Flow) | White pill nodes, blue hovered chains, orange PoM badges | Chamber-grey pills, orange-lit chains, blue selected | Ink text nodes, orange hovered chains, blue selected ring |
| Table hover | Lift 2px + `--surface-2` | `--surface-2` fill + orange left edge | `--surface-2` fill |

Every component must render correctly in all three themes — test each page in each theme before finishing.

## 1.7 Motion policy (all themes)

Micro-interactions ≤ 200ms; exactly one orchestrated moment per page (dial sweep / number tick-up on load); full `prefers-reduced-motion` support that swaps animation for instant state; theme transition 150ms on background/text only.

---

# PART 2 — UI/UX RECOMMENDATIONS TO IMPLEMENT

These are the improvements from the redesign review. Implement them on top of the theming system above. Where a recommendation mentions colour, use the tokens from Part 1.

## 2.1 Overall theme

Commit to the cricket match-centre metaphor visually, not just verbally. The dark `night` theme is the immersive "match centre" tier for command surfaces (Firm Landing, Squad View, Mind Map); `bento` and `ledger` are the calm "office" tiers for long reading and admin. Define everything as tokens (done in Part 1); introduce a proper elevation system with at most two levels (flat card, raised card/overlay); depth comes from borders + background shifts, not heavy shadows.

## 2.2 CTAs

Establish a three-tier action system. Primary actions (one per screen at most): a filled high-contrast button — "Recalculate all scores" on Settings, "Export FY 2022–23 snapshot (CSV)" on the TopBar (wire it to a real CSV export of the current view), "Drill into metrics" on Profile. Secondary actions: outlined/tonal buttons (e.g. "Clear context" on Metric Drilldown, currently an easy-to-miss text link). Tertiary: text links with underline-on-hover for back links.

Every CTA label says exactly what happens. Remove the instructional helper line on Firm Landing ("Click any practice-head row to drill…") and build the affordance into the rows: right-edge chevron, hover lift, and a "View squad" ghost button appearing on hover/focus. Inactive metric cards should show "No data yet · Request upload" (role-permitting) instead of a dead "No data".

## 2.3 Flows / workflows

Add three missing workflows. Lateral movement: a sibling switcher in each hierarchy header ("Partner 3 of 7 in Kavita's squad", with prev/next and a dropdown). Compare: allow selecting two people or squads from any table and opening a side-by-side comparison (two dials, mirrored competency wheels, delta table) at `/compare?ids=a,b`. Close the loop: an action tray on Metric Drilldown and Profile — flag for review, add a note, share snapshot (local state is fine initially).

Add a Cmd/Ctrl-K command palette searching people, metrics and pages (styled per theme; in `bento` the selected row uses the CTA-blue fill). Add one-time coach marks explaining the metaphor ("wickets = red primary metrics, RRR = target pace") so helper sentences can be deleted from body copy.

## 2.4 Routes

Rename `/ep/$epId` to `/ph/$phId` with a redirect from the old segment. Make `/` the single firm view and redirect `/firm` to it. Fold `/squad/$epId` into the PH view as a tab (`/ph/$phId?view=squad`). Keep the `?from=` context param on `/metric/$id`; additionally mirror Cohort View's role/pillar/sort filters into validated search params so every view state is shareable by URL. Add `/compare` and a proper `$404` route.

## 2.5 Cosmetic changes — colour, type, sizing

Colour and type are fully specified in Part 1. Additional rules: 4px spacing grid; card padding 20/24px (28px in `ledger`); one radius token per tier per theme; replace hover shadows with border-emphasis + 2px translate-y lift; sidebar 240px, collapsible to icon rails; verify all RAG pairs against colour-blindness (shape coding is mandatory, already specified).

## 2.6 Header cards on main pages

Build ONE `HeroHeader` component used by Firm Landing, PH, Partner, Associate, Profile and Squad views, with three fixed zones: identity left (initials, eyebrow role label, serif name, context chips), score centre-right (LPIDial `lg` with the RAG state ringed into the dial), and the MatchCentreStrap as a full-width footer band inside the card — dark strip, tabular numerals, four fixed cells (Innings · RRR · Projection · Wickets) with micro-labels. In `bento`, the stats (Self PI, Team PI, roster size, wickets) render as small equal tiles inside the header (bento band), and a 30/90-day sparkline sits behind/beside the dial. On Firm Landing the header also surfaces the single most important alert ("3 primary metrics in red — worst: FH-08 Realization") as a clickable line.

## 2.7 Router pages (page-by-page)

Firm Landing: bento grid on wide screens — hero full-width, league table two-thirds, Player of the Match as a one-third column of match-card-styled highlight tiles, metrics explorer full-width below. Roster pages: density toggle (comfortable/compact), sticky header row, column-level RAG filtering, "expand all" for report rows. Cohort View: keep the mini bar chart with median reference line; add box/violin summary per role; virtualise the ranked list. Metric Drilldown: split the long scroll into tabs (Overview · Drivers · By squad · Leaders/Laggards · Causality) under a persistent header card. Profile Card: fold sections 5–7 (wheel, alerts, WhyIsThisRed) into a two-tab lower half ("Competency" / "Diagnosis"). Squad View: becomes the PH view's "Match centre" tab, keeping its narrative styling.

## 2.8 Mind map visualisation

Replace the current card grids with a real interactive graph using **React Flow (xyflow)** and a left-to-right dagre/ELK auto-layout: secondary levers left, primary outcomes right, edges weighted by causal degree. Nodes are compact metric chips coloured by area (per-theme tokens), badged with a small degree numeral; inactive metrics render ghosted with dashed borders. Hovering a node highlights its full upstream/downstream chain and dims everything else to 25%; clicking opens a side panel with the metric's sparkline, RAG distribution and an "Open drilldown" CTA. Keep the filter bar (role tabs, area chips, hide-no-data) as canvas controls; add zoom/fit/minimap and a "list view" toggle as the accessible/mobile fallback. Use the same React Flow setup for `CausalSubgraph` on Metric Drilldown. Curved edges; animated dash-flow only on the hovered chain.

## 2.9 Role views (PH, Partner, Associate)

Keep one shared skeleton but differentiate by need. PH view (portfolio): squad first — partner TeamTable directly under the hero, plus a squad heat strip (one row per partner, one cell per primary metric, RAG-coloured) for instant "where is the fire"; the PH's own metrics below as "Captain's own scorecard". Partner view (coaching): a "needs attention" callout naming the specific associates and drivers dragging Team PI, computed from the existing alert utilities. Associate view (self-development): Worst/Best drivers directly under the hero, per-metric trend sparklines, and a plain-language summary sentence at top ("Your index is 68, held down mainly by PO-04 and FH-09"). Surface the required run-rate targets (85/80/75) visibly on the strap ("Target 80 for Partners") and move the values into Settings. Cohort and Profile views use the same HeroHeader.

## 2.10 Settings page

Rework WeightManager: replace raw 0–100 sliders with a normalized allocation control — each role's weights as segments in a single horizontal stacked bar (colour = area) with drag handles between segments, so the 100% invariant is enforced by construction; numeric steppers beside each row for precision. Make the impact preview the star: a diverging "who moves" chart (people on y-axis, LPI delta on x, red left / green right) updating live as weights change. Add: a visible draft state ("Unsaved changes" bar with Apply / Discard), named presets ("FY 2022–23 official", "Growth-tilted trial") with the active preset stamped wherever LPI appears, and an audit line ("Weights last changed by … on …"). Add a second tab for the per-role RRR targets, and the "Appearance" theme section from Part 1.2.

## 2.11 Relationships between pages

One canonical page per entity: people live at `/profile/$id`; hierarchy views provide supervision context; the profile always links "View in squad context". Sidebar reflects state: when deep in Kavita's squad, her entry shows active with an indented mini-trail; the PH list becomes a collapsible "Squads" group; the sidebar collapses to icon rails on narrow widths. Strengthen cross-links: Metric Drilldown's "Breakdown by PH squad" bars click through to that squad with the metric context preserved (`/ph/$id?focus=FH-08`); Player of the Match cards deep-link to the metric that earned the tag; the breadcrumb crumbs offer sibling dropdowns.

## 2.12 Interaction rules and invariants

(a) Keyboard/focus parity: every row-click navigation is a real link (TanStack `<Link>`), reachable by keyboard with a visible focus ring. (b) One primary action per screen. (c) Status precedence: where RAG and area colour co-occur, RAG wins saturation; never encode two meanings in one hue; orange is never status. (d) Motion policy per Part 1.7. (e) URL is state: any filter that changes what the user sees appears in the URL. (f) Empty/error states are directive: "This associate is not on the FY 2022–23 roster · Back to squad". (g) Fallback honesty: remove ProfileCard's silent substitution of the first PH for an unknown id — show an explicit not-found. (h) Every number is inspectable: any aggregate (Team PI, wickets count) is hoverable to reveal its composition (in `ledger`, this is the footnote popover signature).

## 2.13 Data flows

Introduce TanStack Query as the fetching layer; keep Zustand strictly for client/UI state (draft weights, filters, theme, UI toggles). Derived aggregates (rollups, run rates, alerts) become selector functions or query-derived memos keyed by `(period, weightsVersion)` so switching FY or weight presets is a cache-key change. Parameterise all mock data and utilities by `period` now, making the period dropdown real and unlocking trend sparklines. Wire the freshness pill to the data layer's actual `dataUpdatedAt`. Wire Export to a client-side CSV snapshot of the current view (visible columns + active filters). Weight editor uses an explicit draftWeights → appliedWeights flow. Log a lightweight event stream (page views, metric drilldowns, weight changes) to console/localStorage as a governance seam.

## 2.14 Style / tone conventions

Sentence case; lucide-react icons only; no em dashes in UI copy. Voice: plain verbs from the reader's side of the screen; buttons name their outcome ("Recalculate scores"), never "Submit"/"OK"; an action keeps the same name through its whole flow. Metaphor discipline: cricket vocabulary exactly one layer deep — labels and the strap (wickets, RRR, innings, captain, player of the match) — never in explanatory or error copy; add a small glossary popover on the strap. Numbers: one formatter everywhere, tabular numerals, explicit units, signed deltas with direction icons, Indian currency format (₹, lakh/crore) if it matches firm convention. Dates: "31 Mar 2023, 18:00 IST", never numeric-slash. Empty/error tone: state what happened and the next action; never apologise, never joke. Keep the middle-dot SectionLabel pattern ("Player of the match · this period"). Document these conventions in a CONTRIBUTING-UI.md next to the token file.

## 2.15 Suggested implementation order

Phase 1 (foundation): token system + three themes + switcher + HeroHeader unification + route cleanup with redirects. Phase 2 (flows): command palette, sibling switcher, URL-ified filters, wired Export. Phase 3 (visualisation): React Flow mind map + causal subgraph, squad heat strip, Settings allocation bar with live impact chart. Phase 4 (data): TanStack Query seam, multi-period support, trend sparklines, compare view.
