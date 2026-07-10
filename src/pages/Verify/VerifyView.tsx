import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import PageWrapper from "@/components/layout/PageWrapper";
import Card from "@/components/ui/card";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { personById } from "@/utils/hierarchy";
import {
  listVerifyMetricIds,
  verifyOnePersonMetric,
  type VerifyMetricRow,
} from "@/lib/api/metrics.functions";

// Expected FY25-26 values supplied by the user for L Badrinarayanan (lks-1130).
// Numeric values are normalised to the unit shown in `display` for human comparison.
const EXPECTED: Record<string, { display: string; numeric: number | null; unit: string; note?: string }> = {
  "FH-01": { display: "₹24.48 Cr", numeric: 24.48, unit: "₹Cr" },
  "FH-07": { display: "100.0%", numeric: 100.0, unit: "%" },
  "FH-08": { display: "90.2%", numeric: 90.2, unit: "%" },
  "FH-10": { display: "6.5 : 1", numeric: 6.5, unit: "ratio" },
  "FH-12": { display: "₹27.20 L", numeric: 27.2, unit: "₹L", note: "API returns ₹Cr; expected ÷ 100" },
  "FH-13": { display: "₹6,346/hr", numeric: 6346, unit: "₹/hr" },
  "FH-14": { display: "₹7,032/hr", numeric: 7032, unit: "₹/hr" },
  "FH-16": { display: "₹4.72 Cr (84 notes)", numeric: 4.72, unit: "₹Cr" },
  "FH-17": { display: "₹42.53 L", numeric: 0.4253, unit: "₹Cr", note: "42.53 L = 0.4253 Cr" },
  "FH-18": { display: "₹5.14 Cr", numeric: 5.14, unit: "₹Cr" },
  "FH-19": { display: "35+103=138 days", numeric: 138, unit: "days", note: "wip_days + debtor_days" },
  "CM-01": { display: "555", numeric: 555, unit: "count" },
  "CM-02": { display: "822", numeric: 822, unit: "count" },
  "CM-03": { display: "50.6% (254/502)", numeric: 50.6, unit: "%" },
  "CM-04": { display: "79.6%", numeric: 79.6, unit: "%" },
  "CM-06": { display: "45.8% (254/555)", numeric: 45.8, unit: "%" },
  "CM-07": { display: "T1:4.1% T3:11.1%", numeric: null, unit: "%", note: "multi-bucket; cannot collapse" },
  "CM-11": { display: "0.6% (2/356)", numeric: 0.6, unit: "%" },
  "PO-05": { display: "489d (154 closed)", numeric: 489, unit: "days" },
  "PO-08": { display: "35 days", numeric: 35, unit: "days" },
  "PO-09": { display: "103 days", numeric: 103, unit: "days", note: "Avg debtor days; current mapping is wrong" },
  "GP-01": { display: "+23.6%", numeric: 23.6, unit: "%" },
  "GP-07": { display: "0", numeric: 0, unit: "count", note: "Same source as FH-01" },
};

const TOLERANCE_PCT = 2; // ±2% match window

function matchStatus(
  expected: number | null,
  actual: number | string | null,
): "match" | "close" | "mismatch" | "na" {
  if (expected === null || actual === null || typeof actual !== "number") return "na";
  if (expected === 0) return actual === 0 ? "match" : "mismatch";
  const diffPct = Math.abs((actual - expected) / expected) * 100;
  if (diffPct <= 0.5) return "match";
  if (diffPct <= TOLERANCE_PCT) return "close";
  return "mismatch";
}

function fmt(v: number | string | null): string {
  if (v === null) return "—";
  if (typeof v === "number") return v.toLocaleString("en-IN", { maximumFractionDigits: 4 });
  return String(v);
}

function VerifyView() {
  const { personId } = useParams({ from: "/_authenticated/verify/$personId" });
  const person = personById(personId);
  const [rows, setRows] = useState<Map<string, VerifyMetricRow>>(() => new Map<string, VerifyMetricRow>());
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(new Map());
    setError(null);
    setPending(0);

    (async () => {
      let metricIds: string[];
      try {
        metricIds = await listVerifyMetricIds({ data: { personId } });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
        return;
      }
      if (cancelled) return;
      setPending(metricIds.length);

      // Fan out with a soft browser-side concurrency limit. The server only
      // does ONE replica-api call per request, so each Worker invocation
      // completes well under the runtime timeout.
      const LIMIT = 4;
      let cursor = 0;
      const workers = Array.from({ length: Math.min(LIMIT, metricIds.length) }, async () => {
        while (!cancelled) {
          const i = cursor++;
          if (i >= metricIds.length) return;
          const id = metricIds[i];
          try {
            const row = await verifyOnePersonMetric({ data: { personId, metricId: id } });
            if (cancelled) return;
            setRows((prev) => {
              const next = new Map(prev);
              next.set(id, row);
              return next;
            });
          } catch (e) {
            if (cancelled) return;
            setRows((prev) => {
              const next = new Map(prev);
              next.set(id, {
                metricId: id,
                apiMetricId: null,
                valueColumn: null,
                pickedColumn: null,
                scale: 1,
                unitHint: "",
                parsedValue: null,
                unit: "",
                rag: "na",
                passive: true,
                remark: null,
                rawColumns: [],
                rawFirstRow: null,
                rawRowCount: 0,
                error: e instanceof Error ? e.message : String(e),
              });
              return next;
            });
          } finally {
            if (!cancelled) setPending((n) => Math.max(0, n - 1));
          }
        }
      });
      await Promise.all(workers);
    })();

    return () => {
      cancelled = true;
    };
  }, [personId]);


  if (!person) {
    return (
      <div className="p-4">
        <Breadcrumbs crumbs={[{ label: "Not found" }]} />
        <div className="mt-3 text-[13px] text-slate-600">Person not found.</div>
      </div>
    );
  }

  const expectedIds = Object.keys(EXPECTED);
  const byId = rows;
  const loading = pending > 0;

  let counts = { match: 0, close: 0, mismatch: 0, na: 0 };
  for (const id of expectedIds) {
    const exp = EXPECTED[id];
    const row = byId.get(id);
    const s = matchStatus(exp.numeric, row?.parsedValue ?? null);
    counts = { ...counts, [s]: counts[s] + 1 };
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-1">
      <Breadcrumbs crumbs={[{ label: person.name }, { label: "API verification" }]} />

      <Card padding="lg">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">FY 2025-26 API verification</div>
            <div className="mt-1 text-[22px] font-semibold text-slate-900">{person.name}</div>
            <div className="text-[13px] text-slate-600">
              LCMS user id: <span className="font-mono">{person.lcmsUserId ?? "—"}</span> · Role:{" "}
              <span className="font-mono">{person.role}</span>
            </div>
          </div>
          <div className="flex gap-3 text-[12px]">
            <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">Match: {counts.match}</span>
            <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">Close (±2%): {counts.close}</span>
            <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">Mismatch: {counts.mismatch}</span>
            <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">N/A: {counts.na}</span>
          </div>
        </div>
        {loading && <div className="mt-3 text-[13px] text-slate-500">Loading live API values…</div>}
        {error && <div className="mt-3 text-[13px] text-rose-700">Error: {error}</div>}
      </Card>

      <Card padding="lg">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-3 font-medium">Metric</th>
                <th className="py-2 pr-3 font-medium">Expected</th>
                <th className="py-2 pr-3 font-medium">API value</th>
                <th className="py-2 pr-3 font-medium">Unit</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Column used</th>
                <th className="py-2 pr-3 font-medium">API endpoint</th>
                <th className="py-2 pr-3 font-medium">Raw row[0]</th>
              </tr>
            </thead>
            <tbody>
              {expectedIds.map((id) => {
                const exp = EXPECTED[id];
                const row = byId.get(id);
                const status = matchStatus(exp.numeric, row?.parsedValue ?? null);
                const statusColor =
                  status === "match"
                    ? "bg-emerald-100 text-emerald-800"
                    : status === "close"
                      ? "bg-amber-100 text-amber-800"
                      : status === "mismatch"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-600";
                return (
                  <tr key={id} className="border-b align-top">
                    <td className="py-2 pr-3 font-mono font-semibold text-slate-800">{id}</td>
                    <td className="py-2 pr-3">
                      <div>{exp.display}</div>
                      {exp.note && <div className="text-[10px] text-slate-400">{exp.note}</div>}
                    </td>
                    <td className="py-2 pr-3 font-mono">
                      {row ? fmt(row.parsedValue) : loading ? "…" : "—"}
                      {row?.error && <div className="text-[10px] text-rose-600">{row.error}</div>}
                      {row?.remark && !row.error && (
                        <div className="text-[10px] text-slate-400">{row.remark}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{row?.unit || exp.unit}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-2 py-0.5 text-[11px] ${statusColor}`}>{status}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11px] text-slate-600">
                      {row?.pickedColumn ?? row?.valueColumn ?? "—"}
                      {row && row.scale !== 1 && (
                        <div className="text-[10px] text-slate-400">× {row.scale}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[10px] text-slate-500">
                      {row?.apiMetricId ?? "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[10px] text-slate-500">
                      {row?.rawFirstRow ? (
                        <pre className="max-w-[16.25rem] overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(row.rawFirstRow, null, 0)}
                        </pre>
                      ) : (
                        "—"
                      )}
                      {row && row.rawRowCount > 1 && (
                        <div className="text-[10px] text-slate-400">+ {row.rawRowCount - 1} more rows</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <PageWrapper title="API verification">
      <VerifyView />
    </PageWrapper>
  );
}
