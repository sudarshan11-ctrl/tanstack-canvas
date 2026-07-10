import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for a single partner. Partner index + associate pages render
// inside <Outlet />.
export const Route = createFileRoute("/_authenticated/ep/$epId/p/$partnerId")({
  component: () => <Outlet />,
});
