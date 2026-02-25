import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  const dayName = days[now.getDay()];
  const date = `${String(now.getDate()).padStart(2, "0")}/${months[now.getMonth()]}/${now.getFullYear()}`;
  const time = now.toLocaleTimeString("pt-BR", { hour12: false });

  return (
    <div className="bg-card rounded-xl p-3.5 shadow-sm border border-border hover:shadow-md transition-shadow flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <span className="text-primary-foreground text-base">📅</span>
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{dayName}, {date}</p>
        <p className="text-xl font-bold text-foreground tracking-tight leading-tight">{time}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
      </div>
    </div>
  );
}
