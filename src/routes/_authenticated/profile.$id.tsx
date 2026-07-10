import { createFileRoute } from "@tanstack/react-router";
import ProfileCard from "@/pages/ProfileCard";

export const Route = createFileRoute("/_authenticated/profile/$id")({ component: ProfileCard });