import { Link, useLocation, useParams } from "@tanstack/react-router";
import { ChevronRight, Download, Search } from "lucide-react";
import { mockPeople } from "@/data/mockPeople";
import { snapshotInfo } from "@/data/snapshotMetricValues";
import { formatPeriod, formatSyncedAt } from "@/utils/format";
import type { Role } from "@/types";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";

const ROLE_LABEL: Record<Role | "all", string> = {
  all: "All Roles",
  practice_head: "Practice Heads",
  partner: "Partners",
  associate: "Associates",
};

const PERIOD = snapshotInfo.period;
const PERIOD_LABEL = formatPeriod(PERIOD);
const LAST_SYNC_ISO = snapshotInfo.fetchedAt ?? new Date(0).toISOString();
const LAST_SYNC_DISPLAY = formatSyncedAt(snapshotInfo.fetchedAt);

function freshnessTone(iso: string): { color: string; bg: string } {
  const ageHours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (ageHours < 24) return { color: "var(--rag-green)", bg: "color-mix(in srgb, var(--rag-green) 12%, transparent)" };
  if (ageHours < 24 * 7) return { color: "var(--rag-amber)", bg: "color-mix(in srgb, var(--rag-amber) 12%, transparent)" };
  return { color: "var(--rag-red)", bg: "color-mix(in srgb, var(--rag-red) 12%, transparent)" };
}

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent);

interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

function useBreadcrumb(): Crumb[] {
  const { pathname } = useLocation();
  const params = useParams({ strict: false }) as {
    role?: string;
    id?: string;
  };

  const crumbs: Crumb[] = [{ label: "Firm", to: "/" }];

  if (pathname.startsWith("/cohort") || pathname.startsWith("/profile")) {
    crumbs.push({ label: "Cohorts" });

    let role: Role | "all" | undefined;
    if (pathname.startsWith("/cohort") && params.role) {
      role =
        params.role === "practice_head" ||
        params.role === "partner" ||
        params.role === "associate"
          ? params.role
          : "all";
    }
    if (pathname.startsWith("/profile") && params.id) {
      const person = mockPeople.find((p) => p.id === params.id);
      role = person?.role;
    }
    if (role) {
      crumbs.push({
        label: ROLE_LABEL[role],
        to: "/cohort/$role",
        params: { role },
      });
    }
    if (pathname.startsWith("/profile") && params.id) {
      const person = mockPeople.find((p) => p.id === params.id);
      if (person) crumbs.push({ label: person.name });
    }
  } else if (pathname.startsWith("/metric") && params.id) {
    crumbs.push({ label: "Metric" }, { label: params.id });
  } else if (pathname.startsWith("/settings")) {
    crumbs.push({ label: "Settings" });
  }

  return crumbs;
}

export default function TopBar() {
  const crumbs = useBreadcrumb();
  const tone = freshnessTone(LAST_SYNC_ISO);

  return (
    <header
      className="sticky top-0 z-10 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2 sm:flex-nowrap sm:px-6"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--line)",
        transition: "background-color 150ms ease, border-color 150ms ease",
      }}
    >
      {/* Breadcrumb */}
      <nav
        className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[12px]"
        style={{ color: "var(--text-2)" }}
      >
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          const node =
            c.to && !isLast ? (
              <Link
                to={c.to}
                params={c.params as never}
                style={{ color: "var(--text-2)" }}
                className="max-w-[10rem] truncate transition-colors hover:opacity-80"
              >
                {c.label}
              </Link>
            ) : (
              <span
                style={{ color: isLast ? "var(--text-1)" : "var(--text-2)" }}
                className={`max-w-[12rem] truncate ${isLast ? "font-medium" : ""}`}
              >
                {c.label}
              </span>
            );
          return (
            <span key={i} className="flex min-w-0 items-center gap-1">
              {i > 0 && (
                <ChevronRight size={14} className="shrink-0" style={{ color: "var(--line)" }} />
              )}
              {node}
            </span>
          );
        })}
      </nav>

      {/* Right cluster */}
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        {/* Cmd+K search hint */}
        <button
          type="button"
          className="hidden shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-[12px] transition-colors md:flex"
          style={{
            backgroundColor: "var(--surface-2)",
            color: "var(--text-2)",
            border: "1px solid var(--line)",
          }}
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
            );
          }}
        >
          <Search size={12} />
          <span>Search</span>
          <kbd
            className="rounded px-1 text-[10px] font-medium"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)" }}
          >
            {IS_MAC ? "⌘K" : "Ctrl+K"}
          </kbd>
        </button>
        {/* Freshness pill */}
        <span
          className="hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium sm:inline-flex"
          style={{ color: tone.color, backgroundColor: tone.bg }}
          title={`API snapshot · ${snapshotInfo.okCount} values for ${snapshotInfo.peopleCount} people · synced ${LAST_SYNC_DISPLAY}`}
        >
          <span
            className="inline-block rounded-full"
            style={{ width: 6, height: 6, backgroundColor: tone.color }}
          />
          Snapshot
        </span>

        {/* Period selector */}
        <select
          className="max-w-[8rem] shrink-0 truncate rounded-md border px-2 py-1 text-[12px] transition-colors"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--line)",
            color: "var(--text-1)",
          }}
          defaultValue={PERIOD}
          aria-label="Fiscal period"
        >
          <option value={PERIOD}>{PERIOD_LABEL}</option>
        </select>

        {/* Export button */}
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export {PERIOD_LABEL} (CSV)</span>
          <span className="sm:hidden">Export</span>
        </button>

        {/* Theme switcher */}
        <ThemeSwitcher />
      </div>
    </header>
  );
}
