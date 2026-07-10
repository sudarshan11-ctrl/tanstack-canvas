import type { RAGStatus } from "@/types";
import { RAG_FG, RAG_BG, RAG_LABEL } from "./rag-colors";

const SIZE = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
} as const;

export default function RAGBadge({
  status,
  size = "md",
}: {
  status: RAGStatus;
  size?: keyof typeof SIZE;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${SIZE[size]}`}
      style={{ color: RAG_FG[status], backgroundColor: RAG_BG[status] }}
    >
      {RAG_LABEL[status]}
    </span>
  );
}