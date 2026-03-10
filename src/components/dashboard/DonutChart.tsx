import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  title: string;
  pendente: number;
  resolvido: number;
  cancelado: number;
  variant?: "default" | "ti";
}

const COLORS = [
  "hsl(45, 90%, 52%)",
  "hsl(142, 50%, 45%)",
  "hsl(0, 65%, 55%)",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-1.5 text-xs shadow-lg backdrop-blur-sm">
        <p className="font-semibold text-foreground">{payload[0].name}: <span className="text-primary">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export function DonutChart({ title, pendente, resolvido, cancelado, variant = "default" }: DonutChartProps) {
  const total = pendente + resolvido + cancelado;
  const data = [
    { name: "Pendentes", value: pendente },
    { name: "Resolvidos", value: resolvido },
    { name: "Cancelados", value: cancelado },
  ];

  const isTI = variant === "ti";

  const hoverColor = isTI ? "group-hover:text-destructive" : "group-hover:text-primary";

  return (
    <div className={`relative bg-card rounded-2xl p-4 shadow-sm border hover:shadow-lg transition-all duration-300 group ${isTI ? "border-destructive/20" : "border-border"}`}>
      <span className={`absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest ${isTI ? "text-destructive/60" : "text-primary/50"} ${hoverColor} transition-colors duration-300`}>
        {isTI ? "TI" : "Serviços"}
      </span>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isTI ? "text-destructive/70" : "text-muted-foreground"}`}>{title}</p>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={window.innerWidth < 640 ? 18 : 24}
                outerRadius={window.innerWidth < 640 ? 28 : 38}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm sm:text-base font-extrabold text-foreground">{total}</span>
          </div>
        </div>
        <div className="space-y-1 sm:space-y-1.5 min-w-0 overflow-hidden">
          {[
            { label: "Pendentes", value: pendente, color: COLORS[0] },
            { label: "Resolvidos", value: resolvido, color: COLORS[1] },
            { label: "Cancelados", value: cancelado, color: COLORS[2] },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px]">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-muted-foreground truncate">{item.label}</span>
              <span className="font-bold text-foreground ml-auto tabular-nums shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
