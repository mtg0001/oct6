import { useMemo, useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Monitor } from "lucide-react";
import {
  getChamadosTI,
  ensureChamadosTILoaded,
  subscribeChamadosTI,
  type ChamadoTI,
} from "@/stores/chamadosTIStore";
import { useCurrentUser } from "@/hooks/useUsuarios";

const statusConfig: Record<string, { icon: typeof Clock; className: string; label: string }> = {
  pendente: { icon: Clock, className: "text-accent bg-accent/10", label: "Pendente" },
  aguardando_diretoria: { icon: Clock, className: "text-purple-600 bg-purple-100", label: "Aguardando" },
  resolvido: { icon: CheckCircle2, className: "text-success bg-success/10", label: "Resolvido" },
  cancelado: { icon: XCircle, className: "text-destructive bg-destructive/10", label: "Cancelado" },
};

export function RecentChamadosTI() {
  const currentUser = useCurrentUser();
  const [chamados, setChamados] = useState<ChamadoTI[]>([]);

  useEffect(() => {
    ensureChamadosTILoaded().then(() => setChamados(getChamadosTI()));
    return subscribeChamadosTI(() => setChamados(getChamadosTI()));
  }, []);

  const recent = useMemo(() => {
    let filtered = chamados;
    if (!currentUser?.administrador && currentUser?.id) {
      filtered = chamados.filter(c => c.solicitanteId === currentUser.id);
    }
    return filtered.slice(0, 5);
  }, [chamados, currentUser]);

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="h-3.5 w-3.5 text-destructive" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Últimos Chamados TI</p>
      </div>
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum chamado encontrado</p>
      ) : (
        <div className="space-y-2">
          {recent.map((c) => {
            const cfg = statusConfig[c.status] || statusConfig.pendente;
            const Icon = cfg.icon;
            return (
              <div key={c.id} className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.className}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate">{c.categoria}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.solicitanteNome} · {new Date(c.criadoEm).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
