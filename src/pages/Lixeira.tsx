import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoesExcluidas } from "@/hooks/useSolicitacoes";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { restaurarSolicitacao, loadSolicitacoesExcluidas } from "@/stores/solicitacoesStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { getIconForTipo } from "@/lib/solicitacaoIcons";
import { PrioridadeBadge, sortByPrioridade } from "@/components/forms/PrioridadeSelect";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

const Lixeira = () => {
  const currentUser = useCurrentUser();
  const solicitacoes = useSolicitacoesExcluidas();
  const [busca, setBusca] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);

  const canDelete = currentUser?.podeExcluirChamado || false;

  const filtered = solicitacoes
    .filter(
      (s) =>
        !busca ||
        s.tipo.toLowerCase().includes(busca.toLowerCase()) ||
        s.solicitante.toLowerCase().includes(busca.toLowerCase()) ||
        s.unidade.toLowerCase().includes(busca.toLowerCase())
    )
    .sort(sortByPrioridade);

  const handleRestore = async (solId: string) => {
    if (!canDelete) {
      toast.error("Você não tem permissão para restaurar chamados");
      return;
    }
    setRestoring(solId);
    try {
      await restaurarSolicitacao(solId);
      await loadSolicitacoesExcluidas();
      toast.success("Chamado restaurado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao restaurar: " + err.message);
    } finally {
      setRestoring(null);
    }
  };

  const getDaysRemaining = (excluidoEm: string) => {
    if (!excluidoEm) return null;
    const deleted = new Date(excluidoEm);
    const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Lixeira de Chamados</h1>
        <p className="text-sm text-muted-foreground">
          Chamados excluídos são mantidos por 30 dias antes de serem removidos permanentemente.
          {!canDelete && " Você pode apenas visualizar."}
        </p>
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
          <p className="text-muted-foreground text-sm py-8 text-center">Nenhum chamado na lixeira.</p>
        )}
        {filtered.map((sol) => {
          const Icon = getIconForTipo(sol.tipo);
          // Access raw data for excluido_em - we need to store it
          return (
            <div
              key={sol.id}
              className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4 shadow-sm opacity-75"
            >
              <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <PrioridadeBadge value={sol.prioridade} />
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Data</span>
                  <span className="font-medium">{sol.dataCriacao}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Tipo</span>
                  <span className="font-medium text-xs">{sol.tipo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Unidade</span>
                  <Badge variant="outline">{sol.unidade === "goiania" ? "GO" : "SP"}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Solicitante</span>
                  <span className="font-medium text-xs">{sol.solicitante}</span>
                </div>
              </div>
              {canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={restoring === sol.id}
                  onClick={() => handleRestore(sol.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  {restoring === sol.id ? "Restaurando..." : "Restaurar"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Lixeira;
