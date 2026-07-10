import { createFileRoute } from "@tanstack/react-router";
import AssociateViewPage from "@/pages/AssociateView";

export const Route = createFileRoute("/_authenticated/ep/$epId/p/$partnerId/a/$associateId")({
  component: AssociateViewPage,
});
