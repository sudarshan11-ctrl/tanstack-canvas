import { useCallback } from "react";
import { useThemeStore } from "@/store/themeStore";

/**
 * Returns a function that reads a CSS custom property value from the document root.
 * Depends on the current theme so Recharts and SVG components re-render on theme change.
 */
export function useThemeTokens() {
  // Track theme changes so callers re-render when the theme switches
  useThemeStore((s) => s.theme);

  const getToken = useCallback((name: string): string => {
    if (typeof window === "undefined") return "";
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }, []);

  return { getToken };
}

/**
 * Convenience: returns resolved hex/oklch values for all RAG statuses.
 */
export function useRagColors() {
  const { getToken } = useThemeTokens();
  return {
    green: getToken("--rag-green") || "#18a957",
    amber: getToken("--rag-amber") || "#e0a400",
    red: getToken("--rag-red") || "#e13f3f",
    na: getToken("--text-2") || "#6e7276",
  };
}

/**
 * Convenience: returns resolved values for the five area tokens.
 */
export function useAreaColors() {
  const { getToken } = useThemeTokens();
  return {
    financial: getToken("--area-financial") || "#c97a2e",
    growth: getToken("--area-growth") || "#4656c8",
    people: getToken("--area-people") || "#7e6bd9",
    ops: getToken("--area-ops") || "#9a8a2e",
    client: getToken("--area-client") || "#2e9a8a",
  };
}
