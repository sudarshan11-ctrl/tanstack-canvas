import { Star } from "lucide-react";

export default function ScorecardStar({
  show,
  title = "Standard hours basis — EW and Std match",
}: {
  show?: boolean;
  title?: string;
}) {
  if (!show) return null;
  return (
    <span
      title={title}
      className="inline-flex items-center"
      aria-label={title}
    >
      <Star
        size={11}
        fill="currentColor"
        className="shrink-0"
        style={{ color: "var(--lks-accent)" }}
      />
    </span>
  );
}
