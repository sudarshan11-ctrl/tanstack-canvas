import type { RAGStatus } from "@/types";

/**
 * Static fallback colors for contexts where CSS variable reading is not possible
 * (e.g. SSR, static SVG attributes).
 * For live rendering, prefer useRagColors() from @/hooks/useThemeTokens
 * so colors respond to theme changes.
 */
export const RAG_FG: Record<RAGStatus, string> = {
  green: "var(--rag-green)",
  amber: "var(--rag-amber)",
  red: "var(--rag-red)",
  na: "var(--text-2)",
};

export const RAG_BG: Record<RAGStatus, string> = {
  green: "color-mix(in srgb, var(--rag-green) 10%, transparent)",
  amber: "color-mix(in srgb, var(--rag-amber) 10%, transparent)",
  red: "color-mix(in srgb, var(--rag-red) 10%, transparent)",
  na: "var(--surface-2)",
};

export const RAG_LABEL: Record<RAGStatus, string> = {
  green: "On track",
  amber: "At risk",
  red: "Critical",
  na: "N/A",
};

export const INFO_FG = "var(--lks-accent)";
export const INFO_BG = "color-mix(in srgb, var(--lks-accent) 10%, transparent)";
