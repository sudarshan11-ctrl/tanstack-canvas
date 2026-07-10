import { createFileRoute } from "@tanstack/react-router";
import PracticeHeadViewPage from "@/pages/PracticeHeadView";

export const Route = createFileRoute("/_authenticated/ep/$epId/")({
  component: PracticeHeadViewPage,
});
