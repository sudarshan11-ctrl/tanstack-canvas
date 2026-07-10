import { createFileRoute, Outlet } from "@tanstack/react-router";

// Phase 1: auth gate bypassed for mock-data preview. Re-enable in Phase 2.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});