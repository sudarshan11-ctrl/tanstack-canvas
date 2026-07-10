import { createFileRoute } from "@tanstack/react-router";
import MetricDrilldown from "@/pages/MetricDrilldown";

export const Route = createFileRoute("/_authenticated/metric/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  component: MetricDrilldown,
});