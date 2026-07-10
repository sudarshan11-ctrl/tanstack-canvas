import { createFileRoute } from "@tanstack/react-router";
import FirmLandingPage from "@/pages/FirmLanding";

export const Route = createFileRoute("/")({
  component: FirmLandingPage,
});
