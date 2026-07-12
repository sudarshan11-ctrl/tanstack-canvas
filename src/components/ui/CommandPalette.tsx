import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, User, BarChart2, LayoutDashboard, X } from "lucide-react";
import { mockPeople } from "@/data/mockPeople";
import { mockMetricDefinitions } from "@/data/mockMetricDefinitions";

interface CommandItem {
  id: string;
  type: "person" | "metric" | "page";
  label: string;
  sublabel?: string;
  navigate: () => void;
}

const PAGES: Omit<CommandItem, "navigate">[] = [
  { id: "page-firm", type: "page", label: "Firm Landing", sublabel: "Home dashboard" },
  { id: "page-mindmap", type: "page", label: "Metrics Mind Map", sublabel: "Causal map" },
  { id: "page-practice-heads", type: "page", label: "Practice Heads", sublabel: "Roster" },
  { id: "page-partners", type: "page", label: "Partners", sublabel: "Roster" },
  { id: "page-associates", type: "page", label: "Associates", sublabel: "Roster" },
  { id: "page-settings", type: "page", label: "Settings", sublabel: "Weights · Appearance" },
];

const PAGE_ROUTES: Record<string, string> = {
  "page-firm": "/",
  "page-mindmap": "/mindmap",
  "page-practice-heads": "/practice-heads",
  "page-partners": "/partners",
  "page-associates": "/associates",
  "page-settings": "/settings",
};

const TYPE_ICON = {
  person: User,
  metric: BarChart2,
  page: LayoutDashboard,
} as const;

const TYPE_LABEL: Record<CommandItem["type"], string> = {
  person: "Person",
  metric: "Metric",
  page: "Page",
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const items: CommandItem[] = useMemo(() => {
    const people: CommandItem[] = mockPeople.map((p) => ({
      id: `person-${p.id}`,
      type: "person",
      label: p.name,
      sublabel: `${p.role.replace("_", " ")} · ${p.subPractice ?? ""}`,
      navigate: () => navigate({ to: "/profile/$id", params: { id: p.id } }),
    }));

    const metrics: CommandItem[] = mockMetricDefinitions.map((m) => ({
      id: `metric-${m.id}`,
      type: "metric",
      label: m.name,
      sublabel: m.id,
      navigate: () => navigate({ to: "/metric/$id", params: { id: m.id } }),
    }));

    const pages: CommandItem[] = PAGES.map((pg) => ({
      ...pg,
      navigate: () => navigate({ to: PAGE_ROUTES[pg.id] as never }),
    }));

    return [...pages, ...people, ...metrics];
  }, [navigate]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.sublabel ?? "").toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [query, items]);

  useEffect(() => {
    setCursor(0);
  }, [results]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const selectItem = useCallback(
    (item: CommandItem) => {
      item.navigate();
      onClose();
    },
    [onClose],
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      selectItem(results[cursor]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-[var(--radius)] shadow-2xl"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--line)",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <Search size={16} style={{ color: "var(--text-2)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search people, metrics, pages…"
            className="flex-1 bg-transparent text-[14px] focus:outline-none"
            style={{ color: "var(--text-1)" }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{ color: "var(--text-2)" }}
            >
              <X size={14} />
            </button>
          )}
          <kbd
            className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium sm:block"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text-2)",
              border: "1px solid var(--line)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div
              className="px-4 py-6 text-center text-[13px]"
              style={{ color: "var(--text-2)" }}
            >
              No results for "{query}"
            </div>
          ) : (
            results.map((item, i) => {
              const Icon = TYPE_ICON[item.type];
              const isActive = i === cursor;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--lks-accent)" : "transparent",
                    color: isActive ? "#ffffff" : "var(--text-1)",
                  }}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => selectItem(item)}
                >
                  <Icon
                    size={14}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "rgba(255,255,255,0.8)" : "var(--text-2)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{item.label}</div>
                    {item.sublabel && (
                      <div
                        className="truncate text-[11px]"
                        style={{ color: isActive ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}
                      >
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.2)"
                        : "var(--surface-2)",
                      color: isActive ? "rgba(255,255,255,0.8)" : "var(--text-2)",
                    }}
                  >
                    {TYPE_LABEL[item.type]}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-between border-t px-4 py-2"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-2)" }}>
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> open</span>
            <span><kbd className="font-mono">esc</kbd> close</span>
          </div>
          <span className="text-[10px]" style={{ color: "var(--text-2)" }}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
