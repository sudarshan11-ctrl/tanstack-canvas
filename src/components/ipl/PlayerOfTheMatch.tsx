import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import type { PomTag } from "@/utils/playerOfTheMatch";

export interface PlayerOfTheMatchProps {
  tags: PomTag[];
}

export default function PlayerOfTheMatch({ tags }: PlayerOfTheMatchProps) {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius)] border p-4"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--line)",
      }}
    >
      <div
        className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-2)" }}
      >
        <Trophy size={14} style={{ color: "var(--lks-highlight)" }} />
        Player of the match · last completed period
      </div>

      <div className="flex flex-col gap-2">
        {tags.map((t) => (
          <Link
            key={t.id}
            to={t.person ? "/profile/$id" : "/"}
            params={t.person ? { id: t.person.id } : ({} as never)}
            className="block rounded-md border p-3 transition-all"
            style={{
              backgroundColor: "color-mix(in srgb, var(--lks-highlight) 6%, var(--surface))",
              borderColor: "color-mix(in srgb, var(--lks-highlight) 25%, var(--line))",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "color-mix(in srgb, var(--lks-highlight) 12%, var(--surface))";
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "color-mix(in srgb, var(--lks-highlight) 6%, var(--surface))";
              (e.currentTarget as HTMLAnchorElement).style.transform =
                "translateY(0)";
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--lks-highlight)" }}
            >
              {t.label}
            </div>
            {t.person ? (
              <div
                className="mt-1 text-[13px] font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                {t.person.name}
              </div>
            ) : null}
            <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-2)" }}>
              {t.detail}
            </div>
            <div
              className="font-metric-id mt-1.5 text-[10px]"
              style={{ color: "var(--text-2)", opacity: 0.7 }}
            >
              {t.metric}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
