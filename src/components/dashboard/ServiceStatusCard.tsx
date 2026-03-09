import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";

interface ServiceResult {
  name: string;
  status: "operational" | "degraded" | "down";
  icon: string;
  latency: number;
}

const statusConfig = {
  operational: {
    label: "Operacional",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10",
    Icon: Wifi,
  },
  degraded: {
    label: "Instável",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    Icon: AlertTriangle,
  },
  down: {
    label: "Fora do ar",
    dotClass: "bg-red-500",
    textClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/10",
    Icon: WifiOff,
  },
};

export function ServiceStatusCard() {
  const [services, setServices] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-services-status");
      if (error) throw error;
      if (data?.success) {
        setServices(data.services);
        setCheckedAt(data.checkedAt);
      }
    } catch (e) {
      console.error("Failed to fetch service status:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5 * 60 * 1000); // refresh every 5min
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const issueCount = services.filter((s) => s.status !== "operational").length;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Status dos Serviços
          </h3>
          {issueCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {issueCount} {issueCount === 1 ? "alerta" : "alertas"}
            </span>
          )}
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`h-3 w-3 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
        {loading && services.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          services.map((service) => {
            const config = statusConfig[service.status] || statusConfig.operational;
            return (
              <div
                key={service.name}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{service.icon}</span>
                  <span className="text-xs font-medium text-foreground truncate">
                    {service.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-semibold ${config.textClass}`}>
                    {config.label}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${config.dotClass} ${service.status !== "operational" ? "animate-pulse" : ""}`} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {checkedAt && (
        <p className="text-[9px] text-muted-foreground mt-2 text-right">
          Verificado: {new Date(checkedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
