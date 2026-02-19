import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoesLogistica } from "@/hooks/useSolicitacoes";
import { cancelarSolicitacao, concluirSolicitacao } from "@/stores/solicitacoesStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Package } from "lucide-react";

const statusMap: Record<string, string> = {
  pendentes: "pendente",
  resolvidos: "resolvido",
  cancelados: "cancelado",
};

const labelMap: Record<string, string> = {
  pendentes: "Pendentes",
  resolvidos: "Resolvidos",
  cancelados: "Cancelados",
};

const LogisticaCompras = () => {
  const { filtro } = useParams<{ filtro: string }>();
  const navigate = useNavigate();
  const storeStatus = statusMap[filtro || "pendentes"];
  const solicitacoes = useSolicitacoesLogistica(storeStatus);
  const [busca, setBusca] = useState("");

  const filtered = solicitacoes.filter((s) =>
    !busca ||
    s.tipo.toLowerCase().includes(busca.toLowerCase()) ||
    s.solicitante.toLowerCase().includes(busca.toLowerCase()) ||
    s.unidade.toLowerCase().includes(busca.toLowerCase())
  );

  const label = labelMap[filtro || "pendentes"] || "Pendentes";
  const isPendente = filtro === "pendentes";

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Logística &amp; Compras</h1>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input
          placeholder="Tipo, solicitante, unidade..."
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
              <Package className="h-5 w-5" />
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
            <div className="flex gap-2">
              {isPendente && (
                <>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => concluirSolicitacao(sol.id)}>
                    Resolver
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => cancelarSolicitacao(sol.id)}>
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default LogisticaCompras;
