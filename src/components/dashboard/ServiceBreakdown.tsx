import { useMemo } from "react";
import type { SolicitacaoColaborador } from "@/stores/solicitacoesStore";

interface Props {
  solicitacoes: SolicitacaoColaborador[];
  chamadosTI?: any[];
}

const servBarColors = [
  "from-primary to-primary/70",
  "from-accent to-accent/70",
  "from-success to-success/70",
  "from-warning to-warning/70",
  "from-destructive to-destructive/70",
];

const tiBarColors = [
  "from-destructive to-destructive/60",
  "from-blue-500 to-blue-400",
  "from-amber-500 to-amber-400",
  "from-rose-400 to-rose-300",
  "from-red-800 to-red-600",
];

export function ServiceBreakdown({ solicitacoes, chamadosTI }: Props) {
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    solicitacoes.forEach((s) => {
      counts[s.tipo] = (counts[s.tipo] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [solicitacoes]);

  const tiBreakdown = useMemo(() => {
    if (!chamadosTI) return null;
    const counts: Record<string, number> = {};
    chamadosTI.forEach((c) => {
      counts[c.categoria] = (counts[c.categoria] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [chamadosTI]);

  const max = breakdown.length > 0 ? breakdown[0][1] : 1;
  const tiMax = tiBreakdown && tiBreakdown.length > 0 ? tiBreakdown[0][1] : 1;

  const showTI = !!tiBreakdown;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border h-full">
      {/* Serviços */}
      <div className={showTI ? "mb-4" : ""}>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          Top Serviços
        </p>
        {breakdown.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
        ) : (
          <div className="space-y-2.5">
            {breakdown.map(([tipo, count], i) => (
              <div key={tipo}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-foreground font-semibold truncate max-w-[70%]">{tipo}</span>
                  <span className="text-[11px] font-extrabold text-foreground tabular-nums">{count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${servBarColors[i] || servBarColors[0]} transition-all duration-700 ease-out`}
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TI */}
      {showTI && (
        <div className="pt-3 border-t border-border">
          <p className="text-[10px] font-bold text-destructive/70 uppercase tracking-widest mb-3">
            Top Chamados TI
          </p>
          {tiBreakdown!.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
          ) : (
            <div className="space-y-2.5">
              {tiBreakdown!.map(([tipo, count], i) => (
                <div key={tipo}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-foreground font-semibold truncate max-w-[70%]">{tipo}</span>
                    <span className="text-[11px] font-extrabold text-foreground tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${tiBarColors[i] || tiBarColors[0]} transition-all duration-700 ease-out`}
                      style={{ width: `${(count / tiMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
