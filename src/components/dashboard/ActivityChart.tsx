import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { SolicitacaoColaborador } from "@/stores/solicitacoesStore";

interface Props {
  solicitacoes: SolicitacaoColaborador[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs backdrop-blur-sm">
        <p className="font-bold text-foreground mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-md" style={{ background: p.fill }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-bold tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ActivityChart({ solicitacoes }: Props) {
  const chartData = useMemo(() => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("pt-BR");
      const dayLabel = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();

      const daySols = solicitacoes.filter((s) => s.dataCriacao.startsWith(dateStr));
      last7.push({
        day: dayLabel,
        Abertas: daySols.length,
        Resolvidas: daySols.filter((s) => s.status === "resolvido").length,
      });
    }
    return last7;
  }, [solicitacoes]);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Atividade — Últimos 7 dias</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-md" style={{ background: "hsl(35, 80%, 55%)" }} />
            <span className="text-[10px] text-muted-foreground font-medium">Abertas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-md" style={{ background: "hsl(142, 45%, 42%)" }} />
            <span className="text-[10px] text-muted-foreground font-medium">Resolvidas</span>
          </div>
        </div>
      </div>
      <div className="h-[200px] sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={25}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)", radius: 6 }} />
            <Bar
              dataKey="Abertas"
              fill="hsl(35, 80%, 55%)"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="Resolvidas"
              fill="hsl(142, 45%, 42%)"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
