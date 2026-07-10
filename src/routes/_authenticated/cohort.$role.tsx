import { createFileRoute } from "@tanstack/react-router";
import CohortView from "@/pages/CohortView";

export const Route = createFileRoute("/_authenticated/cohort/$role")({ component: CohortView });