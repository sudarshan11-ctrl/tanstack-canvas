import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 text-[12px]"
      style={{ color: "var(--text-2)" }}
    >
      <Link
        to="/"
        className="flex items-center gap-1 transition-opacity hover:opacity-80"
        style={{ color: "var(--text-2)" }}
      >
        <Home size={12} />
        <span>Firm</span>
      </Link>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight size={12} style={{ color: "var(--line)", opacity: 0.8 }} />
            {c.to && !isLast ? (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={c.to as any}
                params={c.params as any}
                className="max-w-[220px] truncate transition-opacity hover:opacity-80"
                style={{ color: "var(--text-2)" }}
              >
                {c.label}
              </Link>
            ) : (
              <span
                className="max-w-[260px] truncate font-medium"
                style={{ color: "var(--text-1)" }}
              >
                {c.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
