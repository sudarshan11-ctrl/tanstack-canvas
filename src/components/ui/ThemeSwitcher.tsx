import { Sun, Moon, BookOpen, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useThemeStore, THEME_META, type Theme } from "@/store/themeStore";
import { cn } from "@/lib/utils";

const THEME_ICONS: Record<Theme, typeof Sun> = {
  bento: Sun,
  night: Moon,
  ledger: BookOpen,
};

const THEME_ORDER: Theme[] = ["bento", "night", "ledger"];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const CurrentIcon = THEME_ICONS[theme];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 transition-colors"
          style={{
            color: "var(--text-2)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
          title="Change appearance theme"
        >
          <CurrentIcon size={16} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-2"
        align="end"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--line)",
        }}
      >
        <p
          className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-2)" }}
        >
          Appearance
        </p>

        <div className="flex flex-col gap-0.5">
          {THEME_ORDER.map((id) => {
            const meta = THEME_META[id];
            const Icon = THEME_ICONS[id];
            const isActive = theme === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                )}
                style={{
                  backgroundColor: isActive ? "var(--surface-2)" : "transparent",
                  color: "var(--text-1)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                {/* Swatch strip */}
                <div className="flex shrink-0 items-center gap-0.5">
                  {meta.swatches.map((s, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-sm"
                      style={{
                        width: 14,
                        height: 14,
                        backgroundColor: s,
                        border: "1px solid rgba(0,0,0,0.12)",
                      }}
                    />
                  ))}
                </div>

                {/* Labels */}
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13px] font-medium leading-tight"
                    style={{ color: "var(--text-1)" }}
                  >
                    {meta.name}
                  </div>
                  <div
                    className="text-[11px] leading-tight"
                    style={{ color: "var(--text-2)" }}
                  >
                    {meta.description}
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <Check size={14} style={{ color: "var(--lks-accent)", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
