import type { ReactNode } from "react";

export default function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-3 border-b pb-1.5 text-[11px] font-semibold uppercase tracking-wider"
      style={{
        color: "var(--text-1)",
        borderColor: "var(--line)",
        opacity: 0.72,
      }}
    >
      {children}
    </div>
  );
}
