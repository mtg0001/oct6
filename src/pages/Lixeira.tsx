import { AppLayout } from "@/components/AppLayout";
import { useSolicitacoesExcluidas } from "@/hooks/useSolicitacoes";
import { useCurrentUser } from "@/hooks/useUsuarios";
import { restaurarSolicitacao, loadSolicitacoesExcluidas, esvaziarLixeira } from "@/stores/solicitacoesStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { getIconForTipo } from "@/lib/solicitacaoIcons";
import { PrioridadeBadge, sortByPrioridade } from "@/components/forms/PrioridadeSelect";
import { RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { siglaUnidade } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Lixeira = () => {
  const currentUser = useCurrentUser();
  const solicitacoes = useSolicitacoesExcluidas();
  const [busca, setBusca] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);

  const canDelete = currentUser?.podeExcluirChamado || false;

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      await esvaziarLixeira();
      toast.success("Lixeira esvaziada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao esvaziar lixeira: " + err.message);
    } finally {
      setEmptying(false);
    }
  };

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
        {canDelete && solicitacoes.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1" disabled={emptying}>
                {emptying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {emptying ? "Esvaziando..." : "Esvaziar Lixeira"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Esvaziar lixeira?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação é irreversível. Todos os <strong>{solicitacoes.length}</strong> chamado(s) na lixeira serão removidos permanentemente do banco de dados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Esvaziar permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
                  <span className="font-medium text-xs">{sol.tipo === "CAD" ? "CS" : sol.tipo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Unidade</span>
                  <Badge variant="outline">{siglaUnidade(sol.unidade)}</Badge>
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
