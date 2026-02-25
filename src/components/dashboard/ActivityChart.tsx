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
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold">{p.value}</span>
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
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Atividade — Últimos 7 dias</p>
      </div>
      <div className="h-[200px] sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
            <Bar
              dataKey="Abertas"
              fill="hsl(35, 80%, 55%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="Resolvidas"
              fill="hsl(142, 45%, 42%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
