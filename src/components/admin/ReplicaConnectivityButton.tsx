import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, PlugZap } from "lucide-react";
import {
  testReplicaConnectivity,
  type ConnectivityResult,
} from "@/lib/api/connectivity.functions";

export function ReplicaConnectivityButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConnectivityResult | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await testReplicaConnectivity();
      setResult(res);
      if (res.ok) {
        toast.success("Replica API reachable", {
          description: `Host ${res.baseUrlHost} responded in ${res.durationMs} ms${
            res.metricCount !== null ? `, ${res.metricCount} metrics listed` : ""
          }.`,
        });
      } else {
        toast.error("Replica API unreachable", {
          description: `${res.message}${res.baseUrlHost ? ` (host ${res.baseUrlHost})` : ""}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      toast.error("Connectivity test failed", { description: message });
      setResult({
        ok: false,
        status: null,
        baseUrlHost: null,
        metricCount: null,
        durationMs: 0,
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={run} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PlugZap className="mr-2 h-4 w-4" />
        )}
        Test API connection
      </Button>
      {result && (
        <span
          className={
            result.ok
              ? "text-xs text-emerald-600"
              : "text-xs text-destructive"
          }
        >
          {result.ok
            ? `OK: ${result.baseUrlHost} (${result.durationMs} ms)`
            : `Failed: ${result.message}`}
        </span>
      )}
    </div>
  );
}
