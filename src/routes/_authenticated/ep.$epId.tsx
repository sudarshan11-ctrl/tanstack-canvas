import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for the practice head subtree. Child routes (the practice head index page,
// partner pages, associate pages) render inside <Outlet />.
export const Route = createFileRoute("/_authenticated/ep/$epId")({
  component: () => <Outlet />,
});
