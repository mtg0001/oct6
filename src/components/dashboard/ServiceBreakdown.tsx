import { useMemo } from "react";
import type { SolicitacaoColaborador } from "@/stores/solicitacoesStore";

interface Props {
  solicitacoes: SolicitacaoColaborador[];
}

export function ServiceBreakdown({ solicitacoes }: Props) {
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    solicitacoes.forEach((s) => {
      counts[s.tipo] = (counts[s.tipo] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [solicitacoes]);

  const max = breakdown.length > 0 ? breakdown[0][1] : 1;

  const barColors = [
    "bg-primary",
    "bg-accent",
    "bg-success",
    "bg-warning",
    "bg-destructive",
  ];

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3" translate="no">Top Serviços</p>
      {breakdown.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
      ) : (
        <div className="space-y-2.5">
          {breakdown.map(([tipo, count], i) => (
            <div key={tipo}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-foreground font-medium truncate max-w-[70%]">{tipo}</span>
                <span className="text-[11px] font-bold text-foreground">{count}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColors[i] || barColors[0]}`}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
