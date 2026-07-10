import { createFileRoute } from "@tanstack/react-router";
import PartnerViewPage from "@/pages/PartnerView";

export const Route = createFileRoute("/_authenticated/ep/$epId/p/$partnerId/")({
  component: PartnerViewPage,
});
