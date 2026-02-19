import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  title: string;
  pendente: number;
  resolvido: number;
  cancelado: number;
}

const COLORS = [
  "hsl(45, 90%, 52%)",  // pendente - amber
  "hsl(142, 50%, 45%)", // resolvido - green
  "hsl(0, 65%, 55%)",   // cancelado - red
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded px-3 py-1.5 text-sm shadow">
        <p className="font-medium text-foreground">{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function DonutChart({ title, pendente, resolvido, cancelado }: DonutChartProps) {
  const total = pendente + resolvido + cancelado;
  const data = [
    { name: "Pendentes", value: pendente },
    { name: "Resolvidos", value: resolvido },
    { name: "Cancelados", value: cancelado },
  ];

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">{title}</p>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={42}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-foreground">{total}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[0] }} />
            <span className="text-muted-foreground">Pendentes</span>
            <span className="font-semibold text-foreground ml-auto">{pendente}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[1] }} />
            <span className="text-muted-foreground">Resolvidos</span>
            <span className="font-semibold text-foreground ml-auto">{resolvido}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[2] }} />
            <span className="text-muted-foreground">Cancelados</span>
            <span className="font-semibold text-foreground ml-auto">{cancelado}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
