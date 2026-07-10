import { createFileRoute } from "@tanstack/react-router";
import { PeopleList } from "@/pages/PeopleList/PeopleList";

export const Route = createFileRoute("/_authenticated/practice-heads")({
  component: () => <PeopleList role="practice_head" title="All practice heads" />,
});