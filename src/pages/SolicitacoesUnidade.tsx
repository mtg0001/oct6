import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoes } from "@/hooks/useSolicitacoes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { getIconForTipo } from "@/lib/solicitacaoIcons";

const statusMap: Record<string, string[]> = {
  pendentes: ["pendente", "aprovado_diretor", "aprovado"],
  resolvidos: ["resolvido"],
  cancelados: ["cancelado"],
};

const labelMap: Record<string, string> = {
  pendentes: "Pendentes",
  resolvidos: "Resolvidos",
  cancelados: "Cancelados",
};

interface Props {
  unidadeFilter: string;
  title: string;
}

const SolicitacoesUnidade = ({ unidadeFilter, title }: Props) => {
  const { filtro } = useParams<{ filtro: string }>();
  const navigate = useNavigate();
  const allSolicitacoes = useSolicitacoes();
  const [busca, setBusca] = useState("");

  const statuses = statusMap[filtro || "pendentes"] || statusMap.pendentes;

  const solicitacoes = allSolicitacoes.filter(
    (s) => s.unidade === unidadeFilter && statuses.includes(s.status)
  );

  const filtered = solicitacoes.filter((s) =>
    !busca ||
    s.tipo.toLowerCase().includes(busca.toLowerCase()) ||
    s.solicitante.toLowerCase().includes(busca.toLowerCase())
  );

  const label = labelMap[filtro || "pendentes"] || "Pendentes";
  const routePrefix = unidadeFilter === "goiania" ? "solicitacoes-go" : "solicitacoes-sp";

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input
          placeholder="Tipo, solicitante..."
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
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {(() => { const Icon = getIconForTipo(sol.tipo); return <Icon className="h-5 w-5" />; })()}
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Data</span>
                <span className="font-medium">{sol.dataCriacao}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Solicitante</span>
                <span className="font-medium">{sol.solicitante}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Unidade</span>
                <Badge variant="outline">{sol.unidade === "goiania" ? "GO" : "SP"}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Tipo</span>
                <span className="font-medium text-xs">{sol.tipo}</span>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/${routePrefix}/${filtro || "pendentes"}/solicitacao/${sol.id}`)}>
              Ver
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default SolicitacoesUnidade;
