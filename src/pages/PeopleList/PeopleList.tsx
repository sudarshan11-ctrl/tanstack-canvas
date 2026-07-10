import { useState, Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Search } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import RAGDot from "@/components/ui/RAGDot";
import { mockPeople } from "@/data/mockPeople";
import { useDashboardStore } from "@/store/dashboardStore";
import type { Role } from "@/types";

interface Props {
  role: Extract<Role, "partner" | "associate" | "practice_head">;
  title: string;
}

export function PeopleList({ role, title }: Props) {
  const personScores = useDashboardStore((s) => s.personScores);
  const scoreById = new Map(personScores.map((s) => [s.personId, s]));
  const byId = new Map(mockPeople.map((p) => [p.id, p]));
  const reportsById = new Map<string, typeof mockPeople>();
  for (const p of mockPeople) {
    if (!p.supervisorId) continue;
    const list = reportsById.get(p.supervisorId) ?? [];
    list.push(p);
    reportsById.set(p.supervisorId, list);
  }
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const noun = role === "partner" ? "partners" : role === "associate" ? "associates" : "practice heads";
  const canExpand = role !== "associate";

  type SortKey = "name" | "office" | "supervisor" | "practiceHead" | "lpi" | "rag" | "reports";
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const allRows = mockPeople
    .filter((p) => p.role === role)
    .map((p) => {
      const supervisor = p.supervisorId ? byId.get(p.supervisorId) : null;
      const practiceHead = role === "associate" && supervisor?.supervisorId
        ? byId.get(supervisor.supervisorId)
        : role === "partner"
          ? supervisor
          : null;
      const reports = reportsById.get(p.id) ?? [];
      return { p, supervisor, practiceHead, score: scoreById.get(p.id), reports };
    });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allRows.filter(({ p, supervisor, practiceHead, score }) => {
        const hay = [
          p.name,
          p.office,
          supervisor?.name ?? "",
          practiceHead?.name ?? "",
          score ? String(Math.round(score.lpi)) : "",
          score?.rag ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : allRows;

  const ragRank: Record<string, number> = { red: 0, amber: 1, green: 2 };
  const dir = sortDir === "asc" ? 1 : -1;
  const people = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "office":
        return a.p.office.localeCompare(b.p.office) * dir;
      case "supervisor":
        return (a.supervisor?.name ?? "").localeCompare(b.supervisor?.name ?? "") * dir;
      case "practiceHead":
        return (a.practiceHead?.name ?? "").localeCompare(b.practiceHead?.name ?? "") * dir;
      case "lpi":
        return ((a.score?.lpi ?? -Infinity) - (b.score?.lpi ?? -Infinity)) * dir;
      case "rag":
        return ((ragRank[a.score?.rag ?? ""] ?? 99) - (ragRank[b.score?.rag ?? ""] ?? 99)) * dir;
      case "reports":
        return (a.reports.length - b.reports.length) * dir;
      case "name":
      default:
        return a.p.name.localeCompare(b.p.name) * dir;
    }
  });

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={11} className="text-slate-400" />;
    return sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };
  const Th = ({
    k,
    label,
    align = "left",
  }: {
    k: SortKey;
    label: string;
    align?: "left" | "right";
  }) => (
    <th className={`px-3 py-2 font-semibold ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 ${align === "right" ? "justify-end" : ""}`}
      >
        {label}
        <SortIcon k={k} />
      </button>
    </th>
  );

  return (
    <PageWrapper title={title}>
      <div className="mx-auto max-w-[1280px]">
        <Card padding="md">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[12px] text-slate-500">
              Showing {people.length} of {allRows.length} {noun}
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${noun} by name, office, LPI...`}
                className="w-64 rounded-md border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <Th k="name" label="Name" />
                  <Th k="office" label="Office" />
                  <Th
                    k="supervisor"
                    label={role === "associate" ? "Reports to" : role === "partner" ? "Practice head" : "Charter"}
                  />
                  {role === "associate" ? <Th k="practiceHead" label="Practice head" /> : null}
                  <Th k="lpi" label="LPI" align="right" />
                  <Th k="rag" label="RAG" />
                  {canExpand ? <Th k="reports" label="Team" /> : null}
                </tr>
              </thead>
              <tbody>
                {people.length === 0 ? (
                  <tr>
                    <td
                      colSpan={role === "associate" ? 6 : 7}
                      className="px-3 py-6 text-center text-[12px] text-slate-400"
                    >
                      No {noun} match "{query}"
                    </td>
                  </tr>
                ) : null}
                {people.map(({ p, supervisor, practiceHead, score, reports }) => {
                  const isOpen = !!expanded[p.id];
                  const colSpan = role === "associate" ? 6 : 7;
                  return (
                  <Fragment key={p.id}>
                  <tr className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link
                        to="/profile/$id"
                        params={{ id: p.id }}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{p.office}</td>
                    <td className="px-3 py-2 text-slate-600">{supervisor?.name ?? "—"}</td>
                    {role === "associate" ? (
                      <td className="px-3 py-2 text-slate-600">{practiceHead?.name ?? "—"}</td>
                    ) : null}
                    <td className="px-3 py-2 text-right font-mono text-slate-900">
                      {score ? Math.round(score.lpi) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {score ? <RAGDot status={score.rag} /> : null}
                    </td>
                    {canExpand ? (
                      <td className="px-3 py-2">
                        {reports.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggle(p.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            {reports.length} {reports.length === 1 ? "report" : "reports"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                  {canExpand && isOpen ? (
                    <tr className="bg-slate-50">
                      <td colSpan={colSpan} className="px-6 py-3">
                        <ReportsBlock people={reports} scoreById={scoreById} reportsById={reportsById} />
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

function ReportsBlock({
  people,
  scoreById,
  reportsById,
}: {
  people: typeof mockPeople;
  scoreById: Map<string, ReturnType<typeof useDashboardStore.getState>["personScores"][number]>;
  reportsById: Map<string, typeof mockPeople>;
}) {
  return (
    <div className="space-y-2">
      {people.map((person) => {
        const score = scoreById.get(person.id);
        const subReports = reportsById.get(person.id) ?? [];
        return (
          <div key={person.id} className="rounded-md border border-slate-200 bg-white p-2">
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/profile/$id"
                params={{ id: person.id }}
                className="text-[12px] font-medium text-slate-900 hover:text-blue-600"
              >
                {person.name}
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="capitalize">{person.role.replace("_", " ")}</span>
                <span>·</span>
                <span>{person.office}</span>
                {score ? (
                  <>
                    <span>·</span>
                    <span className="font-mono text-slate-900">LPI {Math.round(score.lpi)}</span>
                    <RAGDot status={score.rag} size="sm" />
                  </>
                ) : null}
              </div>
            </div>
            {subReports.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1 pl-3">
                {subReports.map((sr) => (
                  <Link
                    key={sr.id}
                    to="/profile/$id"
                    params={{ id: sr.id }}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-200"
                  >
                    {sr.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}