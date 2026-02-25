import { useMemo } from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { SolicitacaoColaborador } from "@/stores/solicitacoesStore";

interface Props {
  solicitacoes: SolicitacaoColaborador[];
}

const statusConfig: Record<string, { icon: typeof Clock; className: string; label: string }> = {
  pendente: { icon: Clock, className: "text-accent bg-accent/10", label: "Pendente" },
  aprovado_diretor: { icon: Clock, className: "text-accent bg-accent/10", label: "Aguardando" },
  aprovado: { icon: CheckCircle2, className: "text-success bg-success/10", label: "Aprovado" },
  resolvido: { icon: CheckCircle2, className: "text-success bg-success/10", label: "Resolvido" },
  cancelado: { icon: XCircle, className: "text-destructive bg-destructive/10", label: "Cancelado" },
  reprovado: { icon: XCircle, className: "text-destructive bg-destructive/10", label: "Reprovado" },
};

export function RecentActivity({ solicitacoes }: Props) {
  const recent = useMemo(() => {
    return [...solicitacoes].slice(0, 5);
  }, [solicitacoes]);

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Últimas Solicitações</p>
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma solicitação encontrada</p>
      ) : (
        <div className="space-y-2">
          {recent.map((sol) => {
            const cfg = statusConfig[sol.status] || statusConfig.pendente;
            const Icon = cfg.icon;
            return (
              <div key={sol.id} className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.className}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate">{sol.tipo}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sol.solicitante} · {sol.dataCriacao.split(",")[0]}</p>
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
