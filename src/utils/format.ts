import { format as dfnsFormat } from "date-fns";

/** Format a metric value for display. Unit-aware. */
export function formatMetricValue(value: number | string, unit: string): string {
  if (typeof value === "string") return value;
  const u = (unit ?? "").toLowerCase();
  if (unit === "₹Cr") return `₹${value.toFixed(2)} Cr`;
  if (unit === "₹/hr") return `₹${Math.round(value).toLocaleString("en-IN")}/hr`;
  if (u === "%") return `${Math.round(value)}%`;
  if (u === "days") return `${Math.round(value)} days`;
  if (u === "hrs" || u === "hours") return `${Math.round(value)} hrs`;
  if (u === "hrs/wk") return `${value.toFixed(1)} hrs/wk`;
  if (u === "score") return value.toFixed(1);
  if (u === "count") return String(Math.round(value));
  if (u === "ratio") return value.toFixed(2);
  return String(value);
}

/** Format a signed delta with unit suffix. Uses real minus sign. */
export function formatDelta(delta: number | null, unit: string): string {
  if (delta === null || !Number.isFinite(delta)) return "—";
  const sign = delta > 0 ? "+" : delta < 0 ? "\u2212" : "";
  const magnitude = Math.abs(delta);
  const u = (unit ?? "").toLowerCase();
  if (u === "%" || unit === "%") return `${sign}${magnitude.toFixed(0)}%`;
  return `${sign}${magnitude.toFixed(1)}`;
}

/** 'FY2025-26' → 'FY 2025–26' (en-dash). */
export function formatPeriod(period: string): string {
  const m = /^FY(\d{4})-(\d{2,4})$/.exec(period);
  if (!m) return period;
  return `FY ${m[1]}\u2013${m[2]}`;
}

/** Convenience re-exports for general date formatting. */
export const formatDate = (d: Date | number, pattern = "PP") =>
  dfnsFormat(d, pattern);

/** API snapshot sync time in firm convention: "6 Jul 2026, 17:15 IST". */
export function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return "Not synced";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: false,
  }).formatToParts(new Date(iso));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("day")} ${pick("month")} ${pick("year")}, ${pick("hour")}:${pick("minute")} IST`;
}