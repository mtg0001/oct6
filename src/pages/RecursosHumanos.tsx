import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoesByStatus } from "@/hooks/useSolicitacoes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const statusConfig: Record<string, { storeStatus: string; label: string }> = {
  pendentes: { storeStatus: "aprovado", label: "Pendentes" },
  resolvidos: { storeStatus: "resolvido", label: "Resolvidos" },
  cancelados: { storeStatus: "cancelado", label: "Cancelados" },
  reprovados: { storeStatus: "reprovado", label: "Reprovados" },
};

const prioridadeCores: Record<string, string> = {
  baixa: "bg-blue-100 text-blue-800",
  media: "bg-yellow-100 text-yellow-800",
  alta: "bg-red-100 text-red-800",
  urgente: "bg-red-200 text-red-900",
};

const RecursosHumanos = () => {
  const { filtro } = useParams<{ filtro: string }>();
  const navigate = useNavigate();
  const config = statusConfig[filtro || "pendentes"] || statusConfig.pendentes;
  const solicitacoes = useSolicitacoesByStatus(config.storeStatus);
  const [busca, setBusca] = useState("");

  const filtered = solicitacoes.filter((s) => {
    return (
      !busca ||
      s.evento.toLowerCase().includes(busca.toLowerCase()) ||
      s.solicitante.toLowerCase().includes(busca.toLowerCase()) ||
      s.unidade.toLowerCase().includes(busca.toLowerCase())
    );
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Recursos Humanos</h1>
        <p className="text-sm text-muted-foreground">{config.label}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input
          placeholder="Evento, solicitante, unidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-3">{filtered.length} registro(s)</p>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma solicitação nesta fila.</p>
        )}
        {filtered.map((sol) => (
          <div
            key={sol.id}
            className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4 shadow-sm"
          >
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center shrink-0">
              {sol.unidade === "goiania" ? "GO" : "SP"}
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Data</span>
                <span className="font-medium">{sol.dataCriacao}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Colaborador</span>
                <span className="font-medium">{sol.solicitante}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Evento</span>
                <span className="font-medium">{sol.evento || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Prioridade</span>
                <Badge className={prioridadeCores[sol.prioridade] || "bg-muted text-muted-foreground"}>
                  {sol.prioridade ? sol.prioridade.charAt(0).toUpperCase() + sol.prioridade.slice(1) : "—"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Tipo</span>
                <span className="font-medium">Solicitação de Colaborador</span>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/rh/${filtro || "pendentes"}/solicitacao/${sol.id}`)}>
              Ver
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default RecursosHumanos;
