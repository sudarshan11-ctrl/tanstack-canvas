import { Check } from "lucide-react";
import { useThemeStore, THEME_META, type Theme } from "@/store/themeStore";

const THEME_ORDER: Theme[] = ["bento", "night", "ledger"];

/** Miniature mock of the header in each theme */
function ThemePreviewCard({ id }: { id: Theme }) {
  const { theme, setTheme } = useThemeStore();
  const meta = THEME_META[id];
  const isActive = theme === id;

  const PREVIEW: Record<
    Theme,
    { bg: string; surface: string; text: string; accent: string; strap: string }
  > = {
    bento: {
      bg: "#f4f5f7",
      surface: "#ffffff",
      text: "#141414",
      accent: "#2f3fb6",
      strap: "#101010",
    },
    night: {
      bg: "#101010",
      surface: "#1c1c1c",
      text: "#f5f5f5",
      accent: "#ed7524",
      strap: "#000000",
    },
    ledger: {
      bg: "#ffffff",
      surface: "#ffffff",
      text: "#141414",
      accent: "#ed7524",
      strap: "#101010",
    },
  };

  const p = PREVIEW[id];

  return (
    <button
      type="button"
      onClick={() => setTheme(id)}
      className="group w-full overflow-hidden rounded-lg border-2 text-left transition-all"
      style={{
        borderColor: isActive ? "var(--lks-accent)" : "var(--line)",
        boxShadow: isActive
          ? "0 0 0 4px color-mix(in srgb, var(--lks-accent) 15%, transparent)"
          : undefined,
      }}
    >
      {/* Miniature header mock */}
      <div
        className="overflow-hidden"
        style={{
          backgroundColor: p.bg,
          borderBottom: `1px solid ${p.accent}22`,
        }}
      >
        {/* Fake topbar */}
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ backgroundColor: p.surface }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.accent }}
            />
            <div
              className="h-1.5 w-12 rounded"
              style={{ backgroundColor: `${p.text}22` }}
            />
          </div>
          <div
            className="h-1.5 w-6 rounded"
            style={{ backgroundColor: `${p.text}22` }}
          />
        </div>

        {/* Fake hero */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
            style={{
              backgroundColor: `${p.accent}22`,
              color: p.accent,
            }}
          >
            LKS
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div
              className="h-1.5 w-20 rounded"
              style={{ backgroundColor: `${p.text}33` }}
            />
            <div
              className="h-2 w-28 rounded"
              style={{ backgroundColor: `${p.text}55` }}
            />
          </div>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] text-[9px] font-bold tabular"
            style={{
              borderColor: p.accent,
              color: p.accent,
              backgroundColor: p.surface,
            }}
          >
            74
          </div>
        </div>

        {/* Fake strap */}
        <div
          className="flex justify-around px-3 py-1.5"
          style={{ backgroundColor: p.strap }}
        >
          {["INN", "RRR", "PRJ", "WKT"].map((l) => (
            <div key={l} className="flex flex-col items-center">
              <div
                className="text-[7px] font-semibold"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {l}
              </div>
              <div className="font-mono text-[9px] font-bold" style={{ color: "#ed7524" }}>
                {l === "INN" ? "74" : l === "RRR" ? "6.4" : l === "PRJ" ? "78" : "3"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Label */}
      <div
        className="flex items-center justify-between p-3"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div>
          <div className="text-[13px] font-semibold" style={{ color: "var(--text-1)" }}>
            {meta.name}
          </div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-2)" }}>
            {meta.description}
          </div>
        </div>
        {isActive && (
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--lks-accent)" }}
          >
            <Check size={12} color="#fff" />
          </div>
        )}
      </div>
    </button>
  );
}

export default function AppearanceSettings() {
  const { theme } = useThemeStore();
  const meta = THEME_META[theme];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="text-[17px] font-semibold" style={{ color: "var(--text-1)" }}>
          Appearance
        </div>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
          Choose the visual theme. Applies instantly and is saved across sessions.
          Currently active:{" "}
          <span className="font-medium" style={{ color: "var(--lks-accent)" }}>
            {meta.name}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {THEME_ORDER.map((id) => (
          <ThemePreviewCard key={id} id={id} />
        ))}
      </div>

      <div
        className="rounded-lg border p-4 text-[12px]"
        style={{
          backgroundColor: "var(--surface-2)",
          borderColor: "var(--line)",
          color: "var(--text-2)",
        }}
      >
        <strong style={{ color: "var(--text-1)" }}>Powerplay Bento</strong> — default
        modern product view, optimised for office reading.{" "}
        <strong style={{ color: "var(--text-1)" }}>Broadcast Night</strong> — dark
        match-centre view, ideal for command surfaces and presentations.{" "}
        <strong style={{ color: "var(--text-1)" }}>Counsel Ledger</strong> — classic
        lkslaw.com brand palette for client-facing and print contexts.
      </div>
    </div>
  );
}
