import { createFileRoute } from "@tanstack/react-router";
import { PeopleList } from "@/pages/PeopleList/PeopleList";

export const Route = createFileRoute("/_authenticated/partners")({
  component: () => <PeopleList role="partner" title="All partners" />,
});