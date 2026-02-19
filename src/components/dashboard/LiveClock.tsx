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
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border flex items-center gap-3">
      <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
        <span className="text-primary-foreground text-lg">📅</span>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase">{dayName}, {date}</p>
        <p className="text-2xl font-bold text-foreground tracking-tight">{time}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>
    </div>
  );
}
