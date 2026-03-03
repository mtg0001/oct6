import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Small delay so it doesn't flash immediately
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  const handleAllow = async () => {
    await Notification.requestPermission();
    setShow(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="bg-primary/10 rounded-full p-2 shrink-0">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Deseja ativar notificações?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Receba alertas quando novos chamados ou solicitações chegarem.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAllow}>
              Ativar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShow(false)}>
              Agora não
            </Button>
          </div>
        </div>
        <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
