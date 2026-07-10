import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const PAD = { sm: "p-3", md: "p-4", lg: "p-6" } as const;

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof PAD;
  /** Raised variant adds lift shadow (bento only; night uses border emphasis) */
  raised?: boolean;
}

export default function Card({
  children,
  className,
  padding = "md",
  raised = false,
}: CardProps) {
  return (
    <div
      className={cn("rounded-[var(--radius)] border transition-all", PAD[padding], className)}
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--line)",
        boxShadow: raised
          ? "0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06)"
          : undefined,
        transition: "background-color 150ms ease, border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(e) => {
        if (raised) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 2px 4px rgba(0,0,0,.07), 0 12px 32px rgba(0,0,0,.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (raised) {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06)";
        }
      }}
    >
      {children}
    </div>
  );
}
