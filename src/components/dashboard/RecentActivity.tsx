import { useMemo } from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { SolicitacaoColaborador } from "@/stores/solicitacoesStore";

interface Props {
  solicitacoes: SolicitacaoColaborador[];
}

const statusConfig: Record<string, { icon: typeof Clock; className: string; bgClass: string; label: string }> = {
  pendente: { icon: Clock, className: "text-accent", bgClass: "bg-accent/10", label: "Pendente" },
  aprovado_diretor: { icon: Clock, className: "text-accent", bgClass: "bg-accent/10", label: "Aguardando" },
  aprovado: { icon: CheckCircle2, className: "text-success", bgClass: "bg-success/10", label: "Aprovado" },
  resolvido: { icon: CheckCircle2, className: "text-success", bgClass: "bg-success/10", label: "Resolvido" },
  cancelado: { icon: XCircle, className: "text-destructive", bgClass: "bg-destructive/10", label: "Cancelado" },
  reprovado: { icon: XCircle, className: "text-destructive", bgClass: "bg-destructive/10", label: "Reprovado" },
};

export function RecentActivity({ solicitacoes }: Props) {
  const recent = useMemo(() => {
    return [...solicitacoes].slice(0, 5);
  }, [solicitacoes]);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Últimas Solicitações</p>
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma solicitação encontrada</p>
      ) : (
        <div className="space-y-1">
          {recent.map((sol) => {
            const cfg = statusConfig[sol.status] || statusConfig.pendente;
            const Icon = cfg.icon;
            return (
              <div key={sol.id} className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-muted/50 transition-colors">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bgClass}`}>
                  <Icon className={`h-4 w-4 ${cfg.className}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-foreground truncate">{sol.tipo}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sol.solicitante} · {sol.dataCriacao.split(",")[0]}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${cfg.bgClass} ${cfg.className}`}>
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
