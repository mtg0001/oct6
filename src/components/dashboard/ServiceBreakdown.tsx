import { useMemo } from "react";
import type { SolicitacaoColaborador } from "@/stores/solicitacoesStore";

interface Props {
  solicitacoes: SolicitacaoColaborador[];
}

const barColors = [
  "from-primary to-primary/70",
  "from-accent to-accent/70",
  "from-success to-success/70",
  "from-warning to-warning/70",
  "from-destructive to-destructive/70",
];

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

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4" translate="no">Top Serviços</p>
      {breakdown.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
      ) : (
        <div className="space-y-3">
          {breakdown.map(([tipo, count], i) => (
            <div key={tipo}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-foreground font-semibold truncate max-w-[70%]">{tipo}</span>
                <span className="text-[11px] font-extrabold text-foreground tabular-nums">{count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColors[i] || barColors[0]} transition-all duration-700 ease-out`}
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
