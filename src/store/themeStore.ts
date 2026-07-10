import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

export type Theme = "bento" | "night" | "ledger";

export const THEME_META: Record<
  Theme,
  { name: string; description: string; swatches: [string, string, string] }
> = {
  bento: {
    name: "Powerplay Bento",
    description: "Default · modern product view",
    swatches: ["#f4f5f7", "#2f3fb6", "#ed7524"],
  },
  night: {
    name: "Broadcast Night",
    description: "Dark mode · match-centre view",
    swatches: ["#101010", "#ed7524", "#98a2f5"],
  },
  ledger: {
    name: "Counsel Ledger",
    description: "Classic · lkslaw.com brand view",
    swatches: ["#ffffff", "#2f3fb6", "#ed7524"],
  },
};

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyThemeToDom(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "bento",
      setTheme: (theme) => {
        applyThemeToDom(theme);
        set({ theme });
        toast.success(`Theme changed to ${THEME_META[theme].name}`);
      },
    }),
    {
      name: "lks-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeToDom(state.theme);
      },
    },
  ),
);

/**
 * Synchronous init to prevent flash of wrong theme.
 * Call this from a blocking <script> in the HTML head before React boots.
 */
export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "bento";
  try {
    const stored = localStorage.getItem("lks-theme");
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { theme?: Theme } };
      const t = parsed?.state?.theme;
      if (t === "bento" || t === "night" || t === "ledger") return t;
    }
  } catch {
    /* ignore */
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "night";
  return "bento";
}
