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
    <div className="flex items-center gap-3 bg-card rounded-2xl px-4 py-2.5 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="text-right">
        <p className="text-[10px] text-muted-foreground font-semibold tracking-wide">{dayName}, {date}</p>
        <p className="text-lg font-extrabold text-foreground tracking-tight leading-tight tabular-nums">{time}</p>
      </div>
      <div className="h-8 w-[1px] bg-border" />
      <div className="flex items-center">
        <div className="relative">
          <Wifi className="h-4 w-4 text-success" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-success rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
