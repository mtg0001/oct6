import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  const dayName = days[now.getDay()];
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", { hour12: false });

  return (
    <div className="flex items-center gap-2.5 bg-card rounded-xl px-3 py-2 border border-border shadow-sm">
      <div className="text-right">
        <p className="text-[10px] text-muted-foreground font-medium">{dayName}, {date}</p>
        <p className="text-base font-bold text-foreground tracking-tight leading-tight tabular-nums">{time}</p>
      </div>
      <div className="flex items-center gap-1">
        <Wifi className="h-3 w-3 text-success" />
      </div>
    </div>
  );
}
