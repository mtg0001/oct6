import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { SolicitacaoColaborador } from "@/stores/solicitacoesStore";

interface Props {
  solicitacoes: SolicitacaoColaborador[];
  chamadosTI?: any[];
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

// Serviços colors
const SERV_ABERTAS = "hsl(35, 80%, 55%)";
const SERV_RESOLVIDAS = "hsl(142, 45%, 42%)";
const SERV_CANCELADAS = "hsl(0, 50%, 35%)";

// TI colors
const TI_ABERTAS = "hsl(45, 90%, 52%)";
const TI_RESOLVIDAS = "hsl(210, 60%, 50%)";
const TI_CANCELADAS = "hsl(0, 65%, 55%)";

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("pt-BR");
    const dayLabel = d
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase();
    days.push({ date: d, dateStr, dayLabel });
  }
  return days;
}

export function ActivityChart({ solicitacoes, chamadosTI }: Props) {
  const days = useMemo(() => getLast7Days(), []);

  const servData = useMemo(() => {
    return days.map(({ dateStr, dayLabel }) => {
      const daySols = solicitacoes.filter((s) => s.dataCriacao.startsWith(dateStr));
      return {
        day: dayLabel,
        Abertas: daySols.length,
        Resolvidas: daySols.filter((s) => s.status === "resolvido").length,
        Canceladas: daySols.filter((s) => s.status === "cancelado").length,
      };
    });
  }, [solicitacoes, days]);

  const tiData = useMemo(() => {
    if (!chamadosTI) return null;
    return days.map(({ dayLabel, date }) => {
      const dayStr = date.toISOString().slice(0, 10);
      const dayChamados = chamadosTI.filter((c) => c.criadoEm?.slice(0, 10) === dayStr);
      return {
        day: dayLabel,
        Abertas: dayChamados.length,
        Resolvidas: dayChamados.filter((c) => c.status === "resolvido").length,
        Canceladas: dayChamados.filter((c) => c.status === "cancelado").length,
      };
    });
  }, [chamadosTI, days]);

  const showTI = !!tiData;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
      {/* Serviços Chart */}
      <div className={showTI ? "mb-4" : ""}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Serviços — Últimos 7 dias
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERV_ABERTAS }} />
              <span className="text-[10px] text-muted-foreground font-medium">Abertas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERV_RESOLVIDAS }} />
              <span className="text-[10px] text-muted-foreground font-medium">Resolvidas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERV_CANCELADAS }} />
              <span className="text-[10px] text-muted-foreground font-medium">Canceladas</span>
            </div>
          </div>
        </div>
        <div className={showTI ? "h-[140px]" : "h-[200px] sm:h-[220px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={servData} barGap={1} barCategoryGap="30%">
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
              <Bar dataKey="Abertas" fill={SERV_ABERTAS} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Resolvidas" fill={SERV_RESOLVIDAS} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Canceladas" fill={SERV_CANCELADAS} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TI Chart */}
      {showTI && (
        <div>
          <div className="flex items-center justify-between mb-3 pt-3 border-t border-border">
            <p className="text-[10px] font-bold text-destructive/70 uppercase tracking-widest">
              TI — Últimos 7 dias
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TI_ABERTAS }} />
                <span className="text-[10px] text-muted-foreground font-medium">Abertas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TI_RESOLVIDAS }} />
                <span className="text-[10px] text-muted-foreground font-medium">Resolvidas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TI_CANCELADAS }} />
                <span className="text-[10px] text-muted-foreground font-medium">Canceladas</span>
              </div>
            </div>
          </div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tiData} barGap={1} barCategoryGap="30%">
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
                <Bar dataKey="Abertas" fill={TI_ABERTAS} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Resolvidas" fill={TI_RESOLVIDAS} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Canceladas" fill={TI_CANCELADAS} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
