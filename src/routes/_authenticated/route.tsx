import { createFileRoute, Outlet } from "@tanstack/react-router";

// Auth is intentionally disabled: all routes are publicly accessible.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
