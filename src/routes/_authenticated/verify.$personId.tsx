import { createFileRoute } from "@tanstack/react-router";
import VerifyPage from "@/pages/Verify/VerifyView";

export const Route = createFileRoute("/_authenticated/verify/$personId")({
  component: VerifyPage,
});
