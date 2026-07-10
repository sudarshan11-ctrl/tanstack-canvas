import type { RAGStatus } from "@/types";
import { RAG_FG } from "./rag-colors";

const SIZE = { sm: 6, md: 10, lg: 14 } as const;

export default function RAGDot({
  status,
  size = "md",
}: {
  status: RAGStatus;
  size?: keyof typeof SIZE;
}) {
  const d = SIZE[size];
  return (
    <span
      aria-label={status}
      className="inline-block rounded-full align-middle"
      style={{ width: d, height: d, backgroundColor: RAG_FG[status] }}
    />
  );
}