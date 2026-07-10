import { createFileRoute } from "@tanstack/react-router";
import MindMap from "@/pages/MindMap";

export const Route = createFileRoute("/_authenticated/mindmap")({ component: MindMap });