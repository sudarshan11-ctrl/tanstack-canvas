import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/firm")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});