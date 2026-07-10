import { createFileRoute } from "@tanstack/react-router";
import SquadView from "@/pages/SquadView";

export const Route = createFileRoute("/_authenticated/squad/$epId")({ component: SquadView });