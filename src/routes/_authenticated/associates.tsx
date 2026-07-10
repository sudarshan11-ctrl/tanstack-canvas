import { createFileRoute } from "@tanstack/react-router";
import { PeopleList } from "@/pages/PeopleList/PeopleList";

export const Route = createFileRoute("/_authenticated/associates")({
  component: () => <PeopleList role="associate" title="All associates" />,
});